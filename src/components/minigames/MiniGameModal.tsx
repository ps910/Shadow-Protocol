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
      background: 'rgba(3, 5, 12, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-md)'
    }}>
      <div className="card crt-terminal animate-slide-up" style={{
        maxWidth: '580px',
        width: '100%',
        padding: 'var(--space-2xl)',
        background: '#070b18',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        boxShadow: '0 0 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.25)',
        position: 'relative'
      }}>
        {/* HUD Corner Reticles */}
        <div className="corner-bracket corner-top-left" />
        <div className="corner-bracket corner-top-right" />
        <div className="corner-bracket corner-bottom-left" />
        <div className="corner-bracket corner-bottom-right" />

        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          paddingBottom: 'var(--space-md)',
          borderBottom: '1px solid rgba(6, 182, 212, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.75rem', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))' }}>{task.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.01em' }}>
                {task.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--protocol-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="network-beacon-dot" />
                <span>SECTOR: {task.roomId.toUpperCase()} · TERMINAL ONLINE</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
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
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>🔒 ZK-PROVER:</span>
          <span>Completing this task generates a single-use nullifier receipt. Identity and room remain 100% private.</span>
        </div>
      </div>
    </div>
  );
}
