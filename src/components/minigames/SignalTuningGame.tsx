import { useState } from 'react';

interface SignalTuningGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function SignalTuningGame({ onComplete, onCancel }: SignalTuningGameProps) {
  const targetFrequency = 142.8;
  const targetAmplitude = 75;

  const [frequency, setFrequency] = useState(120.0);
  const [amplitude, setAmplitude] = useState(40);
  const [isLocked, setIsLocked] = useState(false);

  const freqDiff = Math.abs(frequency - targetFrequency);
  const ampDiff = Math.abs(amplitude - targetAmplitude);
  const isAligned = freqDiff < 2.0 && ampDiff < 5;

  const handleLockIn = () => {
    if (isAligned) {
      setIsLocked(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--protocol-cyan)',
        marginBottom: 'var(--space-sm)',
        letterSpacing: '0.1em'
      }}>
        SUBSPACE CARRIER WAVE ALIGNMENT
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-xl)' }}>
        Adjust frequency and amplitude sliders to align your signal with the reference transponder:
      </p>

      {/* Visual Oscilloscope Display */}
      <div style={{
        background: 'rgba(5, 8, 17, 0.9)',
        border: isAligned ? '1px solid var(--protocol)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-md)'
        }}>
          <span>TARGET: {targetFrequency.toFixed(1)} MHz / {targetAmplitude}%</span>
          <span style={{ color: isAligned ? 'var(--protocol)' : 'var(--warning)' }}>
            STATUS: {isAligned ? 'SIGNAL PHASE MATCHED' : 'PHASE DISCORDANT'}
          </span>
        </div>

        {/* Waveform graphic visualization */}
        <div style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '2rem',
          color: isAligned ? 'var(--protocol)' : 'var(--protocol-cyan)',
          letterSpacing: '0.2em',
          transition: 'all 0.3s'
        }}>
          {isAligned ? '∿∿∿∿∿∿∿∿∿∿' : '∿∿∿   ∿∿∿'}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ maxWidth: '380px', margin: '0 auto var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>
            <span>Carrier Frequency</span>
            <span style={{ color: 'var(--protocol-cyan)' }}>{frequency.toFixed(1)} MHz</span>
          </div>
          <input
            type="range"
            min="100.0"
            max="180.0"
            step="0.5"
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--protocol-cyan)' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>
            <span>Signal Amplitude</span>
            <span style={{ color: 'var(--protocol-cyan)' }}>{amplitude}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={amplitude}
            onChange={(e) => setAmplitude(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--protocol-cyan)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel Task
        </button>
        <button
          className={`btn ${isAligned ? 'btn-primary' : 'btn-secondary'}`}
          disabled={!isAligned || isLocked}
          onClick={handleLockIn}
        >
          {isLocked ? '✓ LOCKED' : isAligned ? '⚡ Lock Transceiver' : 'Align Signal to Lock'}
        </button>
      </div>
    </div>
  );
}
