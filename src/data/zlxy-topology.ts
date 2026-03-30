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
