// src/hooks/useVoiceRecognition.ts
import { useState, useCallback, useRef } from 'react';
import type { VoiceResult } from '../types/atc';

export function useVoiceRecognition() {
  const [result, setResult] = useState<VoiceResult>({
    text: '', confidence: 0, status: 'idle',
  });
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    // Check if the API is supported (Web Speech API)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      setResult(r => ({ ...r, status: 'error' }));
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // English is standard for ATC
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setResult(r => ({ ...r, status: 'listening' }));
    };

    recognition.onresult = (event: any) => {
      const res = event.results[0][0];
      setResult({
        text: res.transcript,
        confidence: res.confidence,
        status: 'done',
      });
    };

    recognition.onerror = () => {
      setResult(r => ({ ...r, status: 'error' }));
    };

    recognition.onend = () => {
      setResult(r =>
        r.status === 'listening' ? { ...r, status: 'idle' } : r
      );
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { voice: result, startListening: start, stopListening: stop };
}
