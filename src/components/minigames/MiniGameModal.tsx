import type { PlayerTask } from '../../game/tasks';
import { ReactorCalibrationGame } from './ReactorCalibrationGame';
import { PowerRoutingGame } from './PowerRoutingGame';
import { SignalTuningGame } from './SignalTuningGame';
import { ChemicalMixingGame } from './ChemicalMixingGame';

interface MiniGameModalProps {
  task: PlayerTask;
  onComplete: () => void;
  onClose: () => void;
}

export function MiniGameModal({ task, onComplete, onClose }: MiniGameModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 8, 17, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }}>
      <div className="card animate-slide-up" style={{
        maxWidth: '560px',
        width: '100%',
        padding: 'var(--space-2xl)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--primary-glow)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          paddingBottom: 'var(--space-md)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.5rem' }}>{task.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>
                {task.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--protocol-cyan)' }}>
                SECTOR: {task.roomId.toUpperCase()} · TERMINAL INTERACTION
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Mini Game Engine */}
        {task.type === 'reactor' && (
          <ReactorCalibrationGame onComplete={onComplete} onCancel={onClose} />
        )}
        {task.type === 'power' && (
          <PowerRoutingGame onComplete={onComplete} onCancel={onClose} />
        )}
        {task.type === 'signal' && (
          <SignalTuningGame onComplete={onComplete} onCancel={onClose} />
        )}
        {task.type === 'chemical' && (
          <ChemicalMixingGame onComplete={onComplete} onCancel={onClose} />
        )}

        {/* ZK Proof Notice */}
        <div style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-sm) var(--space-md)',
          background: 'rgba(139, 92, 246, 0.06)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--primary-light)' }}>🔒 ZK-PROVER:</span>
          <span>Completing this task will generate a single-use nullifier. Identity and room remain private.</span>
        </div>
      </div>
    </div>
  );
}
