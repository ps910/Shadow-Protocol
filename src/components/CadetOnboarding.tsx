import React, { useState } from 'react';

interface CadetOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const CadetOnboarding: React.FC<CadetOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (onComplete) onComplete();
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '680px',
          width: '92%',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(0, 240, 255, 0.15)',
          background: 'linear-gradient(135deg, rgba(13, 16, 32, 0.96), rgba(8, 10, 22, 0.98))',
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', letterSpacing: '2px' }}>
              AEGIS STATION CADET FLIGHT MANUAL • STEP {step} OF {totalSteps}
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#fff' }}>
              {step === 1 && '1. Midnight Zero-Knowledge Primer'}
              {step === 2 && '2. Role Witnesses & Secret Identities'}
              {step === 3 && '3. Station Terminals & Task Nullifiers'}
              {step === 4 && '4. Casualties, Alibis & Shielded Voting'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Step progress pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step contents */}
        <div style={{ minHeight: '260px', marginBottom: '2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(124, 92, 252, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(124, 92, 252, 0.3)' }}>
                  🛡️
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Privacy IS the Gameplay Mechanic</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    Unlike traditional transparent blockchains where anyone can inspect your contract state, Midnight powers secret-state computation.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                In <strong>Shadow Protocol</strong>, every action you take is verified through <em>zero-knowledge circuits</em> written in Compact. The blockchain validates that your move is legitimate without ever learning who you are or what role you possess.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    ✓ Public (On-Chain)
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>Round count, station task readiness, active sabotages, casualty alerts, anonymous vote tallies.</div>
                </div>
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <div style={{ color: '#f43f5e', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    🔒 Private (Witness Only)
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>Your role identity, room location, individual vote selection, investigator scan targets.</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(0, 240, 255, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  🎭
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Private Role Distribution</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    Roles are assigned using cryptographic randomness and stored as private local witnesses.
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '1.5rem' }}>👨‍🔧</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>Civilian</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Complete tasks, identify saboteurs</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <div style={{ fontSize: '1.5rem' }}>🛡️</div>
                  <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>Guardian</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Shield targets from assassination</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '1.5rem' }}>🔎</div>
                  <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>Investigator</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Uncover allegiances with ZK pings</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '1.5rem' }}>🗡️</div>
                  <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>Assassin</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Clandestine strikes in isolation</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                  <div style={{ fontSize: '1.5rem' }}>🕵️</div>
                  <div style={{ color: '#c084fc', fontWeight: 600, fontSize: '0.85rem' }}>Spy</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Phantom pings & sabotage coordination</div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  🚀
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Map Navigation & Interactive Mini-Games</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    Navigate 7 Aegis Station compartments and maintain critical systems.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                Click connected compartments to travel. When in rooms with terminals, launch mini-game puzzles:
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <li><strong>Reactor Calibration:</strong> Match hexadecimal frequency pulses.</li>
                <li><strong>Power Routing:</strong> Redirect conduits to restore the primary power bus.</li>
                <li><strong>Signal Tuning:</strong> Align sinusoidal communication frequencies.</li>
                <li><strong>Chemical Mixing:</strong> Synthesize stoichiometric cooling reagents.</li>
              </ul>
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                ZK-RECEIPT: Minting single-use nullifier Poseidon(secret, TaskID, Round) advances station readiness without disclosing which room you are in.
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '2.5rem', background: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  🚨
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Casualty Reports & Cryptographic Alibis</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    When casualties occur, gather in Command Deck for an Emergency Meeting.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                Accused of foul play? Provide a mathematical proof:
              </p>
              <div style={{ background: 'rgba(124, 92, 252, 0.15)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(124, 92, 252, 0.3)', marginBottom: '1rem' }}>
                <div style={{ color: '#c084fc', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Room Beacon Alibi Proof
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  Generate an alibi proof <code style={{ color: 'var(--accent-cyan)' }}>T_room = Poseidon(secret, RoomId, Timestamp)</code>. You can prove you were in Research Lab during the incident without revealing your identity or private key!
                </div>
              </div>
              <p style={{ fontSize: '0.85rem' }}>
                Finally, cast your shielded ballot. Only aggregate vote totals are decrypted on-chain to prevent bandwagon voting.
              </p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.25rem', opacity: step === 1 ? 0.4 : 1 }}
          >
            ← Previous
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            STEP {step} / {totalSteps}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.5rem',
              background: step === totalSteps ? 'linear-gradient(135deg, #10b981, #00f0ff)' : 'linear-gradient(135deg, #7c5cfc, #00f0ff)',
            }}
          >
            {step === totalSteps ? 'Complete Manual & Enter Station →' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
};
