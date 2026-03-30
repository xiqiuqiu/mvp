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
        <span>指令解析 ({countdown}秒)</span>
        <button onClick={() => setVisible(false)} className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '14px' }}>✖</button>
      </div>
      <div className="panel-body">
        <div className="data-row">
          <span className="label">动作</span>
          <span className="value action-value">{instruction.action?.toUpperCase() ?? '—'}</span>
        </div>
        <div className="data-row">
          <span className="label">跑道</span>
          <span className="value">{instruction.runway ?? '—'}</span>
        </div>
        <div className="data-row route-row">
          <span className="label">路径</span>
          <div className="route-tags">
            {(instruction.route ?? []).map((wp, idx) => (
              <span key={`${wp}-${idx}`} className="route-tag">{wp}</span>
            ))}
          </div>
        </div>
        {instruction.holdPoint && (
          <div className="data-row">
            <span className="label">等待点</span>
            <span className="value hold-value">{instruction.holdPoint}</span>
          </div>
        )}
      </div>
      
      {!validation.connected && validation.errors.length > 0 && (
        <div className="validation-error">
          <span className="error-icon">⚠</span>
          <span className="error-text">路径未连通: {validation.errors[0]}</span>
        </div>
      )}
    </div>
  );
};
