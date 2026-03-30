import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "./components/TopBar";
import { RightSidebar } from "./components/RightSidebar";
import { AirportCanvas } from "./components/AirportCanvas";
import { InstructionPanel } from "./components/InstructionPanel";

import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import { useInstructionParser } from "./hooks/useInstructionParser";
import { useTopologyResolver } from "./hooks/useTopologyResolver";
import type { TaxiNode, ValidationResult, TerminalLog } from "./types/atc";

function App() {
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(5).fill(0));
  const reqRef = useRef<number>(0);

  const addLog = useCallback(
    (message: string, type: TerminalLog["type"] = "info") => {
      const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      setTerminalLogs((prev) => [
        ...prev,
        { id: Math.random().toString(), time: `[${time}]`, message, type },
      ]);
    },
    [],
  );

  const { voice, startListening, stopListening } = useVoiceRecognition();
  const { instruction, llmStatus, parseInstruction } =
    useInstructionParser(addLog);
  const { resolve, topology } = useTopologyResolver();

  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const [resolvedPath, setResolvedPath] = useState<TaxiNode[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({
    connected: true,
    errors: [],
  });

  // Init log
  useEffect(() => {
    addLog("系统初始化完成。等待 ATC 指令。", "info");
  }, [addLog]);

  // When new instruction arrives, resolve topology
  useEffect(() => {
    if (instruction) {
      const { path, validation: valResp } = resolve(instruction);
      setResolvedPath(path);
      setValidation(valResp);
      if (!valResp.connected) {
        addLog(`验证错误：路径在约束点断开。`, "error");
      }
    }
  }, [instruction, resolve, addLog]);

  // Real-time Audio Level Analyzer
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    if (voice.status === "listening") {
      const startAudio = async () => {
        try {
          if (!navigator.mediaDevices)
            throw new Error("MediaDevices API undefined (Needs HTTPS)");
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          audioCtx = new window.AudioContext();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            // Derive 5 band levels (0-1)
            setAudioLevels([
              dataArray[1] / 255,
              dataArray[3] / 255,
              dataArray[6] / 255,
              dataArray[12] / 255,
              dataArray[20] / 255,
            ]);
            reqRef.current = requestAnimationFrame(update);
          };
          update();
        } catch (e: any) {
          console.error("Audio Access Error:", e);
          alert(
            `麦克风访问失败：${e.message || "可能需要在HTTPS环境下才能调用麦克风"}`,
          );
        }
      };
      startAudio();
    } else {
      setAudioLevels(Array(5).fill(0));
    }

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [voice.status]);

  return (
    <div className="app-container">
      <TopBar
        llmStatus={llmStatus}
        overlayOpacity={overlayOpacity}
        setOverlayOpacity={setOverlayOpacity}
      />

      <div className="content-layout">
        <div className="main-area">
          <AirportCanvas
            topology={topology}
            highlightPath={resolvedPath}
            overlayOpacity={overlayOpacity}
          />
          <div className="overlays">
            <InstructionPanel
              instruction={instruction}
              validation={validation}
            />
          </div>

          {/* EFB PTT Button */}
          <div
            className={`ptt-container ${voice.status === "listening" ? "active" : ""}`}
          >
            {/* Live Transcription */}
            {voice.status === "listening" && voice.interimText && (
              <div className="live-transcript">
                <span className="transcript-label">🔤 实时</span>
                <span className="transcript-text">{voice.interimText}</span>
              </div>
            )}
            <button
              className={`ptt-button ${voice.status === "listening" ? "listening" : ""}`}
              onClick={() => {
                voice.status === "listening"
                  ? stopListening()
                  : startListening();
              }}
              style={{ cursor: "pointer" }}
            >
              <span className="ptt-icon" style={{ fontSize: "28px" }}>
                {voice.status === "listening" ? "⏹" : "🎙"}
              </span>
              {voice.status === "listening" ? "停止听报" : "开始听报"}
            </button>
            <div className="ptt-waveform-container">
              {audioLevels.map((level, i) => (
                <div
                  key={i}
                  className="audio-bar"
                  style={{ height: `${Math.max(4, level * 40)}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <RightSidebar
          voice={voice}
          terminalLogs={terminalLogs}
          onMicPressStore={startListening}
          onMicReleaseStore={stopListening}
          onSendInstruction={parseInstruction}
        />
      </div>
    </div>
  );
}

export default App;
