import { useState } from 'react';
import type { GameState, VoteResult } from '../game/gameEngine';
import { PlayerCard } from './PlayerCard';

interface VotingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  hasVoted: boolean;
  onSubmitVote: (targetId: string) => void;
  onProceed: () => void;
  voteResult: VoteResult | null;
}

export function VotingPhase({
  gameState,
  currentPlayerId,
  hasVoted,
  onSubmitVote,
  onProceed,
  voteResult,
}: VotingPhaseProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isVoteResultPhase = voteResult !== null;

  const selectablePlayers = gameState.players.filter(p =>
    p.isAlive && p.id !== currentPlayerId
  );

  const handleSubmitVote = () => {
    if (!selectedTarget) return;
    onSubmitVote(selectedTarget);
  };

  // Calculate max votes for bar width
  const maxVotes = voteResult ? Math.max(...Object.values(voteResult.votes), 1) : 1;

  return (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🗳️</div>
        <h2>{isVoteResultPhase ? 'Vote Results' : 'Private Voting'}</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
          {isVoteResultPhase
            ? 'The votes have been tallied. Individual votes remain private.'
            : 'Cast your vote. Only the totals will be revealed.'}
        </p>
      </div>

      {/* Voting Form */}
      {!isVoteResultPhase && (
        <div className="section">
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                🗳️
              </div>
              <div>
                <div className="card-title">Cast Your Vote</div>
                <div className="card-subtitle">
                  {hasVoted ? 'Vote submitted' : 'Select a player to eliminate'}
                </div>
              </div>
            </div>

            {hasVoted ? (
              <div style={{
                padding: 'var(--space-lg)',
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-success)' }}>
                  Vote submitted privately. Waiting for other agents...
                </p>
                <div className="badge badge-private" style={{ marginTop: 'var(--space-sm)' }}>
                  🔒 Your vote is encrypted — no one knows who you voted for
                </div>
              </div>
            ) : (
              <>
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
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitVote}
                  disabled={!selectedTarget}
                  style={{ width: '100%' }}
                  id="submit-vote-btn"
                >
                  🗳️ Cast Private Vote
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vote Results */}
      {isVoteResultPhase && voteResult && (
        <div className="section animate-slide-up">
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                📊
              </div>
              <div>
                <div className="card-title">Vote Tally</div>
                <div className="card-subtitle">
                  Only vote counts are public — individual votes remain private
                </div>
              </div>
            </div>

            <div className="vote-tally">
              {gameState.players
                .filter(p => p.isAlive || p.id === voteResult.eliminatedId)
                .map(player => {
                  const count = voteResult.votes[player.id] || 0;
                  const isEliminated = player.id === voteResult.eliminatedId;
                  return (
                    <div key={player.id} className="vote-bar">
                      <div className="vote-bar-name" style={{ color: isEliminated ? 'var(--color-error)' : undefined }}>
                        {player.avatar} {player.name}
                      </div>
                      <div className="vote-bar-fill">
                        <div
                          className="vote-bar-fill-inner"
                          style={{ width: `${(count / maxVotes) * 100}%` }}
                        />
                      </div>
                      <div className="vote-bar-count">{count}</div>
                    </div>
                  );
                })}
            </div>

            {/* Elimination announcement */}
            <div style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-lg)',
              background: voteResult.isTie ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
              border: `1px solid ${voteResult.isTie ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              {voteResult.isTie ? (
                <p style={{ color: 'var(--color-warning)' }}>
                  ⚖️ The vote was a tie. No one was eliminated.
                </p>
              ) : voteResult.eliminatedId ? (
                <>
                  {(() => {
                    const eliminated = gameState.players.find(p => p.id === voteResult.eliminatedId);
                    return (
                      <p style={{ color: 'var(--color-error)' }}>
                        ☠️ <strong>{eliminated?.name}</strong> has been eliminated by the town.
                      </p>
                    );
                  })()}
                </>
              ) : (
                <p style={{ color: 'var(--color-warning)' }}>No votes were cast.</p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-primary btn-lg" onClick={onProceed} id="next-round-btn">
                🌙 Next Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Reminder */}
      <div className="section" style={{ textAlign: 'center' }}>
        <div className="badge badge-private">
          🔒 Individual votes are private — only aggregate totals are revealed
        </div>
      </div>
    </div>
  );
}
