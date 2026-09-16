import { useState } from 'react';
import type { GameState } from '../game/gameEngine';
import { PlayerCard } from './PlayerCard';

interface GameLobbyProps {
  gameState: GameState;
  onStartGame: () => void;
  isWalletConnected?: boolean;
  onConnectWallet?: () => void;
}

const SCREENS_DATA = [
  {
    id: 'wallet',
    step: '01',
    title: 'Wallet Connection',
    badge: 'PUBLIC STATE',
    badgeClass: 'tag-public',
    summary: 'Connect Midnight 1AM Wallet or pre-funded test identity to authenticate as a player.',
    features: ['Public cryptographic key pair', 'Zero correlation with secret role', 'State proof readiness validation'],
    privacyNote: 'Wallet address is public to the table for turn tracking, but never linked to secret role assignments.'
  },
  {
    id: 'lobby',
    step: '02',
    title: 'Match Lobby',
    badge: 'PUBLIC STATE',
    badgeClass: 'tag-public',
    summary: 'Players gather in an encrypted matchmaking room. Once capacity is reached, role dealing initiates.',
    features: ['Real-time player roster verification', 'Network latency synchronization', 'Contract state handshake'],
    privacyNote: 'Lobby state is public: all players see who has joined before roles are dealt.'
  },
  {
    id: 'reveal',
    step: '03',
    title: 'Role Reveal',
    badge: 'PRIVATE WITNESS',
    badgeClass: 'tag-private',
    summary: 'Midnight delivers an encrypted witness containing only your role, objective, and team.',
    features: ['Client-side private state decrypt', 'Zero ledger emission', 'Cryptographic role commitment generated'],
    privacyNote: 'Only your browser decrypts your role witness. Midnight ledger never receives this plaintext.'
  },
  {
    id: 'night',
    step: '04',
    title: 'Night Phase',
    badge: 'PRIVATE WITNESS',
    badgeClass: 'tag-private',
    summary: 'Assassins mark targets, Guardians protect players, and Investigators inspect allegiances secretly.',
    features: ['Offline action selection', 'Target concealed in private commitment', 'ZK proof generated client-side'],
    privacyNote: 'Targets and actions remain hidden. Ledger receives only cryptographic proof of rule compliance.'
  },
  {
    id: 'day',
    step: '05',
    title: 'Day Report & Discussion',
    badge: 'PUBLIC RESOLUTION',
    badgeClass: 'tag-public',
    summary: 'Night actions resolve trustlessly on-chain. The table learns who died (if anyone) and begins debate.',
    features: ['Public state transition broadcast', 'Private investigator clues revealed to client only', 'Open social deduction debate'],
    privacyNote: 'Eliminations are public; whether a player survived due to Guardian shield or no attack is hidden.'
  },
  {
    id: 'voting',
    step: '06',
    title: 'Sealed Voting',
    badge: 'MIDNIGHT ZK BRIDGE',
    badgeClass: 'tag-zk',
    summary: 'Players cast confidential ballots. The contract aggregates tallies without revealing who voted for whom.',
    features: ['Anonymous ballot proof generation', 'Anti-coercion cryptographic seal', 'Tie-breaking logic'],
    privacyNote: 'Nobody can prove how another player voted. Eliminates bandwagons and intimidation.'
  },
  {
    id: 'results',
    step: '07',
    title: 'Match Outcome & Declassified Dossier',
    badge: 'DECLASSIFICATION',
    badgeClass: 'tag-public',
    summary: 'When victory conditions are met, all secret roles and proof traces declassify for post-match verification.',
    features: ['Complete cryptographic audit trail', 'XP and reputation awards', 'Replay declassification'],
    privacyNote: 'Secrets are unsealed only after match conclusion, verifying integrity from start to finish.'
  }
];

const LOOP_STEPS = [
  { num: '01', title: 'Wallet Connect', desc: 'Player connects 1AM Wallet and registers match session key.', type: 'Public', tagClass: 'tag-public' },
  { num: '02', title: 'Lobby Formation', desc: '6 players join room. On-chain contract initializes match state.', type: 'Public', tagClass: 'tag-public' },
  { num: '03', title: 'Deal Secret Roles', desc: 'Contract seeds randomness; private state witnesses distributed.', type: 'Private', tagClass: 'tag-private' },
  { num: '04', title: 'Private Role Reveal', desc: 'Each client unlocks and views their individual classified role.', type: 'Private', tagClass: 'tag-private' },
  { num: '05', title: 'Night Action Selection', desc: 'Agents select secret target (assassinate, protect, or investigate).', type: 'Private', tagClass: 'tag-private' },
  { num: '06', title: 'ZK Proof Generation', desc: 'Client generates ZK proof validating action adheres to contract rules.', type: 'ZK Bridge', tagClass: 'tag-zk' },
  { num: '07', title: 'Resolve Night State', desc: 'Public contract verifies proofs and updates living/eliminated status.', type: 'Public', tagClass: 'tag-public' },
  { num: '08', title: 'Day Briefing', desc: 'Table reviews casualties, investigator checks clues, agents debate.', type: 'Public', tagClass: 'tag-public' },
  { num: '09', title: 'Sealed Ballot Casting', desc: 'Players cast secret vote with proof of living player authorization.', type: 'Private', tagClass: 'tag-private' },
  { num: '10', title: 'ZK Vote Aggregation', desc: 'Tallies aggregate homomorphically without revealing individual ballots.', type: 'ZK Bridge', tagClass: 'tag-zk' },
  { num: '11', title: 'Elimination Resolution', desc: 'Accused player is eliminated; ledger records updated agent count.', type: 'Public', tagClass: 'tag-public' },
  { num: '12', title: 'Victory Evaluation', desc: 'Contract evaluates win predicates: Protocol saved or Shadow victory.', type: 'Public', tagClass: 'tag-public' },
];

export function GameLobby({ gameState, onStartGame, isWalletConnected = false }: GameLobbyProps) {
  const playerCount = gameState.players.length;
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [zkSimulating, setZkSimulating] = useState(false);
  const [zkResult, setZkResult] = useState<string | null>(null);

  const activeScreen = SCREENS_DATA[activeScreenIndex];

  const handleSimulateZK = () => {
    setZkSimulating(true);
    setZkResult(null);
    setTimeout(() => {
      const mockHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setZkResult(
        `✓ [ZK-SNARK VALIDATED] Action Commitment: ${mockHash}\n` +
        `  • Role: Assassin (Secret Witness Verified)\n` +
        `  • Target Validity: Target != Self (Constraint Satisfied)\n` +
        `  • Status: Alive (Block #489201 Proof Verified)\n` +
        `  • Gas Consumed: 0 (Off-chain Private Proof Generation)`
      );
      setZkSimulating(false);
    }, 700);
  };

  const [heroTab, setHeroTab] = useState<'station' | 'dossier' | 'zk'>('station');

  return (
    <div className="animate-fade-in">
      {/* ─── HERO SECTION ─── */}
      <section className="hero">
        <div className="hero-content">
          <div className="figma-hero-badge">
            <span className="figma-hero-badge-dot" />
            • PRIVACY-NATIVE • BUILT ON MIDNIGHT • GAMING
          </div>

          <h1 className="figma-hero-title">
            Deception you<br />can <span className="figma-prove-gradient">prove.</span>
          </h1>

          <p className="hero-subtitle">
            A multiplayer social-deduction strategy game where secret identities,
            private objectives and hidden actions stay concealed — while Midnight
            cryptographically verifies that every move was legitimate. Players can
            keep secrets, but they <strong>cannot forge game actions.</strong>
          </p>

          <div className="hero-actions">
            <button className="figma-btn-primary" onClick={onStartGame} id="start-game-btn">
              {isWalletConnected ? 'Create a Match →' : '🔒 Create a Match'}
            </button>
            <a href="#roles" className="figma-btn-outline">
              How a round works
            </a>
          </div>

          {/* Quick Metrics — Figma Design Specification */}
          <div className="hero-quick-stats">
            <div className="hero-stat-pill">
              <span className="hero-stat-value">6</span>
              <span className="hero-stat-label">PLAYERS / MATCH</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">ZK-SNARK VERIFIED</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-value">0 GAS</span>
              <span className="hero-stat-label">OFF-CHAIN ACTIONS</span>
            </div>
          </div>

          {!isWalletConnected ? (
            <div
              style={{
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 1rem',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              <span>
                <strong>1AM Wallet Required:</strong> Players cannot enter or create matches without connecting a 1AM Wallet on Midnight Preprod.
              </span>
            </div>
          ) : (
            <div
              style={{
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.85rem',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: '#86efac',
                fontSize: '0.85rem',
              }}
            >
              <span>●</span>
              <span>1AM Wallet Authenticated · Ready to Deploy</span>
            </div>
          )}

          {/* Social Presence Badge */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a
              href="https://x.com/shadow_pr0tocol"
              target="_blank"
              rel="noopener noreferrer"
              className="x-nav-btn"
            >
              <span>𝕏 Official Updates:</span>
              <strong style={{ color: 'var(--protocol-cyan)' }}>@shadow_pr0tocol</strong>
            </a>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              LEVEL 5 FULL MOON
            </span>
          </div>
        </div>

        {/* ─── HERO RIGHT COLUMN: HOLOGRAPHIC STATION / DOSSIER / ZK TELEMETRY ─── */}
        <div>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
            <button
              onClick={() => setHeroTab('station')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: heroTab === 'station' ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: heroTab === 'station' ? 'var(--protocol-cyan)' : 'transparent',
                borderBottom: heroTab === 'station' ? 'none' : undefined,
                color: heroTab === 'station' ? 'var(--protocol-cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🛰️ AEGIS STATION HUD
            </button>
            <button
              onClick={() => setHeroTab('dossier')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: heroTab === 'dossier' ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: heroTab === 'dossier' ? 'var(--shadow)' : 'transparent',
                borderBottom: heroTab === 'dossier' ? 'none' : undefined,
                color: heroTab === 'dossier' ? 'var(--shadow-light)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📁 CLASSIFIED DOSSIER
            </button>
            <button
              onClick={() => setHeroTab('zk')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: heroTab === 'zk' ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: heroTab === 'zk' ? 'var(--primary)' : 'transparent',
                borderBottom: heroTab === 'zk' ? 'none' : undefined,
                color: heroTab === 'zk' ? 'var(--primary-light)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ⚡ ZK VERIFIER
            </button>
          </div>

          {heroTab === 'station' ? (
            /* Holographic Station Command Deck */
            <div className="hero-holo-container animate-fade-in">
              <div className="corner-bracket corner-top-left" />
              <div className="corner-bracket corner-top-right" />
              <div className="corner-bracket corner-bottom-left" />
              <div className="corner-bracket corner-bottom-right" />
              <div className="hero-holo-scanline" />
              <div className="hero-holo-sweep" />

              <img
                src="/promo_banner.jpg"
                alt="Aegis Station Holographic Command Bridge — Shadow Protocol on Midnight Network"
                className="hero-holo-img"
              />

              <div className="hero-holo-overlay-info">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="network-beacon-dot" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--protocol-cyan)', fontWeight: 700, letterSpacing: '0.1em' }}>
                      AEGIS STATION COMMAND · 7 SECTORS ACTIVE
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                    Shielded Witness System
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.625rem',
                    background: 'rgba(139, 92, 246, 0.25)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary-light)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700
                  }}>
                    MIDNIGHT ZK-VERIFIED
                  </span>
                </div>
              </div>
            </div>
          ) : heroTab === 'dossier' ? (
            /* Dossier Card — Exact Figma Make Implementation */
            <div className="figma-dossier-card animate-fade-in">
              <div className="figma-dossier-header">
                <span className="figma-dossier-tag">● CLASSIFIED DOSSIER</span>
                <span className="figma-dossier-id">#SP-A8F92</span>
              </div>

              <div className="figma-dossier-role-box">
                <div className="figma-dossier-role-icon">🗡️</div>
                <div>
                  <div className="figma-dossier-role-name">Assassin</div>
                  <div className="figma-dossier-team">TEAM • SHADOW</div>
                </div>
              </div>

              <p className="figma-dossier-desc">
                Eliminate the Guardians and seize numerical control of the game.
              </p>

              <div className="figma-action-chips">
                <span className="figma-action-chip">ASSASSINATE</span>
                <span className="figma-action-chip">HIDE IDENTITY</span>
                <span className="figma-action-chip">SABOTAGE</span>
              </div>

              <div className="figma-objective-panel">
                <div className="figma-objective-label">SECRET OBJECTIVE</div>
                <div className="figma-objective-text">Eliminate 2 Protocol players.</div>
              </div>

              <div className="figma-visibility-row">
                <span className="figma-visibility-key">role.visible_to_table</span>
                <span className="figma-visibility-val">🚫 HIDDEN</span>
              </div>

              <div className="figma-progress-segments">
                <div className="figma-segment active" />
                <div className="figma-segment" />
                <div className="figma-segment" />
                <div className="figma-segment" />
              </div>
            </div>
          ) : (
            /* Interactive ZK Verifier Console */
            <div className="dossier-card animate-fade-in" style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}>
              <div className="dossier-header">
                <span className="dossier-label" style={{ color: 'var(--primary-light)' }}>⚡ MIDNIGHT ZK-SNARK ENGINE</span>
                <span className="dossier-id">HALO2 / COMPACT</span>
              </div>

              <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Test client-side cryptographic proof generation. Validates action compliance without disclosing role or target plaintext to the ledger.
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSimulateZK}
                  disabled={zkSimulating}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  {zkSimulating ? '⏳ Compiling Witness & Proving...' : '⚡ Generate & Verify Action Proof'}
                </button>
              </div>

              {zkResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: '#86efac',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {zkResult}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── METRICS BAR ─── */}
      <div className="metrics-bar animate-slide-up animate-delay-1">
        <div className="metric-item">
          <div className="metric-value">{playerCount} PLAYERS</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-value">4 ROLES</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-value">3 PHASES / ROUND</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-value">5 MAX ROUNDS</div>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <div className="metric-value">ZK VERIFIED</div>
        </div>
      </div>

      {/* ─── WHY MIDNIGHT SECTION ─── */}
      <section className="section animate-slide-up animate-delay-2" id="why-midnight">
        <div className="section-tag tag-purple">WHY MIDNIGHT · THE PROBLEM</div>
        <h2 className="section-heading">Public blockchains leak everything.<br /><span className="accent-gradient">Social deduction requires secrets.</span></h2>
        <p className="section-subtitle">
          In games like Werewolf, Mafia, or Secret Hitler, knowing any player's role breaks the game instantly.
          Traditional blockchains broadcast all state. Midnight provides dual-state architecture: private witnesses + zero-knowledge proof verification.
        </p>

        <div className="why-midnight-grid">
          <div className="why-card">
            <div className="why-icon">🔒</div>
            <div className="why-title">Sealed State</div>
            <p className="why-desc">
              Your role assignment, your night action target, and your voting ballot reside only in your local client witness. They never touch the public ledger in plaintext.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">⚡</div>
            <div className="why-title">Verifiable Actions</div>
            <p className="why-desc">
              Zero-knowledge SNARK proofs cryptographically verify that every player obeys the rules (you are alive, you have the role, target is valid) without disclosing your move.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">⚖️</div>
            <div className="why-title">Trustless Settlement</div>
            <p className="why-desc">
              No central server or trusted game master. The Midnight contract autonomously resolves night casualties, tallies anonymous votes, and decides victory conditions.
            </p>
          </div>
        </div>
      </section>

      {/* ─── ROLES SECTION ─── */}
      <section className="section animate-slide-up animate-delay-2" id="roles">
        <div className="section-tag tag-green">THE CAST · MVP</div>
        <h2 className="section-heading">Two teams. Four hidden roles.</h2>
        <p className="section-subtitle" style={{ marginBottom: 'var(--space-2xl)' }}>
          Each match secretly deals every player one identity. You know only your own.
          The Protocol defends; the Shadow deceives.
        </p>

        <div className="role-grid">
          {/* Assassin */}
          <div className="role-card-container role-shadow">
            <div className="role-card-icon">🗡️</div>
            <span className="role-card-badge badge-shadow">SHADOW</span>
            <div className="role-card-name name-shadow">Assassin</div>
            <div className="role-card-desc">
              Eliminate the Guardians and seize numerical control of the game.
            </div>
            <div className="action-chips">
              <span className="action-chip">ASSASSINATE</span>
              <span className="action-chip">HIDE IDENTITY</span>
              <span className="action-chip">SABOTAGE</span>
            </div>
          </div>

          {/* Guardian */}
          <div className="role-card-container role-protocol">
            <div className="role-card-icon">🛡️</div>
            <span className="role-card-badge badge-protocol">PROTOCOL</span>
            <div className="role-card-name name-protocol">Guardian</div>
            <div className="role-card-desc">
              Protect players through the night and hunt down the Assassin.
            </div>
            <div className="action-chips">
              <span className="action-chip">PROTECT</span>
              <span className="action-chip">INVESTIGATE</span>
              <span className="action-chip">COUNTERATTACK</span>
            </div>
          </div>

          {/* Investigator */}
          <div className="role-card-container role-protocol">
            <div className="role-card-icon">🔎</div>
            <span className="role-card-badge badge-protocol">PROTOCOL</span>
            <div className="role-card-name name-investigator">Investigator</div>
            <div className="role-card-desc">
              Discover who is working against the Protocol.
            </div>
            <div className="action-chips">
              <span className="action-chip">INVESTIGATE</span>
              <span className="action-chip">PRIVATE CLUE</span>
            </div>
          </div>

          {/* Civilian */}
          <div className="role-card-container role-protocol">
            <div className="role-card-icon">👤</div>
            <span className="role-card-badge badge-protocol">PROTOCOL</span>
            <div className="role-card-name name-civilian">Civilian</div>
            <div className="role-card-desc">
              Survive, complete tasks, and help unmask the Assassin.
            </div>
            <div className="action-chips">
              <span className="action-chip">COMPLETE TASKS</span>
              <span className="action-chip">COLLECT EVIDENCE</span>
              <span className="action-chip">VOTE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GAMEPLAY LOOP SECTION ─── */}
      <section className="section animate-slide-up animate-delay-3" id="loop">
        <div className="section-tag tag-purple">THE FLOW · ROUND ARCHITECTURE</div>
        <h2 className="section-heading">From private intention to <span className="accent-gradient">zero-knowledge proof.</span></h2>
        <p className="section-subtitle">
          Every match cycles through a deterministic 12-step state engine, alternating between local confidential witnesses and verifiable on-chain settlements.
        </p>

        <div className="loop-grid">
          {LOOP_STEPS.map((step) => (
            <div key={step.num} className="loop-card">
              <div className="loop-card-header">
                <span className="loop-num">{step.num}</span>
                <span className={`loop-tag ${step.tagClass}`}>{step.type}</span>
              </div>
              <div className="loop-step-title">{step.title}</div>
              <div className="loop-step-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SCREEN SHOWCASE SECTION ─── */}
      <section className="section animate-slide-up animate-delay-3" id="screens">
        <div className="section-tag tag-green">SCREEN WALKTHROUGH · 7 PHASES</div>
        <h2 className="section-heading">Designed for deception and certainty.</h2>
        <p className="section-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
          Explore the seven interfaces powering each match session:
        </p>

        <div className="screens-nav">
          {SCREENS_DATA.map((s, idx) => (
            <button
              key={s.id}
              className={`screen-nav-btn ${idx === activeScreenIndex ? 'active' : ''}`}
              onClick={() => setActiveScreenIndex(idx)}
            >
              {s.step} {s.title}
            </button>
          ))}
        </div>

        <div className="screen-preview-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--primary-light)' }}>
                PHASE {activeScreen.step}
              </span>
              <span className={`loop-tag ${activeScreen.badgeClass}`}>
                {activeScreen.badge}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-md)' }}>
              {activeScreen.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '1rem', lineHeight: 1.6 }}>
              {activeScreen.summary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              {activeScreen.features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--protocol)' }}>✓</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: 'var(--space-md)',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--primary-light)' }}>Midnight Privacy Guarantee:</strong> {activeScreen.privacyNote}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>
              {activeScreen.id === 'wallet' && '💳'}
              {activeScreen.id === 'lobby' && '👥'}
              {activeScreen.id === 'reveal' && '🎭'}
              {activeScreen.id === 'night' && '🌙'}
              {activeScreen.id === 'day' && '☀️'}
              {activeScreen.id === 'voting' && '🗳️'}
              {activeScreen.id === 'results' && '🏆'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              INTERFACE SPECIFICATION #{activeScreen.step}
            </div>
            <button className="btn btn-primary" onClick={onStartGame} style={{ width: '100%' }}>
              {isWalletConnected ? 'Experience in Match →' : '🔒 Experience in Match'}
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECURITY & ANTI-CHEAT SECTION ─── */}
      <section className="section animate-slide-up animate-delay-3" id="security">
        <div className="section-tag tag-red">SECURITY · ZERO-KNOWLEDGE BOUNDARY</div>
        <h2 className="section-heading">What stays hidden. What gets proven.</h2>
        <p className="section-subtitle">
          Midnight separates private witness data from public on-chain verifiable ledger state.
        </p>

        <div className="security-comparison-grid">
          <div className="security-box sealed">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--shadow-light)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span>🔒</span> SEALED (Private Witness)
            </h3>
            <ul className="security-list">
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--shadow)' }}>✕</span>
                <span><strong>Role Identity:</strong> Stored strictly in local witness; unseen by adversaries.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--shadow)' }}>✕</span>
                <span><strong>Night Target:</strong> Your assassination or protection choice before resolution.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--shadow)' }}>✕</span>
                <span><strong>Investigator Clues:</strong> Private alignment reads revealed solely to the investigator.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--shadow)' }}>✕</span>
                <span><strong>Individual Votes:</strong> Ballots are confidential; no peer coercion or retaliation.</span>
              </li>
            </ul>
          </div>

          <div className="security-box verified">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--protocol-light)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span>✓</span> VERIFIED (Public Proof)
            </h3>
            <ul className="security-list">
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--protocol)' }}>✓</span>
                <span><strong>Rule Adherence:</strong> Mathematical proof that player possesses permission to act.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--protocol)' }}>✓</span>
                <span><strong>Alive Status:</strong> Proves the player is living when taking actions or voting.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--protocol)' }}>✓</span>
                <span><strong>Single Action Constraint:</strong> Exactly one action allowed per agent per cycle.</span>
              </li>
              <li className="security-list-item">
                <span className="security-list-icon" style={{ color: 'var(--protocol)' }}>✓</span>
                <span><strong>Anonymous Vote Tally:</strong> Verifiable summation of all encrypted ballots.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Interactive ZK Proof Console */}
        <div className="zk-console">
          <div className="zk-console-header">
            <span>MIDNIGHT ZK-SNARK VERIFICATION SIMULATOR</span>
            <span>CONTRACT: shadow_protocol.compact</span>
          </div>
          <p style={{ marginBottom: 'var(--space-md)' }}>
            Test live client-side ZK proof generation and constraint validation:
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSimulateZK}
              disabled={zkSimulating}
            >
              {zkSimulating ? 'Computing Proof...' : '⚡ Generate & Verify Action Proof'}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Validates witness without leaking identity.
            </span>
          </div>
          {zkResult && (
            <pre style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--protocol-light)',
              whiteSpace: 'pre-wrap',
              fontSize: '0.75rem'
            }}>
              {zkResult}
            </pre>
          )}
        </div>
      </section>

      {/* ─── VICTORY CONDITIONS SECTION ─── */}
      <section className="section animate-slide-up animate-delay-4" id="victory">
        <div className="section-tag tag-purple">OBJECTIVES · HOW TO WIN</div>
        <h2 className="section-heading">Victory is cryptographic and irreversible.</h2>
        <p className="section-subtitle">
          When the contract detects a win condition, it terminates the match and triggers automatic declassification.
        </p>

        <div className="victory-grid">
          <div className="victory-card protocol-card">
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🛡️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--protocol-light)', marginBottom: 'var(--space-sm)' }}>
              Protocol Victory
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
              The Protocol agents prevail by successfully exposing and voting out the Assassin, or by completing enough defense cycles to neutralize the threat.
            </p>
            <div className="action-chips">
              <span className="action-chip" style={{ borderColor: 'var(--protocol)' }}>ELIMINATE ASSASSIN</span>
              <span className="action-chip" style={{ borderColor: 'var(--protocol)' }}>SURVIVE 5 ROUNDS</span>
            </div>
          </div>

          <div className="victory-card shadow-card">
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🗡️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--shadow-light)', marginBottom: 'var(--space-sm)' }}>
              Shadow Victory
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)', lineHeight: 1.6 }}>
              The Assassin achieves victory when enough Protocol agents have fallen that the Shadow achieves parity or numerical dominance over the table.
            </p>
            <div className="action-chips">
              <span className="action-chip" style={{ borderColor: 'var(--shadow)' }}>EQUAL OR OUTNUMBER</span>
              <span className="action-chip" style={{ borderColor: 'var(--shadow)' }}>PREVENT DETECTION</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ASSEMBLED AGENTS ─── */}
      <section className="section animate-slide-up animate-delay-4">
        <div className="section-tag tag-purple">THE LOBBY · AGENTS READY</div>
        <h2 className="section-heading">Assembled agents.</h2>
        <p className="section-subtitle" style={{ marginBottom: 'var(--space-2xl)' }}>
          {playerCount} players ready for assignment. Roles will be secretly assigned using cryptographic randomness.
        </p>

        <div className="player-grid">
          {gameState.players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      {/* ─── ROADMAP & EXPANSION MODES ─── */}
      <section className="section animate-slide-up animate-delay-4" id="roadmap">
        <div className="section-tag tag-green">EXPANSION · GAME MODES</div>
        <h2 className="section-heading">Beyond the MVP.</h2>
        <p className="section-subtitle">
          Shadow Protocol's Compact contract is architected to support complex hidden-information variants:
        </p>

        <div className="modes-grid">
          <div className="mode-card">
            <span className="mode-badge-live">LIVE (MVP)</span>
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>⚔️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              Classic Protocol
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              6 Players · 1 Assassin · 1 Guardian · 1 Investigator · 3 Civilians. Fast-paced 15-minute matches.
            </p>
          </div>

          <div className="mode-card">
            <span className="mode-badge-upcoming">COMING SOON</span>
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>🩸</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              Assassin Hunt
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              8-10 Players · 2 Assassins with anonymous coordination through private encrypted state.
            </p>
          </div>

          <div className="mode-card">
            <span className="mode-badge-upcoming">IN DESIGN</span>
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>🎭</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
              Double Agent
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              10-12 Players · Role defection mechanics where allegiance can flip based on secret objectives.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA — Bottom ─── */}
      <section className="section animate-slide-up animate-delay-4" style={{ textAlign: 'center' }}>
        <div className="card" style={{ padding: 'var(--space-3xl)', maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="section-heading" style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
            What do multiplayer games become when hidden information stays private?
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto var(--space-xl)', textAlign: 'center' }}>
            Not "Among Us on a blockchain." A privacy-native deduction game that cannot
            function without confidential state — and proves every action, round after round.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={onStartGame}>
              {isWalletConnected ? 'Create a Match →' : '🔒 Create a Match'}
            </button>
            <a href="#roles" className="btn btn-secondary btn-lg">
              Meet the Roles
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
