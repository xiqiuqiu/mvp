import type { AppState } from '../types/atc';

interface TopBarProps {
  llmStatus: AppState['llmStatus'];
  wifiStatus?: boolean; // Mock for now
  overlayOpacity: number;
  setOverlayOpacity: (op: number) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ llmStatus, wifiStatus = true, overlayOpacity, setOverlayOpacity }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="brand-logo">✈ Smart ATC</span>
      </div>
      <div className="topbar-center">
        <span className="airport-badge">ZLXY</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-slider">
          <span className="topbar-slider-label">底图不透明度</span>
          <input
            type="range"
            className="horizontal-slider"
            min="0"
            max="1"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
          />
          <span className="topbar-slider-value">{Math.round(overlayOpacity * 100)}%</span>
        </div>
        <div className="status-indicator">
          <span className="status-label">LLM</span>
          <div className={`status-led ${llmStatus === 'loading' ? 'pulsing' : ''} ${llmStatus === 'error' ? 'error' : 'ok'}`} />
        </div>
        <div className="status-indicator">
          <span className="status-label">系统</span>
          <div className={`status-led ${wifiStatus ? 'ok' : 'error'}`} />
        </div>
      </div>
    </div>
  );
};
