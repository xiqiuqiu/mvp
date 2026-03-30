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
      alert("当前浏览器不支持语音识别（可能是因为在手机端未开启HTTPS），请使用HTTPS访问或更换浏览器。");
      setResult(r => ({ ...r, status: 'error' }));
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; // 改为支持中文
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

    recognition.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      alert(`语音识别报错：${e.error || '未知错误'}`);
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
