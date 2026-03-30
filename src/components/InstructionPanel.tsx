import React, { useState, useEffect } from 'react';
import type { ParsedInstruction, ValidationResult } from '../types/atc';

interface Props {
  instruction: ParsedInstruction | null;
  validation: ValidationResult;
}

export const InstructionPanel: React.FC<Props> = ({ instruction, validation }) => {
  const [visible, setVisible] = useState(true);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (instruction) {
      setVisible(true);
      setCountdown(8);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [instruction]);

  if (!instruction || !visible) return null;

  return (
    <div className="instruction-panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Parsed Instruction ({countdown}s)</span>
        <button onClick={() => setVisible(false)} className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '14px' }}>✖</button>
      </div>
      <div className="panel-body">
        <div className="data-row">
          <span className="label">ACTION</span>
          <span className="value action-value">{instruction.action.toUpperCase()}</span>
        </div>
        <div className="data-row">
          <span className="label">RUNWAY</span>
          <span className="value">{instruction.runway}</span>
        </div>
        <div className="data-row route-row">
          <span className="label">ROUTE</span>
          <div className="route-tags">
            {instruction.route.map((wp, idx) => (
              <span key={`${wp}-${idx}`} className="route-tag">{wp}</span>
            ))}
          </div>
        </div>
        {instruction.holdPoint && (
          <div className="data-row">
            <span className="label">HOLD SHORT</span>
            <span className="value hold-value">{instruction.holdPoint}</span>
          </div>
        )}
      </div>
      
      {!validation.connected && validation.errors.length > 0 && (
        <div className="validation-error">
          <span className="error-icon">⚠</span>
          <span className="error-text">Path not connected: {validation.errors[0]}</span>
        </div>
      )}
    </div>
  );
};
