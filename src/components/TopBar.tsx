import type { AppState } from '../types/atc';

interface TopBarProps {
  llmStatus: AppState['llmStatus'];
  wifiStatus?: boolean; // Mock for now
}

export const TopBar: React.FC<TopBarProps> = ({ llmStatus, wifiStatus = true }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="brand-logo">✈ Smart ATC</span>
      </div>
      <div className="topbar-center">
        <span className="airport-badge">ZLXY</span>
      </div>
      <div className="topbar-right">
        <div className="status-indicator">
          <span className="status-label">LLM</span>
          <div className={`status-led ${llmStatus === 'loading' ? 'pulsing' : ''} ${llmStatus === 'error' ? 'error' : 'ok'}`} />
        </div>
        <div className="status-indicator">
          <span className="status-label">SYS</span>
          <div className={`status-led ${wifiStatus ? 'ok' : 'error'}`} />
        </div>
      </div>
    </div>
  );
};
