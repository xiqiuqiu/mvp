# Smart ATC MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a voice-driven airport taxi instruction visualizer for ZLXY, rendering highlighted paths on a real chart image.

**Architecture:** 4-module pipeline (Voice → NLU → Topology → Renderer) with React + Canvas 2D. Real airport chart as base layer with adjustable dark overlay. Zero backend.

**Tech Stack:** React 18, TypeScript, Vite, Canvas 2D, Web Speech API, Cloud LLM API

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types/atc.ts` | All TypeScript interfaces |
| `src/data/zlxy-topology.ts` | ZLXY nodes, edges, runways |
| `src/utils/pathValidator.ts` | L3 connectivity check |
| `src/utils/llmPrompt.ts` | Prompt template constant |
| `src/utils/canvasRenderer.ts` | Canvas draw functions per layer |
| `src/hooks/useVoiceRecognition.ts` | Web Speech API hook |
| `src/hooks/useInstructionParser.ts` | LLM API call + JSON parse |
| `src/hooks/useTopologyResolver.ts` | Route names → coord sequence |
| `src/components/TopBar.tsx` | Header bar |
| `src/components/AirportCanvas.tsx` | 6-layer Canvas rendering |
| `src/components/OverlaySlider.tsx` | Mask opacity slider |
| `src/components/VoiceBar.tsx` | Mic button + waveform + transcript |
| `src/components/InstructionPanel.tsx` | Parsed result overlay |
| `src/App.tsx` | Root layout + state reducer |
| `src/main.tsx` | Vite entry |
| `src/index.css` | Global styles (deep blue theme) |
| `public/charts/ZLXY81.jpg` | Real chart image |

---

## Task 1: Project Scaffolding

**Files:** Create all project config files

- [ ] **Step 1: Init Vite React-TS project**

```bash
npx -y create-vite@latest ./ -- --template react-ts
```

- [ ] **Step 2: Install dependencies & start dev server**

```bash
npm install
npm run dev
```

Expected: Vite dev server at http://localhost:5173

- [ ] **Step 3: Copy chart image**

```bash
mkdir -p public/charts
cp ZLXY81.jpg public/charts/
```

- [ ] **Step 4: Create `.env` file**

```
VITE_LLM_API_KEY=your-api-key-here
VITE_LLM_API_URL=https://api.openai.com/v1/chat/completions
VITE_LLM_MODEL=gpt-4o
```

- [ ] **Step 5: Commit**

```bash
git add -A; git commit -m "chore: scaffold Vite React-TS project"
```

---

## Task 2: Type Definitions

**Files:** Create `src/types/atc.ts`

- [ ] **Step 1: Write all interfaces**

```typescript
// src/types/atc.ts

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export type TaxiAction = 'taxi' | 'hold' | 'cross' | 'lineup';

export interface VoiceResult {
  text: string;
  confidence: number;
  status: VoiceStatus;
}

export interface ParsedInstruction {
  action: TaxiAction;
  runway: string;
  route: string[];
  holdPoint: string | null;
}

export interface TaxiNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'intersection' | 'hold' | 'gate';
  hotspot?: string;
}

export interface TaxiEdge {
  from: string;
  to: string;
  taxiway: string;
  bidirectional: boolean;
}

export interface RunwayData {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  heading: number;
}

export interface AirportTopology {
  icao: string;
  nodes: Record<string, TaxiNode>;
  edges: TaxiEdge[];
  runways: RunwayData[];
}

export interface ValidationResult {
  connected: boolean;
  errors: string[];
}

export interface AppState {
  voice: VoiceResult;
  instruction: ParsedInstruction | null;
  resolvedPath: TaxiNode[] | null;
  validation: ValidationResult;
  llmStatus: 'idle' | 'loading' | 'done' | 'error';
  overlayOpacity: number;
}

export type AppAction =
  | { type: 'VOICE_UPDATE'; payload: Partial<VoiceResult> }
  | { type: 'INSTRUCTION_PARSED'; payload: ParsedInstruction }
  | { type: 'PATH_RESOLVED'; payload: TaxiNode[] }
  | { type: 'VALIDATION_RESULT'; payload: ValidationResult }
  | { type: 'LLM_STATUS'; payload: AppState['llmStatus'] }
  | { type: 'SET_OVERLAY_OPACITY'; payload: number }
  | { type: 'RESET' };
```

- [ ] **Step 2: Commit**

```bash
git add src/types/atc.ts; git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: ZLXY Topology Data

**Files:** Create `src/data/zlxy-topology.ts`

- [ ] **Step 1: Define ZLXY topology based on real chart**

Reference ZLXY81.jpg to place node coordinates proportionally on a 1400×1000 canvas. Include major taxiways A, D, M, N, S and runways 05L/23R, 05R/23L.

```typescript
// src/data/zlxy-topology.ts
import { AirportTopology, TaxiNode, TaxiEdge, RunwayData } from '../types/atc';

const nodes: Record<string, TaxiNode> = {
  // Runway 05L/23R intersections (north runway)
  A10: { id: 'A10', x: 140, y: 220, label: 'A10', type: 'intersection' },
  A9:  { id: 'A9',  x: 240, y: 220, label: 'A9',  type: 'intersection' },
  A8:  { id: 'A8',  x: 380, y: 220, label: 'A8',  type: 'intersection' },
  A7:  { id: 'A7',  x: 480, y: 220, label: 'A7',  type: 'intersection' },
  A6:  { id: 'A6',  x: 560, y: 220, label: 'A6',  type: 'intersection', hotspot: 'HS1' },
  A5:  { id: 'A5',  x: 640, y: 220, label: 'A5',  type: 'intersection' },
  A4:  { id: 'A4',  x: 780, y: 220, label: 'A4',  type: 'intersection' },
  A3:  { id: 'A3',  x: 880, y: 220, label: 'A3',  type: 'intersection' },
  A2:  { id: 'A2',  x: 1020, y: 220, label: 'A2', type: 'intersection' },
  A1:  { id: 'A1',  x: 1160, y: 220, label: 'A1', type: 'intersection' },

  // South runway intersections (sampled)
  N13: { id: 'N13', x: 240, y: 780, label: 'N13', type: 'intersection' },
  N11: { id: 'N11', x: 680, y: 780, label: 'N11', type: 'intersection' },
  N10: { id: 'N10', x: 800, y: 780, label: 'N10', type: 'intersection' },
  N3:  { id: 'N3',  x: 880, y: 820, label: 'N3',  type: 'intersection', hotspot: 'HS4' },
  N2:  { id: 'N2',  x: 1020, y: 820, label: 'N2', type: 'intersection' },
  N1:  { id: 'N1',  x: 1160, y: 820, label: 'N1', type: 'intersection' },

  // Middle taxiway connectors (D series)
  D10: { id: 'D10', x: 380, y: 640, label: 'D10', type: 'intersection' },
  D9:  { id: 'D9',  x: 460, y: 640, label: 'D9',  type: 'intersection' },
  D8:  { id: 'D8',  x: 540, y: 640, label: 'D8',  type: 'intersection' },
  D7:  { id: 'D7',  x: 620, y: 640, label: 'D7',  type: 'intersection' },
  D4:  { id: 'D4',  x: 900, y: 680, label: 'D4',  type: 'intersection' },

  // M series (south middle)
  M14: { id: 'M14', x: 140, y: 720, label: 'M14', type: 'intersection' },
  M1:  { id: 'M1',  x: 1100, y: 720, label: 'M1', type: 'intersection' },
};

const edges: TaxiEdge[] = [
  // A taxiway (north runway, east-west)
  { from: 'A10', to: 'A9', taxiway: 'A', bidirectional: true },
  { from: 'A9', to: 'A8', taxiway: 'A', bidirectional: true },
  { from: 'A8', to: 'A7', taxiway: 'A', bidirectional: true },
  { from: 'A7', to: 'A6', taxiway: 'A', bidirectional: true },
  { from: 'A6', to: 'A5', taxiway: 'A', bidirectional: true },
  { from: 'A5', to: 'A4', taxiway: 'A', bidirectional: true },
  { from: 'A4', to: 'A3', taxiway: 'A', bidirectional: true },
  { from: 'A3', to: 'A2', taxiway: 'A', bidirectional: true },
  { from: 'A2', to: 'A1', taxiway: 'A', bidirectional: true },

  // D taxiway connectors (north-south)
  { from: 'A8', to: 'D10', taxiway: 'D', bidirectional: true },
  { from: 'D10', to: 'D9', taxiway: 'D', bidirectional: true },
  { from: 'D9', to: 'D8', taxiway: 'D', bidirectional: true },
  { from: 'D8', to: 'D7', taxiway: 'D', bidirectional: true },

  // N taxiway (south runway)
  { from: 'N13', to: 'N11', taxiway: 'N', bidirectional: true },
  { from: 'N11', to: 'N10', taxiway: 'N', bidirectional: true },
  { from: 'N10', to: 'N3', taxiway: 'N', bidirectional: true },
  { from: 'N3', to: 'N2', taxiway: 'N', bidirectional: true },
  { from: 'N2', to: 'N1', taxiway: 'N', bidirectional: true },
];

const runways: RunwayData[] = [
  { id: '05L/23R', x1: 100, y1: 220, x2: 1300, y2: 220, heading: 52 },
  { id: '05R/23R', x1: 100, y1: 780, x2: 1300, y2: 780, heading: 52 },
];

export const zlxyTopology: AirportTopology = {
  icao: 'ZLXY',
  nodes,
  edges,
  runways,
};
```

> Note: coordinates are approximate. Refine by overlaying on ZLXY81.jpg.

- [ ] **Step 2: Commit**

```bash
git add src/data/; git commit -m "feat: add ZLXY topology data"
```

---

## Task 4: Path Validator & LLM Prompt

**Files:** Create `src/utils/pathValidator.ts`, `src/utils/llmPrompt.ts`

- [ ] **Step 1: Write path validator**

```typescript
// src/utils/pathValidator.ts
import { TaxiEdge, ValidationResult } from '../types/atc';

export function validatePath(
  route: string[],
  edges: TaxiEdge[]
): ValidationResult {
  const errors: string[] = [];
  if (route.length < 2) {
    return { connected: route.length === 1, errors: [] };
  }

  const edgeSet = new Set<string>();
  for (const e of edges) {
    edgeSet.add(`${e.from}->${e.to}`);
    if (e.bidirectional) edgeSet.add(`${e.to}->${e.from}`);
  }

  for (let i = 0; i < route.length - 1; i++) {
    const key = `${route[i]}->${route[i + 1]}`;
    if (!edgeSet.has(key)) {
      errors.push(`No edge: ${route[i]} → ${route[i + 1]}`);
    }
  }

  return { connected: errors.length === 0, errors };
}
```

- [ ] **Step 2: Write LLM prompt template**

```typescript
// src/utils/llmPrompt.ts
export const SYSTEM_PROMPT = `You are an ATC instruction parser for ZLXY (Xi'an Xianyang) airport.
Parse the pilot's taxi readback into structured JSON.

Available taxiways: A (A1-A10), D (D1-D10), M (M1-M14), N (N1-N13), S
Available runways: 05L/23R (north), 05R/23R (south)
Hot spots: HS1 (A6), HS4 (N3)

Output ONLY valid JSON, no explanation:
{
  "action": "taxi" | "hold" | "cross" | "lineup",
  "runway": "05L" | "05R" | "23L" | "23R",
  "route": ["A1", "A2", "A3"],
  "holdPoint": null
}`;

export function buildUserPrompt(text: string): string {
  return `Pilot readback: "${text}"`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/; git commit -m "feat: add path validator and LLM prompt"
```

---

## Task 5: Voice Recognition Hook

**Files:** Create `src/hooks/useVoiceRecognition.ts`

- [ ] **Step 1: Implement hook**

```typescript
// src/hooks/useVoiceRecognition.ts
import { useState, useCallback, useRef } from 'react';
import { VoiceResult, VoiceStatus } from '../types/atc';

export function useVoiceRecognition() {
  const [result, setResult] = useState<VoiceResult>({
    text: '', confidence: 0, status: 'idle',
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setResult(r => ({ ...r, status: 'error' }));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () =>
      setResult(r => ({ ...r, status: 'listening' }));

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const res = event.results[0][0];
      setResult({
        text: res.transcript,
        confidence: res.confidence,
        status: 'done',
      });
    };

    recognition.onerror = () =>
      setResult(r => ({ ...r, status: 'error' }));

    recognition.onend = () =>
      setResult(r =>
        r.status === 'listening' ? { ...r, status: 'idle' } : r
      );

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { voice: result, startListening: start, stopListening: stop };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useVoiceRecognition.ts; git commit -m "feat: add voice recognition hook"
```

---

## Task 6: Instruction Parser Hook

**Files:** Create `src/hooks/useInstructionParser.ts`

- [ ] **Step 1: Implement hook**

```typescript
// src/hooks/useInstructionParser.ts
import { useState, useCallback } from 'react';
import { ParsedInstruction } from '../types/atc';
import { SYSTEM_PROMPT, buildUserPrompt } from '../utils/llmPrompt';

export function useInstructionParser() {
  const [instruction, setInstruction] =
    useState<ParsedInstruction | null>(null);
  const [status, setStatus] =
    useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const parse = useCallback(async (text: string) => {
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

  return { instruction, llmStatus: status, parseInstruction: parse };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useInstructionParser.ts; git commit -m "feat: add LLM instruction parser hook"
```

---

## Task 7: Topology Resolver Hook

**Files:** Create `src/hooks/useTopologyResolver.ts`

- [ ] **Step 1: Implement hook**

```typescript
// src/hooks/useTopologyResolver.ts
import { useCallback } from 'react';
import { TaxiNode, ParsedInstruction, ValidationResult } from '../types/atc';
import { zlxyTopology } from '../data/zlxy-topology';
import { validatePath } from '../utils/pathValidator';

export function useTopologyResolver() {
  const resolve = useCallback(
    (instruction: ParsedInstruction): {
      path: TaxiNode[];
      validation: ValidationResult;
    } => {
      const { route } = instruction;
      const path = route
        .map((id) => zlxyTopology.nodes[id])
        .filter(Boolean);

      const validation = validatePath(route, zlxyTopology.edges);
      return { path, validation };
    },
    []
  );

  return { resolve, topology: zlxyTopology };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTopologyResolver.ts; git commit -m "feat: add topology resolver hook"
```

---

## Task 8: Canvas Renderer Utility

**Files:** Create `src/utils/canvasRenderer.ts`

- [ ] **Step 1: Implement all layer draw functions**

Reference the spec's 6-layer stack. Each function draws one layer onto a Canvas 2D context. Use the deep blue color palette from the spec.

Code: See spec Section 4 for exact color values. Implement `drawGrid`, `drawOverlay`, `drawTaxiways`, `drawRunways`, `drawHighlightPath`, each as an exported function taking `(ctx: CanvasRenderingContext2D, ...)`.

- [ ] **Step 2: Commit**

```bash
git add src/utils/canvasRenderer.ts; git commit -m "feat: add canvas renderer utilities"
```

---

## Task 9: UI Components

**Files:** Create TopBar, VoiceBar, InstructionPanel, OverlaySlider

- [ ] **Step 1: Create TopBar.tsx** — brand + ZLXY badge + status LEDs
- [ ] **Step 2: Create VoiceBar.tsx** — mic button + waveform animation + transcript text
- [ ] **Step 3: Create InstructionPanel.tsx** — parsed action/runway/route display + validation status
- [ ] **Step 4: Create OverlaySlider.tsx** — vertical slider for mask opacity 0-100%
- [ ] **Step 5: Commit**

```bash
git add src/components/; git commit -m "feat: add UI components"
```

---

## Task 10: AirportCanvas Component

**Files:** Create `src/components/AirportCanvas.tsx`

- [ ] **Step 1: Implement 6-layer Canvas component**

Load `ZLXY81.jpg` as Image, draw with `drawImage`. Apply overlay with `globalAlpha`. Draw data layers on top. Use `requestAnimationFrame` for path animation.

- [ ] **Step 2: Commit**

```bash
git add src/components/AirportCanvas.tsx; git commit -m "feat: add 6-layer airport canvas"
```

---

## Task 11: App Assembly & Global Styles

**Files:** Modify `src/App.tsx`, `src/main.tsx`, create `src/index.css`

- [ ] **Step 1: Write index.css** — deep blue theme, font imports (Inter), global resets
- [ ] **Step 2: Wire App.tsx** — 3-zone layout (TopBar + Canvas + VoiceBar), useReducer state, connect all hooks
- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```

Expected: Full UI renders at localhost:5173 with chart image, overlay, and voice bar.

- [ ] **Step 4: Commit**

```bash
git add -A; git commit -m "feat: assemble app with full pipeline"
```

---

## Task 12: End-to-End Verification

- [ ] **Step 1: Set real LLM API key in `.env`**
- [ ] **Step 2: Open in Chrome, click mic, say "Taxi to runway 05 left via Alpha 3, Alpha 4, Alpha 5"**
- [ ] **Step 3: Verify path highlights on canvas**
- [ ] **Step 4: Test overlay slider (0% ↔ 100%)**
- [ ] **Step 5: Test error case: say gibberish, verify L1/L2 error handling**
- [ ] **Step 6: Final commit**

```bash
git add -A; git commit -m "feat: Smart ATC MVP v0.1 complete"
```
