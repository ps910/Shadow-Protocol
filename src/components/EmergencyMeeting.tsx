import { useState } from 'react';
import type { GameState, Player } from '../game/gameEngine';
import { generateAlibiProof, verifyAlibiClaim, AlibiReceipt } from '../game/privacyVerifier';
import { AEGIS_STATION_ROOMS } from '../game/stationMap';

interface EmergencyMeetingProps {
  gameState: GameState;
  currentPlayer: Player;
  onProceedToVoting: () => void;
}

export function EmergencyMeeting({
  gameState,
  currentPlayer,
  onProceedToVoting,
}: EmergencyMeetingProps) {
  const emergency = gameState.emergencyState;
  const [alibis, setAlibis] = useState<Record<string, { receipt: AlibiReceipt; claim: any }>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const crimeSceneRoom = emergency?.roomFound
    ? AEGIS_STATION_ROOMS[emergency.roomFound].name
    : null;

  const handleGenerateAlibi = async (player: Player) => {
    if (!player.secret) return;
    setGeneratingFor(player.id);

    const timestamp = emergency?.deadBody?.timestamp || Date.now();
    const receipt = await generateAlibiProof(
      player.secret,
      player.id,
      player.name,
      player.currentRoom,
      AEGIS_STATION_ROOMS[player.currentRoom].name,
      timestamp
    );

    const claim = verifyAlibiClaim(
      receipt,
      emergency?.roomFound || 'command',
      timestamp
    );

    setAlibis(prev => ({
      ...prev,
      [player.id]: { receipt, claim }
    }));
    setGeneratingFor(null);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      {/* ─── EMERGENCY BANNER ─── */}
      <div style={{
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid var(--shadow)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-2xl) var(--space-xl)',
        marginBottom: 'var(--space-2xl)',
        boxShadow: '0 0 40px var(--shadow-glow)'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-sm)' }}>🚨</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          color: 'var(--shadow-light)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          EMERGENCY ASSEMBLY
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: 'var(--space-sm) auto var(--space-lg)' }}>
          {emergency?.reason === 'body' ? (
            <>
              <strong>{emergency.reporterName}</strong> discovered a casualty in the{' '}
              <span style={{ color: 'var(--shadow-light)', fontWeight: 700 }}>{crimeSceneRoom}</span>!
            </>
          ) : (
            <>
              <strong>{emergency?.reporterName}</strong> pressed the emergency button in the Command Center!
            </>
          )}
        </p>

        <button className="btn btn-primary btn-lg" onClick={onProceedToVoting} style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}>
          Proceed to Shielded Voting ➔
        </button>
      </div>

      {/* ─── CREW ROSTER: LIVING & CASUALTIES ─── */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="section-tag tag-purple">STATION BIOMETRIC ROSTER</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-md)'
        }}>
          {gameState.players.map(p => {
            const hasAlibi = alibis[p.id];
            const isReporter = emergency?.reporterId === p.id;
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 'var(--space-md)',
                  textAlign: 'center',
                  opacity: p.isAlive ? 1 : 0.4,
                  borderColor: isReporter ? 'var(--protocol)' : undefined
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>
                  {p.avatar}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: p.isAlive ? 'var(--protocol)' : 'var(--shadow)' }}>
                  {p.isAlive ? (isReporter ? '📢 REPORTER' : '🟢 ALIVE') : '☠️ ELIMINATED'}
                </div>

                {/* Alibi Trigger */}
                {p.isAlive && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 'var(--space-sm)', width: '100%', fontSize: '0.6875rem' }}
                    onClick={() => handleGenerateAlibi(p)}
                    disabled={generatingFor === p.id || !!hasAlibi}
                  >
                    {hasAlibi ? '✓ ALIBI LOGGED' : generatingFor === p.id ? 'Generating...' : 'Show Alibi Beacon'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── VERIFIABLE EVIDENCE & CRYPTOGRAPHIC ALIBIS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 'var(--space-xl)'
      }}>
        {/* Discussion Log */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div className="section-tag tag-green">CREW DEBATE & LOGS</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
            Recorded Transmission
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {emergency?.discussionTranscript.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: entry.isEvidence ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: entry.isEvidence ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{entry.senderAvatar}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {entry.senderName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {entry.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Alibi Verification Ledger */}
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div className="section-tag tag-red">MIDNIGHT ZERO-KNOWLEDGE ALIBIS</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>
            Verified Room Beacons
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Terminals issue signed room tokens ($T_&#123;\text&#123;room&#125;&#125;$). Crew members can disclose their beacon to mathematically prove their location during the murder window without revealing roles.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {Object.entries(alibis).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                No cryptographic alibis submitted yet. Click "Show Alibi Beacon" above to submit verifiable location proof.
              </div>
            ) : (
              Object.values(alibis).map(({ receipt, claim }) => (
                <div
                  key={receipt.playerId}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: claim.status === 'ALIBI CONFIRMED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                    border: claim.status === 'ALIBI CONFIRMED' ? '1px solid var(--protocol)' : '1px solid var(--shadow)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{receipt.playerName}</span>
                    <span style={{ color: claim.status === 'ALIBI CONFIRMED' ? 'var(--protocol)' : 'var(--shadow)', fontWeight: 700 }}>
                      {claim.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                    BEACON: {receipt.beaconToken} · ROOM: {receipt.roomName.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
