import { useState, useEffect } from 'react';

interface ReactorCalibrationGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ReactorCalibrationGame({ onComplete, onCancel }: ReactorCalibrationGameProps) {
  // Target sequence: e.g. ["7", "2", "1", "8", "4", "3"]
  const [targetSequence] = useState(() => {
    const digits = ['7', '2', '1', '8', '4', '3'];
    return digits;
  });

  const [enteredSequence, setEnteredSequence] = useState<string[]>([]);
  const [errorFlash, setErrorFlash] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const availableButtons = ['1', '2', '3', '4', '7', '8'];

  const handleDigitClick = (digit: string) => {
    if (isDone) return;
    const nextIndex = enteredSequence.length;
    if (targetSequence[nextIndex] === digit) {
      const nextEntered = [...enteredSequence, digit];
      setEnteredSequence(nextEntered);
      if (nextEntered.length === targetSequence.length) {
        setIsDone(true);
        setTimeout(() => {
          onComplete();
        }, 600);
      }
    } else {
      setErrorFlash(true);
      setTimeout(() => {
        setEnteredSequence([]);
        setErrorFlash(false);
      }, 400);
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
        MAGNETIC CONTAINMENT CALIBRATION
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
        Input the exact 6-digit harmonic plasma frequency sequence:
      </p>

      {/* Target display */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xl)',
        background: 'rgba(5, 8, 17, 0.8)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        border: errorFlash ? '1px solid var(--shadow)' : '1px solid var(--border)'
      }}>
        {targetSequence.map((val, idx) => {
          const isFilled = idx < enteredSequence.length;
          return (
            <div
              key={idx}
              style={{
                width: '42px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                fontWeight: 700,
                background: isFilled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isFilled ? 'var(--protocol)' : 'var(--text-muted)',
                border: isFilled ? '1px solid var(--protocol)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s',
              }}
            >
              {isFilled ? enteredSequence[idx] : val}
            </div>
          );
        })}
      </div>

      {/* Input Keypad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-sm)',
        maxWidth: '280px',
        margin: '0 auto var(--space-xl)'
      }}>
        {availableButtons.map((btn) => (
          <button
            key={btn}
            className="btn btn-secondary"
            style={{
              height: '52px',
              fontSize: '1.25rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}
            onClick={() => handleDigitClick(btn)}
          >
            {btn}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel Task
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isDone ? 'var(--protocol)' : 'var(--text-muted)' }}>
          {isDone ? '✓ FREQUENCY LOCKED' : `${enteredSequence.length} / ${targetSequence.length} SYNCHRONIZED`}
        </span>
      </div>
    </div>
  );
}
