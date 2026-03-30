import type { VoiceResult } from '../types/atc';

interface VoiceBarProps {
  voice: VoiceResult;
  onMicPressStore: () => void;
  onMicReleaseStore: () => void;
}

export const VoiceBar: React.FC<VoiceBarProps> = ({ voice, onMicPressStore, onMicReleaseStore }) => {
  const isListening = voice.status === 'listening';
  
  return (
    <div className="voicebar-container">
      <div className="voicebar">
        <div className="voice-transcript">
          {voice.text ? (
            <span className="text-content">{voice.text}</span>
          ) : (
            <span className="text-placeholder">Pilot readback...</span>
          )}
        </div>
        
        <div className="voice-waveform">
          {/* Simple CSS waveform animation when listening */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className={`wave-bar ${isListening ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onMouseDown={onMicPressStore}
          onMouseUp={onMicReleaseStore}
          onMouseLeave={onMicReleaseStore}
          onTouchStart={onMicPressStore}
          onTouchEnd={onMicReleaseStore}
        >
          🎙
        </button>
      </div>
    </div>
  );
};
