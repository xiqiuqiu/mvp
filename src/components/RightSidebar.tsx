import React, { useState, useEffect, useRef } from 'react';
import type { VoiceResult, TerminalLog } from '../types/atc';

interface RightSidebarProps {
  voice: VoiceResult;
  terminalLogs: TerminalLog[];
  onMicPressStore: () => void;
  onMicReleaseStore: () => void;
  onSendInstruction: (text: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  voice,
  terminalLogs,
  onMicPressStore,
  onMicReleaseStore,
  onSendInstruction
}) => {
  const isListening = voice.status === 'listening';
  const [inputText, setInputText] = useState('');
  const terminalLogsRef = useRef<HTMLDivElement>(null);

  // Auto-fill voice text
  useEffect(() => {
    if (voice.text && voice.status !== 'idle') {
      setInputText(voice.text);
    }
  }, [voice.text, voice.status]);

  // Auto scroll terminal to top
  useEffect(() => {
    if (terminalLogsRef.current) {
      terminalLogsRef.current.scrollTop = 0;
    }
  }, [terminalLogs]);


  const handleExecute = () => {
    if (inputText.trim()) {
      onSendInstruction(inputText.trim());
      setInputText('');
    }
  };

  const handleShortcut = (cmd: string) => {
    onSendInstruction(cmd);
    setInputText('');
  };

  return (
    <div className="right-sidebar">
      {/* 1. Command Input */}
      <div className="sidebar-section">
        <div className="section-title">
          <span className="icon">🎙</span> Voice / Text Command
        </div>
        <div className="command-box">
          <textarea
            className="command-textarea"
            placeholder="e.g. Taxi to holding point Runway 05L via taxiway M, J and A"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="command-actions">
            {isListening && (
              <div className="voice-waveform gemini-waveform">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="wave-bar active" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
            <button 
              className={`mic-button-small ${isListening ? 'listening' : ''}`}
              onMouseDown={onMicPressStore} onMouseUp={onMicReleaseStore}
              onMouseLeave={onMicReleaseStore} onTouchStart={onMicPressStore}
              onTouchEnd={onMicReleaseStore}
            >🎙</button>
            <button className="execute-button" onClick={handleExecute}>
              <span className="icon">➤</span> EXECUTE
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Demo Scenarios */}
      <div className="sidebar-section">
        <div className="section-title-sub">Quick Demo Scenarios:</div>
        <div className="scenarios-list">
          <button className="scenario-btn" onClick={() => handleShortcut("Taxi from A1 via taxiway A to holding point Runway 05L at A10")}>
            1. 北跑道直行: "A1 to RWY 05L via A to A10"
          </button>
          <button className="scenario-btn" onClick={() => handleShortcut("Taxi from A10 via A and D to D7")}>
            2. 联络道转向: "A10 to D7 via A, D"
          </button>
        </div>
      </div>

      {/* 3. LLM Terminal */}
      <div className="sidebar-section terminal-section">
        <div className="section-title">
          <span className="icon">⌨</span> LLM Parser Terminal
        </div>
        <div className="terminal-window" ref={terminalLogsRef}>
          {[...terminalLogs].reverse().map((log) => (
            <div key={log.id} className="log-line">
              <span className="log-time">{log.time}</span>
              <span className={`log-msg ${log.type}`}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
