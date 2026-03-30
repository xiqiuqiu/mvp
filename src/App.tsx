// src/App.tsx
import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { VoiceBar } from './components/VoiceBar';
import { AirportCanvas } from './components/AirportCanvas';
import { InstructionPanel } from './components/InstructionPanel';
import { OverlaySlider } from './components/OverlaySlider';

import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useInstructionParser } from './hooks/useInstructionParser';
import { useTopologyResolver } from './hooks/useTopologyResolver';
import type { TaxiNode, ValidationResult } from './types/atc';

function App() {
  const { voice, startListening, stopListening } = useVoiceRecognition();
  const { instruction, llmStatus, parseInstruction } = useInstructionParser();
  const { resolve, topology } = useTopologyResolver();

  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const [resolvedPath, setResolvedPath] = useState<TaxiNode[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ connected: true, errors: [] });

  // When voice status changes to 'done', trigger parsing
  useEffect(() => {
    if (voice.status === 'done' && voice.text) {
      // Basic confidence check
      if (voice.confidence < 0.6) {
        alert("Low confidence in voice recognition. Please speak clearly and try again.");
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
    }
  }, [instruction, resolve]);

  return (
    <div className="app-container">
      <TopBar llmStatus={llmStatus} />
      
      <div className="main-area">
        <AirportCanvas 
          topology={topology}
          highlightPath={resolvedPath}
          overlayOpacity={overlayOpacity}
        />
        
        <div className="overlays">
          <OverlaySlider 
            opacity={overlayOpacity} 
            onChange={setOverlayOpacity} 
          />
          <InstructionPanel 
            instruction={instruction} 
            validation={validation} 
          />
        </div>
      </div>
      
      <VoiceBar 
        voice={voice}
        onMicPressStore={startListening}
        onMicReleaseStore={stopListening}
      />
    </div>
  );
}

export default App;
