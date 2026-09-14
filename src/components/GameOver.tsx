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

      {/* Victory Title */}
      <h1 className="game-over-title" style={{
        background: isGoodWin
          ? 'linear-gradient(135deg, var(--protocol), var(--protocol-cyan))'
          : 'linear-gradient(135deg, var(--shadow), var(--primary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {isGoodWin ? 'Protocol Victory' : 'Shadow Victory'}
      </h1>

      <p className="game-over-subtitle">{gameState.winMessage}</p>

      {/* Match Complete Card */}
      <div className="section" style={{ width: '100%', maxWidth: '900px' }}>
        <div className="card" style={{
          borderColor: isGoodWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            {/* Stats Column */}
            <div>
              <div className="section-tag" style={{
                color: isGoodWin ? 'var(--protocol)' : 'var(--shadow)',
              }}>
                MATCH COMPLETE
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: isGoodWin ? 'var(--protocol)' : 'var(--shadow)',
                marginBottom: 'var(--space-lg)',
              }}>
                {isGoodWin ? 'PROTOCOL VICTORY' : 'SHADOW VICTORY'} 🏆
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>+250</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>XP</span>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>+40</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '4px' }}>REPUTATION</span>
                </div>
                <div className="badge badge-protocol" style={{ padding: '0.375rem 0.75rem' }}>
                  🏅 MASTER INVESTIGATOR
                </div>
              </div>
            </div>

            {/* Achievements Column */}
            <div style={{
              padding: 'var(--space-lg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-md)',
              }}>
                INDIVIDUAL ACHIEVEMENTS
              </div>
              {gameState.players.filter(p => !p.isAlive || p.role === 'ASSASSIN').slice(0, 3).map((player, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) 0',
                  fontSize: '0.9375rem',
                }}>
                  <span style={{ color: 'var(--protocol)' }}>✓</span>
                  <span>{player.name} — {
                    player.role === 'ASSASSIN' ? 'Assassin Identified' :
                    player.role === 'GUARDIAN' ? `${gameState.round} Players Protected` :
                    `Survived ${gameState.round} Rounds`
                  }</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Role Reveal */}
      <div className="section" style={{ width: '100%', maxWidth: '900px' }}>
        <div className="section-tag tag-purple">IDENTITY DECLASSIFIED</div>
        <h3 className="section-heading" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>
          Full role reveal.
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
                  <div className="player-role-badge" style={{
                    background: `${meta.color}15`,
                    color: meta.color,
                    border: `1px solid ${meta.color}33`,
                  }}>
                    {meta.emoji} {meta.name}
                  </div>
                )}
                <div style={{
                  marginTop: 'var(--space-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: player.isAlive ? 'var(--protocol)' : 'var(--text-muted)',
                }}>
                  {player.isAlive ? '● SURVIVED' : '☠ ELIMINATED'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Report */}
      <div className="section" style={{ width: '100%', maxWidth: '900px' }}>
        <div className="section-tag tag-red">PRIVACY REPORT</div>
        <h3 className="section-heading" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>
          What Midnight kept private.
        </h3>

        <div className="privacy-dashboard">
          <div className="privacy-column public">
            <div className="privacy-column-title">👁️ What Observers Saw</div>
            <div className="privacy-item"><span className="privacy-item-icon">✅</span> Round number and game phase</div>
            <div className="privacy-item"><span className="privacy-item-icon">✅</span> Who was alive or eliminated</div>
            <div className="privacy-item"><span className="privacy-item-icon">✅</span> Vote totals (not individual votes)</div>
            <div className="privacy-item"><span className="privacy-item-icon">✅</span> Final game outcome</div>
            <div className="privacy-item"><span className="privacy-item-icon">✅</span> That actions were valid (ZK verified)</div>
          </div>
          <div className="privacy-column private">
            <div className="privacy-column-title">🔒 What Midnight Protected</div>
            <div className="privacy-item"><span className="privacy-item-icon">❌</span> Player role assignments</div>
            <div className="privacy-item"><span className="privacy-item-icon">❌</span> Night action targets</div>
            <div className="privacy-item"><span className="privacy-item-icon">❌</span> Individual vote choices</div>
            <div className="privacy-item"><span className="privacy-item-icon">❌</span> Investigation results</div>
            <div className="privacy-item"><span className="privacy-item-icon">❌</span> Player secret keys</div>
          </div>
        </div>
      </div>

      {/* Play Again */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <button className="btn btn-primary btn-xl" onClick={onPlayAgain} id="play-again-btn">
          Create Another Match →
        </button>
      </div>
    </div>
  );
}
