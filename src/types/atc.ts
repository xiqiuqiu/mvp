// src/types/atc.ts

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export type TaxiAction = 'taxi' | 'hold' | 'cross' | 'lineup';

export interface VoiceResult {
  text: string;
  interimText: string;
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
  type: 'intersection' | 'hold' | 'gate' | 'runway_entrance' | 'stand';
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

export interface TerminalLog {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'process' | 'error';
}
