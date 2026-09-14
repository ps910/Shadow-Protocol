import type { GameState } from '../game/gameEngine';
import { PlayerCard } from './PlayerCard';

interface GameLobbyProps {
  gameState: GameState;
  onStartGame: () => void;
}

export function GameLobby({ gameState, onStartGame }: GameLobbyProps) {
  const playerCount = gameState.players.length;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Midnight Network · Preprod
        </div>
        <h1>Shadow Protocol</h1>
        <p className="hero-subtitle">
          A privacy-first social deduction game where hidden roles, secret actions,
          and private votes are protected by Midnight's zero-knowledge proofs.
        </p>
        <div className="privacy-indicator" style={{ display: 'inline-flex' }}>
          <span className="privacy-shield">🔒</span>
          Privacy is the gameplay mechanic
        </div>
      </section>

      {/* Stats */}
      <section className="section animate-slide-up animate-delay-1">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{playerCount}</div>
            <div className="stat-label">Agents Ready</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4</div>
            <div className="stat-label">Role Types</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">5</div>
            <div className="stat-label">Max Rounds</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">∞</div>
            <div className="stat-label">Secrets Kept</div>
          </div>
        </div>
      </section>

      {/* Players */}
      <section className="section animate-slide-up animate-delay-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <div>
              <div className="card-title">Assembled Agents</div>
              <div className="card-subtitle">{playerCount} players ready for assignment</div>
            </div>
          </div>
          <div className="player-grid">
            {gameState.players.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      </section>

      {/* Game Rules */}
      <section className="section animate-slide-up animate-delay-3">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📜</div>
            <div>
              <div className="card-title">Mission Briefing</div>
              <div className="card-subtitle">How Shadow Protocol works</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>🗡️</span>
              <div>
                <strong>Assassin</strong> (1) — Eliminate players in secret. Win by gaining majority.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <div>
                <strong>Guardian</strong> (1) — Protect a player each night. Stop the assassin.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>🔎</span>
              <div>
                <strong>Investigator</strong> (1) — Investigate a player to learn their allegiance.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              <div>
                <strong>Civilians</strong> (3) — Survive and vote to eliminate the assassin.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Start Button */}
      <section className="section animate-slide-up animate-delay-4" style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary btn-xl"
          onClick={onStartGame}
          id="start-game-btn"
        >
          🎭 Begin Shadow Protocol
        </button>
        <p style={{ marginTop: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Roles will be secretly assigned using cryptographic randomness
        </p>
      </section>
    </div>
  );
}
