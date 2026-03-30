// src/hooks/useInstructionParser.ts
import { useState, useCallback } from 'react';
import type { ParsedInstruction } from '../types/atc';
import { SYSTEM_PROMPT, buildUserPrompt } from '../utils/llmPrompt';

export function useInstructionParser() {
  const [instruction, setInstruction] =
    useState<ParsedInstruction | null>(null);
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const parseInstruction = useCallback(async (text: string) => {
    setStatus('loading');
    try {
      const res = await fetch(import.meta.env.VITE_LLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_LLM_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(text) },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      });
      const data = await res.json();
      const content = data.choices[0].message.content;
      const parsed: ParsedInstruction = JSON.parse(content);
      setInstruction(parsed);
      setStatus('done');
      return parsed;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { instruction, llmStatus: status, parseInstruction };
}
