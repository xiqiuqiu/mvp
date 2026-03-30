import { useState, useCallback } from 'react';
import type { ParsedInstruction, TerminalLog } from '../types/atc';
import { SYSTEM_PROMPT, buildUserPrompt } from '../utils/llmPrompt';

export function useInstructionParser(onLog?: (msg: string, type: TerminalLog['type']) => void) {
  const [instruction, setInstruction] =
    useState<ParsedInstruction | null>(null);
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const parseInstruction = useCallback(async (text: string) => {
    setStatus('loading');
    if (onLog) onLog(`收到 ATC 指令: "${text}"`, 'info');
    if (onLog) onLog(`正在分析意图并提取航路拓扑...`, 'process');
    try {
      let apiUrl = import.meta.env.VITE_LLM_API_URL;
      
      // Auto-append path if only base v1beta is provided
      if (apiUrl === 'https://generativelanguage.googleapis.com/v1beta' || apiUrl === '/v1beta') {
        apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      }

      if (apiUrl.startsWith('https://generativelanguage.googleapis.com')) {
        apiUrl = apiUrl.replace('https://generativelanguage.googleapis.com', '');
      } else if (apiUrl.startsWith('https://api.openai.com')) {
        apiUrl = apiUrl.replace('https://api.openai.com', '');
      }

      const res = await fetch(apiUrl, {
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
      if (onLog) {
        onLog(`LLM 解析成功。目标航点: [${parsed.route.join(' → ')}]`, 'success');
        onLog(`路径绘制已就绪，正在呈现视觉引导。`, 'process');
      }
      return parsed;
    } catch {
      setStatus('error');
      if (onLog) onLog(`解析 ATC 指令失败，请检查模型连接。`, 'error');
      return null;
    }
  }, [onLog]);

  return { instruction, llmStatus: status, parseInstruction };
}
