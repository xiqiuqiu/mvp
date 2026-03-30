// src/components/OverlaySlider.tsx
import React from 'react';
interface Props {
  opacity: number;
  onChange: (op: number) => void;
}

export const OverlaySlider: React.FC<Props> = ({ opacity, onChange }) => {
  return (
    <div className="overlay-slider-container">
      <div className="slider-label">底图不透明度</div>
      <div className="slider-value">{Math.round(opacity * 100)}%</div>
      <input
        type="range"
        className="vertical-slider"
        min="0"
        max="1"
        step="0.05"
        value={opacity}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          writingMode: 'vertical-lr',
          WebkitAppearance: 'slider-vertical'
        } as React.CSSProperties}
      />
    </div>
  );
};
