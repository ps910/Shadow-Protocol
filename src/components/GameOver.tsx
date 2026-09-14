import { ROLE_METADATA } from '../game/roles';
import type { GameState } from '../game/gameEngine';

interface GameOverProps {
  gameState: GameState;
  onPlayAgain: () => void;
}

export function GameOver({ gameState, onPlayAgain }: GameOverProps) {
  const isGoodWin = gameState.winner === 'good';

  return (
    <div className="game-over-container animate-fade-in">
      <div className="game-over-emoji">
        {isGoodWin ? '🛡️' : '🗡️'}
      </div>

      <h1 className="game-over-title" style={{
        background: isGoodWin
          ? 'linear-gradient(135deg, #2563eb, #10b981)'
          : 'linear-gradient(135deg, #dc2626, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {isGoodWin ? 'Guardians Win!' : 'Assassin Wins!'}
      </h1>

      <p className="game-over-subtitle">
        {gameState.winMessage}
      </p>

      {/* Stats */}
      <div className="stats-grid" style={{ maxWidth: '600px', margin: '0 auto var(--space-2xl)' }}>
        <div className="stat-card">
          <div className="stat-value">{gameState.round}</div>
          <div className="stat-label">Rounds Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{gameState.players.filter(p => p.isAlive).length}</div>
          <div className="stat-label">Survivors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{gameState.nightActions.length + gameState.votes.length}</div>
          <div className="stat-label">ZK Proofs</div>
        </div>
      </div>

      {/* Full Role Reveal */}
      <div className="section">
        <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-secondary)' }}>
          🎭 Full Identity Reveal
        </h3>
        <div className="role-reveal-grid">
          {gameState.players.map(player => {
            const meta = player.role ? ROLE_METADATA[player.role] : null;
            return (
              <div
                key={player.id}
                className="role-reveal-item"
                style={{ borderColor: meta ? `${meta.color}33` : undefined }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>
                  {player.avatar}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-xs)' }}>
                  {player.name}
                </div>
                {meta && (
                  <div
                    className="player-role-badge"
                    style={{
                      background: `${meta.color}22`,
                      color: meta.color,
                      border: `1px solid ${meta.color}44`,
                    }}
                  >
                    {meta.emoji} {meta.name}
                  </div>
                )}
                <div style={{
                  marginTop: 'var(--space-sm)',
                  fontSize: '0.75rem',
                  color: player.isAlive ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}>
                  {player.isAlive ? '🟢 Survived' : '☠️ Eliminated'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Summary */}
      <div className="section" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
              🔒
            </div>
            <div>
              <div className="card-title">Privacy Report</div>
              <div className="card-subtitle">What Midnight kept private during this game</div>
            </div>
          </div>

          <div className="privacy-dashboard">
            <div className="privacy-column public">
              <div className="privacy-column-title">
                👁️ What Observers Saw
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">✅</span>
                Round number and game phase
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">✅</span>
                Who was alive or eliminated
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">✅</span>
                Vote totals (not individual votes)
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">✅</span>
                Final game outcome
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">✅</span>
                That actions were valid (ZK verified)
              </div>
            </div>

            <div className="privacy-column private">
              <div className="privacy-column-title">
                🔒 What Midnight Protected
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">❌</span>
                Player role assignments
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">❌</span>
                Night action targets
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">❌</span>
                Individual vote choices
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">❌</span>
                Investigation results
              </div>
              <div className="privacy-item">
                <span className="privacy-item-icon">❌</span>
                Player secret keys
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play Again */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <button className="btn btn-primary btn-xl" onClick={onPlayAgain} id="play-again-btn">
          🎭 Play Again
        </button>
      </div>
    </div>
  );
}
