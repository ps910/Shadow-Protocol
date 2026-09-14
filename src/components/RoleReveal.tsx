import { ROLE_METADATA } from '../game/roles';
import type { Role } from '../game/roles';

interface RoleRevealProps {
  playerName: string;
  playerAvatar: string;
  role: Role;
  onContinue: () => void;
}

export function RoleReveal({ playerName, playerAvatar, role, onContinue }: RoleRevealProps) {
  const meta = ROLE_METADATA[role];

  return (
    <div className="role-reveal-container">
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
        Viewing as: {playerAvatar} {playerName}
      </p>

      <div className="role-card" style={{ borderColor: `${meta.color}44` }}>
        <div className="role-card-emoji">{meta.emoji}</div>
        <div className="role-card-title" style={{ color: meta.color }}>
          {meta.name}
        </div>
        <div
          className="role-card-team"
          style={{ color: meta.team === 'evil' ? 'var(--color-error)' : 'var(--color-success)' }}
        >
          {meta.team === 'evil' ? '☠️ SHADOW AGENT' : '✨ PROTECTOR'}
        </div>
        <div className="role-card-description">
          {meta.description}
        </div>
        <div style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-md)',
          background: `${meta.color}0a`,
          border: `1px solid ${meta.color}22`,
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}>
          <strong>Objective:</strong> {meta.objective}
        </div>
        <div className="role-card-warning">
          <span>🤫</span>
          <span>Your role is secret — don't share it!</span>
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={onContinue}
        style={{ marginTop: 'var(--space-2xl)' }}
        id="role-continue-btn"
      >
        🌙 Enter the Night
      </button>
    </div>
  );
}
