import type { GameEvent, GameState } from '../game/gameEngine';

interface DayPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  investigationResults: Array<{ targetId: string; isEvil: boolean; round: number }>;
  onStartVoting: () => void;
}

export function DayPhase({ gameState, currentPlayerId, investigationResults, onStartVoting }: DayPhaseProps) {
  const currentRoundEvents = gameState.events.filter(e => e.round === gameState.round && e.isPublic);
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);

  return (
    <div className="day-container animate-fade-in">
      <div className="day-header">
        <div className="day-sun">☀️</div>
        <h2>Day {gameState.round}</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
          The sun rises. Discuss what happened and decide who to eliminate.
        </p>
      </div>

      {/* Night Report */}
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              📰
            </div>
            <div>
              <div className="card-title">Night Report</div>
              <div className="card-subtitle">What happened while you slept...</div>
            </div>
          </div>
          <div className="event-log">
            {currentRoundEvents.length === 0 ? (
              <div className="event-entry">
                <div className="event-dot system" />
                <div className="event-message">No events to report.</div>
              </div>
            ) : (
              currentRoundEvents.map(event => (
                <div key={event.id} className="event-entry">
                  <div className={`event-dot ${
                    event.type === 'attack_killed' ? 'attack' :
                    event.type === 'attack_survived' ? 'protection' :
                    'info'
                  }`} />
                  <div className="event-message">{event.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Investigation Results (PRIVATE — only shown to investigator) */}
      {investigationResults.length > 0 && (
        <div className="section animate-slide-up animate-delay-1">
          <div className="card" style={{ borderColor: 'rgba(124, 58, 237, 0.2)' }}>
            <div className="card-header">
              <div className="card-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)' }}>
                🔎
              </div>
              <div>
                <div className="card-title">Investigation Intel</div>
                <div className="card-subtitle">
                  <span className="badge badge-private" style={{ marginLeft: 0 }}>🔒 Only you can see this</span>
                </div>
              </div>
            </div>
            {investigationResults.map((result, i) => {
              const target = gameState.players.find(p => p.id === result.targetId);
              return (
                <div key={i} className="investigation-card">
                  <div className={`investigation-result ${result.isEvil ? 'evil' : 'good'}`}>
                    <span>{target?.avatar}</span>
                    <span><strong>{target?.name}</strong></span>
                    <span>—</span>
                    <span>{result.isEvil ? '🚨 SUSPICIOUS (Evil)' : '✅ CLEAR (Good)'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Round {result.round}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Status */}
      <div className="section animate-slide-up animate-delay-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <div>
              <div className="card-title">Surviving Agents</div>
              <div className="card-subtitle">
                {gameState.players.filter(p => p.isAlive).length} alive ·{' '}
                {gameState.players.filter(p => !p.isAlive).length} eliminated
              </div>
            </div>
          </div>
          <div className="player-grid">
            {gameState.players.map(player => (
              <div
                key={player.id}
                className={`player-card ${!player.isAlive ? 'dead' : ''} ${player.id === currentPlayerId ? 'current-player' : ''}`}
              >
                <div className="player-avatar">{player.avatar}</div>
                <div className="player-name">{player.name}</div>
                <div className="player-status">
                  {!player.isAlive ? '☠️ Eliminated' : player.id === currentPlayerId ? '⭐ You' : '🟢 Alive'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proceed to Voting */}
      <div className="section animate-slide-up animate-delay-3" style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={onStartVoting}
          id="start-voting-btn"
        >
          🗳️ Proceed to Voting
        </button>
        <p style={{ marginTop: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Each player will cast a private vote to eliminate a suspect
        </p>
      </div>
    </div>
  );
}
