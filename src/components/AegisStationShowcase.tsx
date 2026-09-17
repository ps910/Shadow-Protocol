import React, { useState } from 'react';

const SECTORS = [
  {
    id: 'reactor',
    name: 'Sector A: Reactor Core',
    icon: '⚛️',
    hazard: 'CODE VIOLET',
    desc: 'Primary antimatter fusion core powering Aegis orbital shielding and propulsion.',
    minigame: 'Plasma Containment Diverter',
    status: 'ONLINE · 842°C',
    statusColor: 'var(--color-signal)',
  },
  {
    id: 'comms',
    name: 'Sector B: Comms Array',
    icon: '📡',
    hazard: 'INTERFERENCE',
    desc: 'Deep-space quantum transmitter linking Aegis Station to Midnight validation nodes.',
    minigame: 'Carrier Signal Alignment',
    status: 'FREQUENCY LOCKED',
    statusColor: 'var(--color-cyan)',
  },
  {
    id: 'life_support',
    name: 'Sector C: Life Support',
    icon: '🌿',
    hazard: 'ATMOSPHERIC SCRUB',
    desc: 'Bio-synthetic oxygen regeneration banks and emergency gravity compensation.',
    minigame: 'Conduit Routing Matrix',
    status: '99.2% O₂ PRESSURE',
    statusColor: 'var(--color-gold)',
  },
  {
    id: 'medbay',
    name: 'Sector D: Cryo & Medical',
    icon: '🩺',
    hazard: 'BIOMETRIC LOCK',
    desc: 'Cadet DNA gene-sequencer, cryogenic pods, and post-strike forensic examination.',
    minigame: 'Chemical Antitoxin Synthesis',
    status: 'BIO-ISOLATION ACTIVE',
    statusColor: 'var(--color-violet)',
  },
];

interface AegisStationShowcaseProps {
  onLaunch3D?: () => void;
}

export const AegisStationShowcase: React.FC<AegisStationShowcaseProps> = ({ onLaunch3D }) => {
  const [selectedSector, setSelectedSector] = useState(0);
  const sector = SECTORS[selectedSector];

  return (
    <section id="station" className="border-y border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
            Station Schematics & Minigames
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold tracking-tight text-[var(--color-ink)]">
            Aegis Orbital Station <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-signal)] to-white">Tactical Map</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Explore the four critical sectors of Aegis Station. Crewmates repair sabotage via interactive cryptographic minigames, while Assassins lurk in the ventilation conduits to eliminate key personnel.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Main Visual Station Card */}
          <div className="cyber-card hud-bracket relative overflow-hidden rounded-3xl border border-white/10 group">
            <div className="relative h-[380px] sm:h-[420px] w-full overflow-hidden">
              <img
                src="/assets/station_reactor_core.jpg"
                alt="Aegis Station Reactor Core"
                className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void)] via-[var(--color-void)]/40 to-transparent" />
              
              {/* Floating Cockpit Pills */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 backdrop-blur-md px-3.5 py-1.5 font-mono text-[11px] text-[var(--color-cyan)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)] animate-ping" />
                  <span>SECTOR A · CORE TELEMETRY</span>
                </div>
                <div className="rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/15 px-3 py-1 font-mono text-[10px] uppercase text-[var(--color-danger)]">
                  ⚠ Sabotage Vulnerable
                </div>
              </div>

              {/* Bottom Card Overlay Details */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
                  <span>{sector.icon}</span>
                  <span>{sector.name}</span>
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">{sector.minigame}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)] max-w-lg">{sector.desc}</p>

                {/* Station Health Bar */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-signal)]" style={{ width: '92%' }} />
                  </div>
                  <span className="font-mono text-xs font-semibold text-[var(--color-signal)]">92% INTEGRITY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Navigation & Minigames Deck */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)] px-1">
                Select Sector To Inspect
              </div>
              {SECTORS.map((s, idx) => {
                const isSelected = idx === selectedSector;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(idx)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[var(--color-cyan)] bg-[var(--color-panel-2)] shadow-[0_0_25px_-5px_rgba(51,221,208,0.3)]'
                        : 'border-[var(--color-hairline)] bg-[var(--color-panel)]/70 hover:border-white/20'
                    }`}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-midnight)] text-xl border border-white/10">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-semibold text-white truncate">{s.name}</span>
                        <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded" style={{ color: s.statusColor, background: 'rgba(255,255,255,0.05)' }}>
                          {s.status}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-[var(--color-cyan)] truncate">
                        🎮 {s.minigame}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Playable Station Alert Box */}
            <div className="cyber-card rounded-2xl p-5 border border-[var(--color-violet)]/30 bg-[var(--color-violet)]/10">
              <div className="flex items-center justify-between font-mono text-[11px] text-[var(--color-violet)]">
                <span className="font-bold">⚡ INTERACTIVE MINI-GAMES</span>
                <span>4 PLAYABLE</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                Every task completed by crewmates advances the station countdown, triggers cryptographic alibis, and forces the Assassin to risk unmasking themselves.
              </p>
            </div>

            {/* 3D Blacksite Arena Launcher */}
            {onLaunch3D && (
              <button
                onClick={onLaunch3D}
                className="w-full group relative overflow-hidden rounded-2xl py-3.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-black transition hover:brightness-110 shadow-lg shadow-[var(--color-cyan)]/25 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--color-cyan), var(--color-signal))',
                }}
              >
                <span className="text-base animate-pulse">🎮</span>
                <span>Enter Sector in 3D (Blacksite-01)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
