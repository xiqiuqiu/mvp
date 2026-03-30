// src/utils/pathValidator.ts
import type { TaxiEdge, ValidationResult } from '../types/atc';

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
