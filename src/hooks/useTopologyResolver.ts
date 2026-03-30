// src/hooks/useTopologyResolver.ts
import { useCallback } from 'react';
import type { TaxiNode, ParsedInstruction, ValidationResult } from '../types/atc';
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
