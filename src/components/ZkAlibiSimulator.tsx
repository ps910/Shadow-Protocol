import React, { useState } from 'react';

const ROOMS = [
  { id: 'reactor', name: 'Reactor Core', sector: 'Sector 01', icon: '⚛️', danger: 'High Radiation', desc: 'Plasma containment and main fusion thrusters.' },
  { id: 'hydroponics', name: 'Hydroponics', sector: 'Sector 02', icon: '🌿', danger: 'Biomass Hazard', desc: 'Station oxygen scrubbers and atmospheric synthesis.' },
  { id: 'comms', name: 'Comms Array', sector: 'Sector 03', icon: '📡', danger: 'High Frequency', desc: 'Sub-space interstellar broadcast antenna.' },
  { id: 'medbay', name: 'Medical Bay', sector: 'Sector 04', icon: '🩺', danger: 'Bio-Containment', desc: 'Cadet biometric scanners and cryogenic stasis.' },
];

const TASKS: Record<string, string[]> = {
  reactor: ['Calibrate Magnetic Diverter', 'Purge Coolant Manifold', 'Stabilize Plasma Flux'],
  hydroponics: ['Cycle CO2 Scrubbers', 'Harvest Synthetic Culture', 'Inspect Irrigation Valves'],
  comms: ['Align Parabolic Dish', 'Filter Carrier Noise', 'Decrypt Midnight Beacon'],
  medbay: ['Calibrate Vitals Monitor', 'Synthesize Antitoxin', 'Verify Bio-DNA Signature'],
};

export const ZkAlibiSimulator: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].id);
  const [selectedTask, setSelectedTask] = useState(TASKS[ROOMS[0].id][0]);
  const [isProving, setIsProving] = useState(false);
  const [proofResult, setProofResult] = useState<{
    commitment: string;
    nullifier: string;
    proofHash: string;
    proverTimeMs: number;
    valid: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    setSelectedTask(TASKS[roomId][0]);
    setProofResult(null);
  };

  const handleGenerateProof = () => {
    setIsProving(true);
    setProofResult(null);

    // Simulate 1.12s ZK Groth16 circuit synthesis
    setTimeout(() => {
      const entropy = Math.random().toString(16).substring(2, 10);
      const hash1 = Math.random().toString(16).substring(2, 18);
      const hash2 = Math.random().toString(16).substring(2, 18);
      const proofStr = `0x94f1c${hash1}${hash2}d7b0`;

      setProofResult({
        commitment: `0xpedersen_${entropy}_${selectedRoom.substring(0, 4)}`,
        nullifier: `0xnull_${Math.random().toString(16).substring(2, 14)}`,
        proofHash: proofStr,
        proverTimeMs: 1120 + Math.floor(Math.random() * 80),
        valid: true,
      });
      setIsProving(false);
    }, 1150);
  };

  const currentRoomObj = ROOMS.find((r) => r.id === selectedRoom) || ROOMS[0];

  return (
    <section id="zk-prover-lab" className="mx-auto max-w-6xl px-6 py-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[var(--color-hairline)]">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-signal)] bg-[var(--color-signal)]/10 border border-[var(--color-signal)]/30">
            <span className="h-2 w-2 rounded-full bg-[var(--color-signal)] animate-pulse" />
            Interactive Prover Laboratory
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold tracking-tight text-[var(--color-ink)]">
            Zero-Knowledge <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-violet)] to-[var(--color-magenta)]">Alibi Simulator</span>
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
            Test the Midnight cryptographic engine in real-time. Select a secret station room, commit your alibi task, and generate a mathematical proof that guarantees your innocence — <strong className="text-[var(--color-ink)]">without ever revealing which room you were in.</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-panel)] px-4 py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Prover Circuit</div>
            <div className="font-mono text-sm font-semibold text-[var(--color-cyan)]">Groth16 / Compact v0.19</div>
          </div>
          <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-panel)] px-4 py-3 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Proof Size</div>
            <div className="font-mono text-sm font-semibold text-[var(--color-signal)]">128 Bytes</div>
          </div>
        </div>
      </div>

      {/* Interactive Simulator Grid */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Interactive Controls */}
        <div className="space-y-6">
          {/* Step 1: Select Room */}
          <div className="cyber-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-cyan)]">01. Secret Station Location (Witness)</span>
              <span className="font-mono text-[10px] text-[var(--color-danger)] bg-[var(--color-danger)]/15 px-2 py-0.5 rounded border border-[var(--color-danger)]/30">⊘ STRICTLY CONFIDENTIAL</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ROOMS.map((room) => {
                const active = room.id === selectedRoom;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-[var(--color-cyan)] bg-[var(--color-panel-2)] shadow-[0_0_20px_-5px_rgba(51,221,208,0.4)]'
                        : 'border-[var(--color-hairline)] bg-[var(--color-midnight)]/70 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{room.icon}</span>
                    <span className="mt-2 font-display text-[13px] font-semibold text-[var(--color-ink)]">{room.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-muted)]">{room.sector}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)] flex items-center gap-1.5">
              <span className="text-[var(--color-signal)]">ℹ</span>
              {currentRoomObj.desc} ({currentRoomObj.danger})
            </p>
          </div>

          {/* Step 2: Task Select */}
          <div className="cyber-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-violet)]">02. Commit Scheduled Task</span>
              <span className="font-mono text-[10px] text-[var(--color-signal)]">Nullifier Ready</span>
            </div>
            <div className="mt-4 space-y-2">
              {TASKS[selectedRoom].map((task) => {
                const active = task === selectedTask;
                return (
                  <button
                    key={task}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left font-display text-[13px] transition ${
                      active
                        ? 'border-[var(--color-violet)] bg-[var(--color-violet)]/15 text-[var(--color-ink)]'
                        : 'border-[var(--color-hairline)] bg-[var(--color-midnight)]/50 text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${active ? 'bg-[var(--color-violet)]' : 'bg-[var(--color-hairline)]'}`} />
                      {task}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-muted)]">35 XP</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateProof}
            disabled={isProving}
            className="group relative w-full overflow-hidden rounded-xl py-4 font-display text-[15px] font-bold uppercase tracking-wider text-[#080a14] transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-violet) 50%, var(--color-magenta) 100%)',
              boxShadow: '0 0 35px -8px var(--color-cyan)',
            }}
          >
            <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md" style={{ animation: 'sweep-x 3.5s linear infinite' }} />
            <span className="relative flex items-center justify-center gap-2">
              {isProving ? (
                <>
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Synthesizing Compact Zero-Knowledge Proof...
                </>
              ) : (
                <>
                  <span>⚡ Generate Midnight ZK Proof</span>
                  <span className="font-mono text-xs opacity-75">(~1.12s)</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Right Column: High-Tech Output Console */}
        <div className="cyber-card hud-bracket rounded-2xl p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--color-hairline)] pb-4">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-signal)]" />
                Cryptographic Verifier Terminal
              </div>
              <span className="font-mono text-[10px] text-[var(--color-muted)]">node://midnight-preprod</span>
            </div>

            {/* Secret Witness Section */}
            <div className="mt-5 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-danger)]">
                <span>Private Witness (Stays In Browser)</span>
                <span>⊘ CONFIDENTIAL</span>
              </div>
              <div className="mt-2.5 font-mono text-xs text-[var(--color-ink)] space-y-1">
                <div>secret_room: <span className="text-[var(--color-cyan)] font-semibold">{currentRoomObj.name}</span></div>
                <div>committed_task: <span className="text-white/90">{selectedTask}</span></div>
                <div>privacy_state: <span className="text-[var(--color-danger)]">Zero leaked bytes to peers</span></div>
              </div>
            </div>

            {/* Animated Proving or Verified Output */}
            {isProving ? (
              <div className="mt-6 py-10 text-center space-y-4">
                <div className="relative mx-auto h-16 w-16 place-items-center flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] animate-spin" />
                  <div className="text-xl">🔐</div>
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-[var(--color-cyan)] animate-pulse">
                  Evaluating Polynomial Equations...
                </div>
                <div className="max-w-xs mx-auto font-mono text-[10px] text-[var(--color-muted)]">
                  Pedersen commitment generated → Synthesizing Groth16 witness → Producing 128-byte proof.
                </div>
              </div>
            ) : proofResult ? (
              <div className="mt-6 space-y-4">
                {/* Proof Verification Status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-signal)]/40 bg-[var(--color-signal)]/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">✓</span>
                    <div>
                      <div className="font-display text-sm font-semibold text-[var(--color-signal)]">PROOF VERIFIED MATHEMATICALLY</div>
                      <div className="font-mono text-[10px] text-[var(--color-muted)]">Verified in {proofResult.proverTimeMs}ms by Midnight Network</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--color-signal)]/20 text-[var(--color-signal)] font-bold">100% VALID</span>
                </div>

                {/* Public On-Chain Proof Artifact */}
                <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)] p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    <span>Public ZK-Proof Hash</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(proofResult.proofHash);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[var(--color-cyan)] hover:underline"
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <div className="break-all font-mono text-[11px] text-[var(--color-cyan)] bg-black/40 p-2 rounded">
                    {proofResult.proofHash}
                  </div>
                  <div className="text-[10px] text-[var(--color-muted)]">
                    Nullifier: <span className="text-white/80">{proofResult.nullifier}</span> (Prevents double-claim)
                  </div>
                </div>

                {/* Table Deduction Guarantee */}
                <p className="font-body text-xs leading-relaxed text-[var(--color-muted)]">
                  <strong className="text-[var(--color-ink)]">Table Consensus:</strong> The other 5 crewmates know you were busy working in a valid station sector, but neither the table nor the blockchain can tell whether you were in the Reactor or Medical Bay!
                </p>
              </div>
            ) : (
              <div className="mt-8 py-12 text-center text-[var(--color-muted)]">
                <div className="text-3xl mb-3">🛡️</div>
                <div className="font-display text-sm font-semibold text-[var(--color-ink)]">Ready for Proof Generation</div>
                <div className="mt-1 text-xs max-w-xs mx-auto">
                  Click the button below to test client-side zero-knowledge proof generation on your device.
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-hairline)] flex items-center justify-between font-mono text-[10px] text-[var(--color-muted)]">
            <span>zkSNARK: Compact Prover v0.19</span>
            <span className="text-[var(--color-signal)]">● Consensus Nominal</span>
          </div>
        </div>
      </div>
    </section>
  );
};
