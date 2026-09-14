import { generatePrivacySummary } from '../game/privacyVerifier';
import type { GameState } from '../game/gameEngine';

interface PrivacyDashboardProps {
  gameState: GameState;
}

export function PrivacyDashboard({ gameState }: PrivacyDashboardProps) {
  const alivePlayers = gameState.players.filter(p => p.isAlive).length;
  const actionsThisGame = gameState.nightActions.length;
  const votesThisGame = gameState.votes.length;

  const summary = generatePrivacySummary(
    gameState.round,
    alivePlayers,
    gameState.players.length,
    actionsThisGame,
    votesThisGame,
  );

  return (
    <div className="card animate-slide-up">
      <div className="card-header">
        <div className="card-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
          🔒
        </div>
        <div>
          <div className="card-title">Privacy Dashboard</div>
          <div className="card-subtitle">Real-time view of what's public vs. private</div>
        </div>
        <div className="badge badge-private" style={{ marginLeft: 'auto' }}>
          {summary.zkVerifications} ZK verifications
        </div>
      </div>

      <div className="privacy-dashboard">
        {/* Public Data Column */}
        <div className="privacy-column public">
          <div className="privacy-column-title">
            👁️ On-Chain (Public)
          </div>
          {summary.publicData.map((item, i) => (
            <div key={i} className="privacy-item">
              <span className="privacy-item-icon">{item.icon}</span>
              <span>{item.label}: <strong>{item.value}</strong></span>
            </div>
          ))}
        </div>

        {/* Private Data Column */}
        <div className="privacy-column private">
          <div className="privacy-column-title">
            🔒 Private (Never On-Chain)
          </div>
          {summary.privateData.map((item, i) => (
            <div key={i} className="privacy-item">
              <span className="privacy-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Architecture */}
      <div style={{
        marginTop: 'var(--space-lg)',
        padding: 'var(--space-md)',
        background: 'var(--color-bg-glass)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        lineHeight: '1.8',
        textAlign: 'center',
      }}>
        <div>Player Action → <span style={{ color: 'var(--color-secondary-light)' }}>Private Witness</span> → ZK Proof → <span style={{ color: 'var(--color-success)' }}>Valid ✓</span> → State Update</div>
        <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.6875rem' }}>
          Secret data never leaves the device · Midnight verifies without seeing
        </div>
      </div>
    </div>
  );
}
