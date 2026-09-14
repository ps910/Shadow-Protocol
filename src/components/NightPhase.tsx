import { useState } from 'react';
import { ROLE_METADATA, getAllowedActions, ActionType } from '../game/roles';
import type { Player } from '../game/gameEngine';
import type { Role } from '../game/roles';
import { PlayerCard } from './PlayerCard';

interface NightPhaseProps {
  round: number;
  currentPlayer: Player;
  allPlayers: Player[];
  onSubmitAction: (action: ActionType, targetId: string | null) => void;
  hasActed: boolean;
}

export function NightPhase({ round, currentPlayer, allPlayers, onSubmitAction, hasActed }: NightPhaseProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const role = currentPlayer.role!;
  const meta = ROLE_METADATA[role];
  const allowedActions = getAllowedActions(role);
  const primaryAction = allowedActions[0] || ActionType.Skip;
  const needsTarget = primaryAction !== ActionType.Hide && primaryAction !== ActionType.Skip;

  const selectablePlayers = allPlayers.filter(p =>
    p.isAlive && p.id !== currentPlayer.id
  );

  const handleSubmit = () => {
    if (needsTarget && !selectedTarget) return;
    onSubmitAction(primaryAction, selectedTarget);
  };

  return (
    <div className="night-container animate-fade-in">
      <div className="night-header">
        <div className="night-moon">🌙</div>
        <h2>Night {round}</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
          The shadows come alive. Choose your action wisely.
        </p>
      </div>

      <div className="night-action-panel">
        <div className="card" style={{ borderColor: `${meta.color}33` }}>
          <div className="card-header">
            <div className="card-icon" style={{ background: `${meta.color}18`, borderColor: `${meta.color}33` }}>
              {meta.emoji}
            </div>
            <div>
              <div className="card-title">{meta.name}'s Turn</div>
              <div className="card-subtitle">{meta.nightActionLabel}</div>
            </div>
          </div>

          {hasActed ? (
            <div style={{
              padding: 'var(--space-lg)',
              background: 'var(--color-success-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-success)' }}>
                Action submitted. Waiting for other agents...
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-xs)' }}>
                Your action is encrypted and private
              </p>
            </div>
          ) : (
            <>
              {needsTarget && (
                <>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Select a target:
                  </p>
                  <div className="player-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                    {selectablePlayers.map(player => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        isSelected={selectedTarget === player.id}
                        selectable
                        onClick={() => setSelectedTarget(player.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {primaryAction === ActionType.Hide && (
                <div style={{
                  padding: 'var(--space-lg)',
                  background: 'var(--color-bg-glass)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  marginBottom: 'var(--space-lg)',
                }}>
                  <span style={{ fontSize: '2rem' }}>🏠</span>
                  <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                    You hide and hope for the best. Stay safe.
                  </p>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={needsTarget && !selectedTarget}
                style={{ width: '100%' }}
                id="submit-action-btn"
              >
                {primaryAction === ActionType.Assassinate && '🗡️ Eliminate Target'}
                {primaryAction === ActionType.Protect && '🛡️ Protect Target'}
                {primaryAction === ActionType.Investigate && '🔎 Investigate Target'}
                {primaryAction === ActionType.Hide && '🏠 Stay Hidden'}
              </button>

              <div className="badge badge-private" style={{ marginTop: 'var(--space-md)', width: '100%', justifyContent: 'center' }}>
                🔒 Your action is private — verified without revealing your role
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
