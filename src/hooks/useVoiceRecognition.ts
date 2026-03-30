// src/hooks/useVoiceRecognition.ts
import { useState, useCallback, useRef } from 'react';
import type { VoiceResult } from '../types/atc';

export function useVoiceRecognition() {
  const [result, setResult] = useState<VoiceResult>({
    text: '', interimText: '', confidence: 0, status: 'idle',
  });
  const recognitionRef = useRef<any>(null);

  const start = useCallback(() => {
    // Immediately update UI state
    setResult(r => ({ ...r, status: 'listening', interimText: '', text: '' }));

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      setResult(r => ({ ...r, status: 'error' }));
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;  // Enable real-time transcription
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setResult({
          text: final,
          interimText: '',
          confidence: event.results[event.results.length - 1][0].confidence,
          status: 'done',
        });
      } else {
        setResult(r => ({ ...r, interimText: interim }));
      }
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
