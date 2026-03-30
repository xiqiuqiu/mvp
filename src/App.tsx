import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { RightSidebar } from './components/RightSidebar';
import { AirportCanvas } from './components/AirportCanvas';
import { InstructionPanel } from './components/InstructionPanel';
import { OverlaySlider } from './components/OverlaySlider';

import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useInstructionParser } from './hooks/useInstructionParser';
import { useTopologyResolver } from './hooks/useTopologyResolver';
import type { TaxiNode, ValidationResult, TerminalLog } from './types/atc';

function App() {
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    setTerminalLogs(prev => [...prev, { id: Math.random().toString(), time: `[${time}]`, message, type }]);
  }, []);

  const { voice, startListening, stopListening } = useVoiceRecognition();
  const { instruction, llmStatus, parseInstruction } = useInstructionParser(addLog);
  const { resolve, topology } = useTopologyResolver();

  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const [resolvedPath, setResolvedPath] = useState<TaxiNode[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ connected: true, errors: [] });

  // Init log
  useEffect(() => {
    addLog("System initialized. Awaiting ATC instructions.", 'info');
  }, [addLog]);

  // When voice status changes to 'done', trigger parsing
  useEffect(() => {
    if (voice.status === 'done' && voice.text) {
      if (voice.confidence < 0.6) {
        addLog(`Low voice confidence: "${voice.text}". Please speak more clearly.`, 'error');
        return;
      }
      parseInstruction(voice.text);
    }
  }, [voice.status, voice.text, voice.confidence, parseInstruction]);

  // When new instruction arrives, resolve topology
  useEffect(() => {
    if (instruction) {
      const { path, validation: valResp } = resolve(instruction);
      setResolvedPath(path);
      setValidation(valResp);
      if (!valResp.connected) {
        addLog(`Validation Error: Path disconnected at constraints.`, 'error');
      }
    }
  }, [instruction, resolve, addLog]);

  return (
    <div className="app-container">
      <TopBar llmStatus={llmStatus} />
      
      <div className="content-layout">
        <div className="main-area">
          <AirportCanvas 
            topology={topology}
            highlightPath={resolvedPath}
            overlayOpacity={overlayOpacity}
          />
          <div className="overlays">
            <OverlaySlider opacity={overlayOpacity} onChange={setOverlayOpacity} />
            <InstructionPanel instruction={instruction} validation={validation} />
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
