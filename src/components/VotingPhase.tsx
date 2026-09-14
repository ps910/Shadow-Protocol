import { useState } from 'react';
import type { GameState, VoteResult } from '../game/gameEngine';
import { PlayerCard } from './PlayerCard';
import { ROLE_METADATA } from '../game/roles';

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

  const eliminatedPlayer = voteResult?.eliminatedId
    ? gameState.players.find(p => p.id === voteResult.eliminatedId)
    : null;

  const eliminatedMeta = eliminatedPlayer?.role
    ? ROLE_METADATA[eliminatedPlayer.role]
    : null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🗳️</div>
        <h2 className="section-heading">
          {isVoteResultPhase ? 'Ejection Verdict' : 'Confidential Balloting'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
          {isVoteResultPhase
            ? 'The shielded votes have been homomorphically aggregated on Midnight.'
            : 'Cast your shielded ballot. Who should be ejected from Aegis Station?'}
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
                <div className="card-title">Cast Your Shielded Ballot</div>
                <div className="card-subtitle">
                  {hasVoted ? 'Ballot sealed & nullifier committed' : 'Select a suspect to exile or choose Skip Vote'}
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
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
                  Shielded ballot submitted to Midnight prover pool.
                </p>
                <div className="badge badge-private" style={{ marginTop: 'var(--space-sm)' }}>
                  ✓ ZK Proof generated · Single-use nullifier committed · Identity masked
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

                {/* Skip Vote Option */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                  <button
                    className={`btn ${selectedTarget === 'skip' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedTarget('skip')}
                    style={{
                      border: selectedTarget === 'skip' ? '2px solid var(--primary)' : '1px solid var(--border)'
                    }}
                  >
                    ⚖️ Skip Vote (Insufficient Evidence)
                  </button>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmitVote}
                  disabled={!selectedTarget}
                  style={{ width: '100%' }}
                  id="submit-vote-btn"
                >
                  🔒 Cast Shielded Ballot
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vote Results & Ejection */}
      {isVoteResultPhase && voteResult && (
        <div className="section animate-slide-up">
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                📊
              </div>
              <div>
                <div className="card-title">Shielded Tally Verification</div>
                <div className="card-subtitle">
                  Aggregate results verified by Midnight contract — individual ballots remain anonymous
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
              {/* Skip votes bar */}
              <div className="vote-bar">
                <div className="vote-bar-name" style={{ color: 'var(--text-muted)' }}>
                  ⚖️ Skip Vote
                </div>
                <div className="vote-bar-fill">
                  <div
                    className="vote-bar-fill-inner"
                    style={{
                      width: `${((voteResult.votes['skip'] || 0) / maxVotes) * 100}%`,
                      background: 'var(--text-muted)'
                    }}
                  />
                </div>
                <div className="vote-bar-count">{voteResult.votes['skip'] || 0}</div>
              </div>
            </div>

            {/* Ejection Announcement */}
            <div style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-xl)',
              background: voteResult.isTie || !eliminatedPlayer ? 'var(--color-warning-bg)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${voteResult.isTie || !eliminatedPlayer ? 'rgba(245, 158, 11, 0.3)' : 'var(--shadow)'}`,
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}>
              {voteResult.isTie ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>⚖️</div>
                  <h3 style={{ color: 'var(--color-warning)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-xs)' }}>
                    TIE VOTE · NO EXILE
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>The station consensus was split equally. No crew member was ejected into the vacuum.</p>
                </div>
              ) : eliminatedPlayer && eliminatedMeta ? (
                <div>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-xs)' }}>🚀</div>
                  <h3 style={{ color: 'var(--shadow-light)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
                    {eliminatedPlayer.name} WAS EXILED INTO DEEP SPACE
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
                    Declassified dossier confirms: {eliminatedPlayer.name} was a{' '}
                    <strong style={{ color: eliminatedMeta.color }}>
                      {eliminatedMeta.name} {eliminatedMeta.emoji} ({eliminatedMeta.team.toUpperCase()} TEAM)
                    </strong>.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>⚖️</div>
                  <h3 style={{ color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>
                    CREW CHOSE TO SKIP EJECTION
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Plurality voted to skip. Station crew returns to duties.</p>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-primary btn-lg" onClick={onProceed} id="next-round-btn">
                🚀 Continue Mission
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
