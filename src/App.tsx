import React, { useState, useCallback } from "react"
import ShadowGame, { Crewmate } from "./game/ShadowGame"
import { WalletConnect } from "./components/WalletConnect"
import { FeedbackModal } from "./components/FeedbackModal"
import { CadetOnboarding } from "./components/CadetOnboarding"
import { PreprodDirectory } from "./components/PreprodDirectory"
import { WalletRequiredModal } from "./components/WalletRequiredModal"
import { ZkAlibiSimulator } from "./components/ZkAlibiSimulator"
import { AegisStationShowcase } from "./components/AegisStationShowcase"
import type { FeedbackSubmission } from "./data/preprodUsers"

/* ---------------------------------- data ---------------------------------- */

export interface WalletState {
  connected: boolean
  address: string | null
  networkId: string | null
}

const TEAMS = {
  protocol: { name: "Protocol", color: "var(--color-signal)" },
  shadow: { name: "Shadow", color: "var(--color-danger)" },
} as const

const ROLES = [
  {
    key: "assassin",
    glyph: "🗡",
    name: "Assassin",
    team: "shadow" as const,
    color: "var(--color-danger)",
    goal: "Eliminate the Guardians and seize numerical control of the game.",
    secret: "Eliminate 2 Protocol players.",
    abilities: ["Assassinate", "Hide identity", "Sabotage"],
    hue: "#e0392b",
    image: "/assets/role_assassin.jpg",
    stats: { primary: "Stealth: 98%", secondary: "Lethality: 95%", tertiary: "Deception: 100%" },
    lore: "Infiltrated Aegis Station under deep cover. Armed with phase-daggers and neural scramblers, their directive is the quiet collapse of the Protocol.",
    cardClass: "cyber-card-danger",
  },
  {
    key: "guardian",
    glyph: "🛡",
    name: "Guardian",
    team: "protocol" as const,
    color: "var(--color-signal)",
    goal: "Protect players through the night and hunt down the Assassin.",
    secret: "Protect at least 2 players.",
    abilities: ["Protect", "Investigate", "Counterattack"],
    hue: "#5ee45b",
    image: "/assets/role_guardian.jpg",
    stats: { primary: "Defense: 100%", secondary: "Interception: 94%", tertiary: "Vigilance: 92%" },
    lore: "Elite Aegis security operative deployed with kinetic energy shields. Sworn to guard innocent crewmates against nocturnal assassinations.",
    cardClass: "cyber-card-signal",
  },
  {
    key: "investigator",
    glyph: "🔎",
    name: "Investigator",
    team: "protocol" as const,
    color: "var(--color-violet)",
    goal: "Discover who is working against the Protocol.",
    secret: "Correctly identify the Assassin.",
    abilities: ["Investigate a player", "Obtain a private clue"],
    hue: "#f55dc0",
    image: "/assets/role_investigator.jpg",
    stats: { primary: "Forensics: 99%", secondary: "Deduction: 96%", tertiary: "Scrutiny: 90%" },
    lore: "Cryptographic forensic detective. Analyzes zero-knowledge trace telemetry to unmask anomalies and reveal the Assassin's identity.",
    cardClass: "cyber-card-violet",
  },
  {
    key: "civilian",
    glyph: "👤",
    name: "Civilian",
    team: "protocol" as const,
    color: "#f59e0b",
    goal: "Survive, complete tasks, and help unmask the Assassin.",
    secret: "Survive 4 rounds.",
    abilities: ["Complete tasks", "Collect evidence", "Vote"],
    hue: "#2f6bff",
    image: "/assets/role_civilian.jpg",
    stats: { primary: "Repair Speed: 96%", secondary: "Station Lore: 92%", tertiary: "Resilience: 88%" },
    lore: "Station engineer and life-support technician. Calibrates station systems and completes critical maintenance to force public emergency meetings.",
    cardClass: "cyber-card-gold",
  },
] as const

const CREW_ROSTER = [
  { id: 0, name: "Alice", role: "Guardian", hue: "#5ee45b", ready: true },
  { id: 1, name: "Bob", role: "Assassin", hue: "#e0392b", ready: true },
  { id: 2, name: "Charlie", role: "Civilian", hue: "#2f6bff", ready: true },
  { id: 3, name: "David", role: "Investigator", hue: "#f55dc0", ready: true },
  { id: 4, name: "Emma", role: "Civilian", hue: "#ef8f2b", ready: true },
  { id: 5, name: "Frank", role: "Guardian", hue: "#33ddd0", ready: true },
]

const EXPANSION_ROLES = ["Spy", "Medic", "Hacker", "Assassin Leader", "Double Agent"]

const LOOP = [
  { n: "01", name: "Create Lobby", icon: "🏠", tone: "public" },
  { n: "02", name: "Join Players", icon: "👥", tone: "public" },
  { n: "03", name: "Secret Roles", icon: "🎭", tone: "private" },
  { n: "04", name: "Secret Quests", icon: "🎯", tone: "private" },
  { n: "05", name: "Night Actions", icon: "🌙", tone: "private" },
  { n: "06", name: "Verify", icon: "🔐", tone: "bridge" },
  { n: "07", name: "Resolve", icon: "⚔️", tone: "public" },
  { n: "08", name: "Day / Discuss", icon: "☀️", tone: "public" },
  { n: "09", name: "Private Vote", icon: "🗳", tone: "private" },
  { n: "10", name: "Public Tally", icon: "📊", tone: "public" },
  { n: "11", name: "Eliminate", icon: "💀", tone: "public" },
  { n: "12", name: "Check Winner", icon: "🏆", tone: "bridge" },
] as const

const PHASES = [
  {
    tag: "PHASE · NIGHT",
    name: "Night",
    icon: "🌙",
    desc: "Each player secretly commits an action — a strike, a shield, an investigation. Choices are sealed; nothing is broadcast to the table.",
    lines: ["assassin.assassinate(Alice)", "guardian.protect(Alice)", "investigator.investigate(Bob)"],
  },
  {
    tag: "PHASE · VERIFY",
    name: "Verification",
    icon: "🔐",
    desc: "Midnight confirms every action is legitimate — right role, right turn, unused, valid target — without exposing who did what.",
    lines: ["is_active(Bob) → true", "has_role(Assassin) → ✓", "reveal(role) → ⊘ withheld"],
  },
  {
    tag: "PHASE · RESOLVE",
    name: "Resolve",
    icon: "⚔️",
    desc: "Actions collide and settle. Bob attacked Alice; Frank protected her. The system surfaces only the outcome, never the cause.",
    lines: ["attack(Alice) ∩ protect(Alice)", "outcome: survived", "attacker + saver → ⊘ private"],
  },
  {
    tag: "PHASE · DAY",
    name: "Day",
    icon: "☀️",
    desc: "The public screen reads: \"A player was attacked last night — the attack failed.\" Now the table talks, accuses, and bluffs.",
    lines: ["event: attack_failed", "eliminations: 0", "floor: open_discussion"],
  },
  {
    tag: "PHASE · VOTE",
    name: "The Vote",
    icon: "🗳",
    desc: "Ballots are committed privately, then revealed only as a tally. No early voter can steer the ones who follow.",
    lines: ["ballots → ⊘ sealed", "tally.Bob = 4  tally.David = 2", "exile: Bob · role revealed"],
  },
] as const

const SCREENS = [
  { step: "01", title: "Connect Wallet", body: "Link a Midnight-compatible wallet. Your identity anchors your private state — nothing about your future role leaks in." },
  { step: "02", title: "Lobby", body: "Players ready up in a shared room (Game #A8F92). The public state knows only that 6 players joined." },
  { step: "03", title: "Your Secret Role", body: "You alone see your identity and objective. 🛡 GUARDIAN · Protect 2 players." },
  { step: "04", title: "Night Phase", body: "A 32-second window to choose your action — Protect, Investigate, Assassinate — committed in secret." },
  { step: "05", title: "Day Phase", body: "Outcomes surface, evidence can be reviewed, and the social deduction begins." },
  { step: "06", title: "Private Vote", body: "Cast a hidden ballot for exile. Votes stay concealed until the round closes." },
  { step: "07", title: "Results", body: "Team victory, individual achievements, and XP — every outcome cryptographically verifiable." },
] as const

const PRIVATE_STATE = ["Player role", "Secret objective", "Private night actions", "Investigation results", "Hidden resources", "Votes before reveal"]
const PUBLIC_STATE = ["Player joined", "Alive / eliminated", "Current round & phase", "Valid outcomes", "Vote tally after close", "Revealed roles & winner"]

const WINS = [
  {
    team: "Protocol",
    color: "var(--color-signal)",
    glyph: "🛡",
    cond: "Wins when every Assassin has been eliminated.",
    detail: "Guardians, Investigators and Civilians survive the Shadow and restore the Protocol.",
  },
  {
    team: "Shadow",
    color: "var(--color-danger)",
    glyph: "🗡",
    cond: "Wins on numerical control of the remaining players.",
    detail: "When Assassins equal or outnumber the Protocol — e.g. 1 Assassin vs 1 Protocol — the Shadow takes the board.",
  },
] as const

const PRINCIPLES = [
  { n: "01", t: "Hidden information", d: "Roles, objectives and strategic actions remain private by default." },
  { n: "02", t: "Verifiable actions", d: "Players cannot lie to the engine about what they are allowed to do." },
  { n: "03", t: "Fair decisions", d: "Voting and simultaneous actions never leak information prematurely." },
  { n: "04", t: "Social gameplay", d: "Players still communicate, bluff, accuse and form strategies." },
  { n: "05", t: "Privacy is gameplay", d: "Remove privacy and the game fundamentally changes — or breaks." },
] as const

const MODES = [
  { name: "Classic", d: "6–12 players, full role set.", live: true },
  { name: "Assassin Hunt", d: "One Assassin against everyone.", live: false },
  { name: "Double Agent", d: "Two players hold secret affiliations.", live: false },
  { name: "Chaos", d: "Everyone runs a different secret objective.", live: false },
  { name: "Team Battle", d: "Two teams of hidden roles collide.", live: false },
  { name: "Tournament", d: "64-player competitive bracket.", live: false },
] as const

const ROADMAP = [
  {
    level: "Level 4",
    title: "Core Prototype",
    status: "SHIPPED",
    live: true,
    meta: "6 players",
    items: ["Wallet connect + lobby", "Random role assignment", "4 roles · private state", "Night actions + validation", "Private voting & tally", "Elimination + win check"],
  },
  {
    level: "Level 5",
    title: "Full Moon MVP",
    status: "SHIPPED",
    live: true,
    meta: "50 Preprod Testers",
    items: ["Aegis Station map & tasks", "Single-use ZK nullifiers", "Cryptographic room alibis", "Sabotages & emergency meetings", "Living feedback loop v1"],
  },
  {
    level: "Level 6",
    title: "Supermoon Release",
    status: "ACTIVE",
    live: true,
    meta: "70 Preprod Users",
    items: ["70 Verified Wallets", "Figma Make UI & Animations", "Living Feedback Loop v2", "Direct Video Gameplay Walkthrough", "Cadet Flight Manual v2"],
  },
  {
    level: "Level 7",
    title: "Full Ecosystem",
    status: "HORIZON",
    live: false,
    meta: "6–12 players",
    items: ["Ranked: Bronze → Legend", "Tournament brackets", "Private economy & rewards", "Seasonal content", "Multiple game modes"],
  },
] as const

/* ------------------------------- primitives ------------------------------- */

function MonoTag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
      style={{ color: color ?? "var(--color-muted)" }}
    >
      <span className="inline-block h-1 w-1 rounded-full" style={{ background: color ?? "var(--color-violet)" }} />
      {children}
    </span>
  )
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <MonoTag>{kicker}</MonoTag>
      <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">{sub}</p>}
    </div>
  )
}

const toneColor = (tone: string) =>
  tone === "private" ? "var(--color-danger)" : tone === "bridge" ? "var(--color-violet)" : "var(--color-signal)"

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const [activeRole, setActiveRole] = useState(0)
  const [activePhase, setActivePhase] = useState(0)
  const [activeScreen, setActiveScreen] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showSecretObjective, setShowSecretObjective] = useState(false)

  // Wallet & Modals State
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    networkId: null,
  })
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showCadetManual, setShowCadetManual] = useState(false)
  const [showWalletRequiredModal, setShowWalletRequiredModal] = useState(false)
  const [, setCommunityFeedback] = useState<FeedbackSubmission[]>([])

  const handleFeedbackSubmit = useCallback((fb: FeedbackSubmission) => {
    setCommunityFeedback((prev) => [fb, ...prev])
  }, [])

  const handleEnterLobby = useCallback(() => {
    setPlaying(true)
  }, [])

  const role = ROLES[activeRole]

  return (
    <div className="min-h-screen bg-[var(--color-void)] font-body text-[var(--color-ink)] antialiased">
      {/* Playable Prototype Modal */}
      {playing && <ShadowGame onExit={() => setPlaying(false)} />}

      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]" style={{ background: "radial-gradient(circle, var(--color-violet-dim), transparent 70%)", animation: "drift 14s ease-in-out infinite" }} />
        <div className="absolute -right-40 top-1/3 h-[440px] w-[440px] rounded-full opacity-25 blur-[130px]" style={{ background: "radial-gradient(circle, var(--color-cyan), transparent 70%)", animation: "drift 18s ease-in-out infinite reverse" }} />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(color-mix(in oklab, var(--color-cyan) 60%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-cyan) 60%, transparent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            animation: "grid-pan 8s linear infinite",
            maskImage: "radial-gradient(circle at 50% 40%, black, transparent 85%)",
          }}
        />
        {/* Horizon sweep */}
        <div className="absolute top-0 h-px w-full opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--color-cyan), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 120%, transparent 55%, rgba(0,0,0,0.55))" }} />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-hairline)]/70 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="group flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-cyan)]/40 bg-[var(--color-panel)] font-display text-sm text-[var(--color-cyan)] text-glow transition duration-500 group-hover:rotate-180">◐</span>
            <span className="font-display text-[15px] font-semibold tracking-[0.14em] text-glow">SHADOW PROTOCOL</span>
          </a>
          <nav className="hidden items-center gap-6 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-muted)] xl:flex">
            <a className="transition hover:text-[var(--color-ink)]" href="#roles">ROLES</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#loop">LOOP</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#station">STATION</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#zk-prover-lab">ZK PROVER</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#privacy">PRIVACY</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#win">WIN</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#preprod-directory">70 USERS</a>
            <a className="transition hover:text-[var(--color-ink)]" href="#roadmap">ROADMAP</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Network Beacon */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-midnight)]/80 px-3 py-1 font-mono text-[11px] text-[var(--color-signal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal)] animate-pulse" />
              <span>MIDNIGHT PREPROD</span>
            </div>

            {/* Official X Link */}
            <a
              href="https://x.com/shadow_pr0tocol"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-[var(--color-hairline)] bg-[var(--color-midnight)]/60 px-3 py-1.5 font-mono text-[11px] text-[var(--color-muted)] transition hover:border-[var(--color-cyan)] hover:text-[var(--color-ink)]"
              title="Official Product Channel on X"
            >
              <span>𝕏</span>
              <span>@shadow_pr0tocol</span>
            </a>

            {/* Cadet Manual Button */}
            <button
              onClick={() => setShowCadetManual(true)}
              className="hidden lg:inline-flex items-center gap-1 rounded-md border border-[var(--color-hairline)] bg-[var(--color-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              title="Open Aegis Cadet Flight Manual"
            >
              📖 Manual
            </button>

            {/* Feedback Button */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="hidden lg:inline-flex items-center gap-1 rounded-md border border-[var(--color-cyan)]/30 bg-[var(--color-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-cyan)] transition hover:brightness-110"
              title="Give Playtest Feedback"
            >
              ✍️ Feedback
            </button>

            {/* 1AM Wallet */}
            <WalletConnect wallet={wallet} setWallet={setWallet} onWalletApi={() => {}} />

            {/* Enter Lobby Button */}
            <button
              onClick={handleEnterLobby}
              className="group relative overflow-hidden rounded-md px-4 py-2 font-display text-[13px] font-semibold tracking-wide text-[#0b0713] transition hover:brightness-110"
              style={{ background: "linear-gradient(120deg, var(--color-cyan), var(--color-violet))", boxShadow: "0 0 22px -6px var(--color-cyan)" }}
            >
              <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md" style={{ animation: "sweep-x 3.5s linear infinite" }} />
              <span className="relative">Enter Lobby</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-signal)]/30 bg-[var(--color-signal)]/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-signal)] animate-pulse" />
              <span>PRIVACY-NATIVE · Built on Midnight · Gaming</span>
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.7rem,6.2vw,5.2rem)] font-bold leading-[0.98] tracking-tight text-white">
              Deception you can{" "}
              <span className="bg-clip-text text-transparent text-glow" style={{ backgroundImage: "linear-gradient(100deg, var(--color-cyan), var(--color-violet), var(--color-magenta))", backgroundSize: "200% 100%", animation: "gradient-shift 6s ease infinite" }}>prove.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--color-muted)]">
              A multiplayer social-deduction strategy game where secret identities, private objectives and hidden
              actions stay concealed — while Midnight cryptographically verifies that every move was legitimate.
              Players can keep secrets, but they <em className="not-italic font-semibold text-[var(--color-ink)]">cannot forge game actions.</em>
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={handleEnterLobby}
                className="group relative overflow-hidden rounded-xl px-7 py-3.5 font-display text-[15px] font-bold tracking-wide text-[#0b0713] transition hover:brightness-110 shadow-lg shadow-[var(--color-cyan)]/25"
                style={{ background: "linear-gradient(120deg, var(--color-cyan), var(--color-violet))" }}
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md" style={{ animation: "sweep-x 3.5s linear infinite" }} />
                <span className="relative flex items-center gap-2">
                  <span>Create a Match</span>
                  <span className="text-lg font-normal">→</span>
                </span>
              </button>
              <a href="#zk-prover-lab" className="rounded-xl border border-[var(--color-cyan)]/40 bg-[var(--color-panel)] px-6 py-3.5 font-display text-[14px] font-semibold tracking-wide text-[var(--color-cyan)] transition hover:border-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10">
                ⚡ Test ZK Prover
              </a>
              <a href="#station" className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)]/70 px-5 py-3.5 font-display text-[14px] font-medium text-[var(--color-muted)] transition hover:border-white/20 hover:text-white">
                🚀 Station Map
              </a>
            </div>

            {/* 3 Metric Bento Cards */}
            <div className="mt-9 grid grid-cols-3 gap-3">
              <div className="cyber-card rounded-2xl p-4 text-center">
                <div className="font-display text-2xl font-bold text-white">6–12</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Players / Match</div>
              </div>
              <div className="cyber-card rounded-2xl p-4 text-center">
                <div className="font-display text-2xl font-bold text-[var(--color-cyan)]">1.12s</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">ZK Prover Speed</div>
              </div>
              <div className="cyber-card rounded-2xl p-4 text-center">
                <div className="font-display text-2xl font-bold text-[var(--color-signal)]">70 / 70</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Preprod Cadets</div>
              </div>
            </div>

            {/* 6-Player Live Agent Roster preview */}
            <div className="mt-6 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-panel)]/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">Active Match Roster · 6 Players</span>
                <span className="font-mono text-[10px] text-[var(--color-signal)]">● All Systems Nominal</span>
              </div>
              <div className="mt-3 grid grid-cols-6 gap-2">
                {CREW_ROSTER.map((agent) => (
                  <div key={agent.id} className="flex flex-col items-center gap-1 text-center">
                    <Crewmate hue={agent.hue} size={36} floating delay={agent.id * 0.25} />
                    <span className="font-display text-[11px] font-semibold text-[var(--color-ink)]">{agent.name}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-[var(--color-muted)]">{agent.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Centerpiece - Cinematic Cyber Command Deck Card */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl blur-3xl opacity-40" style={{ background: "radial-gradient(circle, var(--color-cyan), var(--color-violet), transparent 70%)" }} />
            <div className="cyber-card hud-bracket relative overflow-hidden rounded-3xl border border-[var(--color-cyan)]/30 group">
              <div className="relative h-[480px] sm:h-[520px] w-full overflow-hidden">
                <img
                  src="/assets/hero_cyber_deck.jpg"
                  alt="Aegis Station Command Deck"
                  className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void)] via-transparent to-black/50" />
                <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

                {/* Radar Sweep Animated Badge */}
                <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border border-[var(--color-cyan)]/40 bg-[var(--color-cyan)]/10 overflow-hidden shadow-[0_0_20px_rgba(51,221,208,0.25)]">
                  <div className="radar-sweep-beam h-full w-full" style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(51, 221, 208, 0.45) 360deg)" }} />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)] animate-ping" />
                  </div>
                </div>

                {/* Floating Telemetry Tag: Top Left */}
                <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/65 backdrop-blur-md px-3.5 py-1.5 font-mono text-[11px] text-[var(--color-cyan)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-cyan)] animate-pulse" />
                  <span>#SP-A8F92 · DECK 01</span>
                </div>

                {/* Floating Telemetry Tag: Mid-left */}
                <div className="absolute bottom-24 left-6 flex items-center gap-2 rounded-full border border-[var(--color-signal)]/35 bg-black/75 backdrop-blur-md px-3.5 py-1.5 font-mono text-[11px] text-[var(--color-signal)] shadow-lg">
                  <span>🛡 ZK ROLLUP PROVER: ONLINE (1.12s)</span>
                </div>

                {/* Floating Telemetry Tag: Mid-right */}
                <div className="absolute bottom-24 right-6 flex items-center gap-2 rounded-full border border-[var(--color-danger)]/35 bg-black/75 backdrop-blur-md px-3.5 py-1.5 font-mono text-[11px] text-[var(--color-danger)] shadow-lg">
                  <span>⚠ 1 SHADOW DETECTED</span>
                </div>

                {/* Bottom Bar Info & Launch Action */}
                <div className="absolute bottom-0 inset-x-0 border-t border-white/10 bg-black/80 backdrop-blur-md p-5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Aegis Command Telemetry</div>
                    <div className="font-display text-sm font-semibold text-white">Midnight Zero-Knowledge Layer Active</div>
                  </div>
                  <button
                    onClick={handleEnterLobby}
                    className="rounded-xl bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-violet)] px-4 py-2 font-display text-xs font-bold text-[#090c18] hover:brightness-110 transition shadow-md"
                  >
                    Enter Match
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Midnight */}
      <section id="why-midnight" className="border-y border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHead
            kicker="Why Midnight"
            title="If the hidden information were public, the game would break."
            sub="Traditional chains are radically transparent. Put “Bob = Assassin” or “Alice has 500 gold” on-chain and anyone can inspect it — mystery gone. Shadow Protocol keeps sensitive state confidential while still proving every action followed the rules."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { k: "Public roles", v: "no mystery", d: "Everyone knows the Assassin before the first night falls." },
              { k: "Public actions", v: "no deception", d: "You can't bluff a claim the whole table already watched happen." },
              { k: "Public votes", v: "no fair vote", d: "Early ballots visibly steer everyone who votes after them." },
            ].map((c) => (
              <div key={c.k} className="cyber-card rounded-2xl p-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{c.k}</div>
                <div className="mt-2 font-display text-xl font-semibold text-[var(--color-danger)]">→ {c.v}</div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 font-display text-lg text-[var(--color-ink)]">
            Privacy isn't an add-on. <span style={{ color: "var(--color-signal)" }}>Privacy is the gameplay.</span>
          </p>
        </div>
      </section>

      {/* Roles: Pinterest/Dribbble Bento Grid & Terminal */}
      <section id="roles" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead
          kicker="The Cast · Four Classified Roles"
          title="Two teams. Four hidden roles."
          sub="Each match secretly deals every player one identity. You know only your own. The Protocol defends; the Shadow deceives."
        />

        {/* 4 Character Cards Bento Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r, i) => {
            const isSelected = i === activeRole
            return (
              <div
                key={r.key}
                onClick={() => {
                  setActiveRole(i)
                  setShowSecretObjective(false)
                }}
                className={`cyber-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${r.cardClass} ${
                  isSelected
                    ? 'border-[2px] shadow-2xl scale-[1.02]'
                    : 'border-white/10 opacity-85 hover:opacity-100 hover:scale-[1.01]'
                }`}
                style={{ borderColor: isSelected ? r.color : undefined }}
              >
                {/* Character Portrait */}
                <div className="relative h-48 w-full overflow-hidden bg-black">
                  <img
                    src={r.image}
                    alt={r.name}
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-panel)] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider"
                      style={{
                        color: TEAMS[r.team].color,
                        background: 'rgba(0,0,0,0.7)',
                        border: `1px solid ${TEAMS[r.team].color}`,
                      }}
                    >
                      {TEAMS[r.team].name}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 text-lg">
                    {r.glyph}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold" style={{ color: r.color }}>
                      {r.name}
                    </h3>
                    <span className="font-mono text-[10px] text-[var(--color-muted)]">ACTIVE</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
                    {r.goal}
                  </p>

                  {/* Character Stats Bar */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-white/90">
                      <span>{r.stats.primary}</span>
                      <span className="text-[var(--color-cyan)]">●</span>
                    </div>
                    <div className="flex items-center justify-between text-white/70">
                      <span>{r.stats.secondary}</span>
                      <span className="text-[var(--color-violet)]">●</span>
                    </div>
                  </div>

                  {/* Ability Badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {r.abilities.map((a) => (
                      <span key={a} className="rounded-md border border-[var(--color-hairline)] bg-[var(--color-midnight)]/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Role Detailed Inspection Terminal */}
        <div className="mt-10 cyber-card hud-bracket rounded-3xl p-7 lg:p-10 border border-[var(--color-cyan)]/25">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] items-center">
            {/* Left: High-Res Portrait Frame */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black h-[320px] shadow-2xl">
              <img
                src={role.image}
                alt={role.name}
                className="h-full w-full object-cover object-top"
              />
              <div className="scanlines absolute inset-0 pointer-events-none opacity-40" />
              <div className="absolute top-3 left-3">
                <MonoTag color={role.color}>Classified Dossier</MonoTag>
              </div>
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/75 backdrop-blur-md p-2.5 font-mono text-[10px] text-[var(--color-muted)] flex items-center justify-between">
                <span>IDENTITY COMMITMENT</span>
                <span className="text-[var(--color-danger)] font-bold">⊘ SEALED</span>
              </div>
            </div>

            {/* Right: Role Details, Audio Frequency, and Secret Objective */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: TEAMS[role.team].color }}>
                    Faction: {TEAMS[role.team].name} Syndicate
                  </span>
                  <h3 className="font-display text-3xl font-extrabold text-white mt-1" style={{ color: role.color }}>
                    {role.glyph} {role.name}
                  </h3>
                </div>
                {/* Audio Frequency Waveform */}
                <div className="flex items-center gap-1 h-6 px-3 rounded-full bg-white/5 border border-white/10">
                  <span className="font-mono text-[9px] uppercase text-[var(--color-muted)] mr-1">Voiceprint</span>
                  <span className="audio-bar w-1 bg-[var(--color-cyan)] rounded-full h-full" />
                  <span className="audio-bar w-1 bg-[var(--color-cyan)] rounded-full h-full" style={{ animationDelay: '0.2s' }} />
                  <span className="audio-bar w-1 bg-[var(--color-cyan)] rounded-full h-full" style={{ animationDelay: '0.4s' }} />
                  <span className="audio-bar w-1 bg-[var(--color-cyan)] rounded-full h-full" style={{ animationDelay: '0.1s' }} />
                  <span className="audio-bar w-1 bg-[var(--color-cyan)] rounded-full h-full" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/80">
                {role.lore}
              </p>

              {/* Secret Objective Box with Toggle */}
              <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-hairline)] bg-[var(--color-midnight)]/90 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    Classified Personal Mission
                  </div>
                  <button
                    onClick={() => setShowSecretObjective(!showSecretObjective)}
                    className="font-mono text-xs text-[var(--color-cyan)] hover:underline"
                  >
                    {showSecretObjective ? 'Hide Objective ⊘' : 'Reveal Objective 👁️'}
                  </button>
                </div>
                <div className="mt-2 font-display text-base text-white">
                  {showSecretObjective ? (
                    <span className="text-[var(--color-cyan)] font-semibold">{role.secret}</span>
                  ) : (
                    <span className="font-mono text-xs text-[var(--color-muted)] tracking-widest">
                      ••••••••••••••••••••••••••••• [CLICK REVEAL TO DECRYPT]
                    </span>
                  )}
                </div>
              </div>

              {/* Cryptographic Verifier Line */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--color-muted)]">
                <div>
                  zk-snark::verify_role_integrity(commitment) → <span className="text-[var(--color-signal)]">✓ VALID</span>
                </div>
                <div className="text-[var(--color-muted)]">
                  Visibility to table: <span className="text-[var(--color-danger)] font-bold">⊘ HIDDEN UNTIL END</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level 6+ Expansion Roles */}
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-[var(--color-hairline)] bg-[var(--color-panel)]/40 px-6 py-4">
          <MonoTag color="var(--color-violet)">Level 6+ Expansion</MonoTag>
          <div className="flex flex-wrap gap-2">
            {EXPANSION_ROLES.map((r) => (
              <span key={r} className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-midnight)]/60 px-3.5 py-1 font-mono text-[11px] text-[var(--color-muted)]">
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Full loop ribbon */}
      <section id="loop" className="border-y border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHead kicker="The Gameplay Loop" title="Lobby to victory — twelve steps, repeated each round." sub="Green is public, red stays private, violet is the Midnight bridge where secrets become verifiable truth." />
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {LOOP.map((s) => (
              <div key={s.n} className="group relative rounded-lg border border-[var(--color-hairline)] bg-[var(--color-panel)]/60 p-4 transition hover:border-[color:var(--tc)]" style={{ ["--tc" as string]: toneColor(s.tone) }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-mono text-[10px]" style={{ color: toneColor(s.tone) }}>{s.n}</span>
                </div>
                <div className="mt-2 font-display text-[13px] font-medium leading-snug">{s.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em]">
            <span className="text-[var(--color-signal)]">● Public state</span>
            <span className="text-[var(--color-danger)]">● Private state</span>
            <span className="text-[var(--color-violet)]">● Midnight bridge</span>
          </div>

          {/* Phase deep dive */}
          <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-2">
              {PHASES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setActivePhase(i)}
                  className="flex items-center gap-4 rounded-xl border p-4 text-left transition"
                  style={{ borderColor: i === activePhase ? "var(--color-violet)" : "var(--color-hairline)", background: i === activePhase ? "var(--color-panel-2)" : "transparent" }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-xl" style={{ borderColor: i === activePhase ? "var(--color-violet)" : "var(--color-hairline)", background: "var(--color-midnight)" }}>{p.icon}</span>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">{p.tag}</div>
                    <div className="font-display text-lg font-semibold">{p.name}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-void)] p-7">
              <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
                <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">shadow://round.03/{PHASES[activePhase].name.toLowerCase()}</span>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-muted)]">{PHASES[activePhase].desc}</p>
              <div className="mt-6 space-y-2 font-mono text-[13px]">
                {PHASES[activePhase].lines.map((l, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="select-none text-[var(--color-violet-dim)]">›</span>
                    <span className={l.includes("⊘") ? "text-[var(--color-danger)]" : /✓|true|survived|sealed/.test(l) ? "text-[var(--color-signal)]" : "text-[var(--color-ink)]"}>{l}</span>
                  </div>
                ))}
                <div className="flex gap-3 pt-1">
                  <span className="select-none text-[var(--color-violet-dim)]">›</span>
                  <span className="inline-block h-4 w-2 animate-pulse bg-[var(--color-signal)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aegis Station Tactical Schematics & Minigames */}
      <AegisStationShowcase />

      {/* Screens */}
      <section id="screens" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead kicker="The Interface" title="Seven screens, one match." sub="From wallet to results — a walkthrough of the player journey." />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-1.5">
            {SCREENS.map((s, i) => (
              <button
                key={s.step}
                onClick={() => setActiveScreen(i)}
                className="flex items-center gap-4 rounded-lg px-4 py-3 text-left transition"
                style={{ background: i === activeScreen ? "var(--color-panel-2)" : "transparent" }}
              >
                <span className="font-mono text-[12px]" style={{ color: i === activeScreen ? "var(--color-signal)" : "var(--color-muted)" }}>{s.step}</span>
                <span className="font-display text-[15px] font-medium" style={{ color: i === activeScreen ? "var(--color-ink)" : "var(--color-muted)" }}>{s.title}</span>
              </button>
            ))}
          </div>
          <div className="cyber-card relative overflow-hidden rounded-2xl p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--color-violet-dim), transparent 70%)" }} />
            <div className="relative">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Screen {SCREENS[activeScreen].step}</div>
              <h3 className="mt-3 font-display text-3xl font-semibold">{SCREENS[activeScreen].title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">{SCREENS[activeScreen].body}</p>
              <div className="mt-8 flex gap-1.5">
                {SCREENS.map((_, i) => (
                  <span key={i} className="h-1 flex-1 rounded-full transition" style={{ background: i === activeScreen ? "var(--color-signal)" : "var(--color-hairline)" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy boundary + anti-cheat */}
      <section id="privacy" className="border-y border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHead kicker="The Privacy Boundary" title="What stays sealed. What the table sees." sub="The chain provides verifiable execution while sensitive information stays confidential — a clean line between private and public state." />
          <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="cyber-card rounded-2xl border border-dashed border-[var(--color-danger)]/40 p-7">
              <MonoTag color="var(--color-danger)">Private · ⊘ sealed</MonoTag>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-ink)]">
                {PRIVATE_STATE.map((x) => (<li key={x} className="flex items-center gap-3"><span className="text-[var(--color-danger)]">◦</span>{x}</li>))}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 px-2">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--color-violet)] bg-[var(--color-panel-2)] text-2xl" style={{ animation: "pulse-ring 2.6s infinite" }}>◐</div>
              <div className="text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[var(--color-muted)]">Midnight<br />verifies</div>
              <div className="rounded bg-[var(--color-signal)]/12 px-2.5 py-1 font-mono text-[11px] text-[var(--color-signal)]">valid ✓</div>
            </div>
            <div className="cyber-card rounded-2xl p-7">
              <MonoTag color="var(--color-signal)">Public game state</MonoTag>
              <ul className="mt-5 space-y-3 text-sm text-[var(--color-ink)]">
                {PUBLIC_STATE.map((x) => (<li key={x} className="flex items-center gap-3"><span className="text-[var(--color-signal)]">◦</span>{x}</li>))}
              </ul>
            </div>
          </div>

          {/* Anti-cheat + verifiable claim */}
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="cyber-card rounded-2xl p-7">
              <MonoTag color="var(--color-violet)">Anti-cheat by design</MonoTag>
              <p className="mt-4 font-display text-2xl font-semibold leading-snug">
                Players can keep secrets — but they <span className="text-[var(--color-signal)]">cannot forge game actions.</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                The engine never trusts the frontend. A Civilian can't submit an investigation; a dead player can't act; nobody can change a committed choice after seeing another's move. Commit → reveal locks the night.
              </p>
            </div>
            <div className="cyber-card grid gap-4 rounded-2xl p-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Private input</div>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[var(--color-muted)]">{`role   = Guardian
target = Charlie
round  = 4`}</pre>
              </div>
              <div className="border-t border-[var(--color-hairline)] pt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Verifiable claim</div>
                <div className="mt-2 font-mono text-[13px] text-[var(--color-ink)]">is_authorized(protect)?</div>
                <div className="mt-1 font-mono text-[13px] text-[var(--color-signal)]">→ YES · full state never revealed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Zero-Knowledge Alibi Simulator */}
      <ZkAlibiSimulator />

      {/* Win conditions */}
      <section id="win" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead kicker="Victory" title="Two teams. Two paths to win — plus your own." sub="Even on a losing team you can still complete your secret objective for an individual achievement." />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {WINS.map((w) => (
            <div key={w.team} className="relative overflow-hidden rounded-2xl border p-8" style={{ borderColor: w.color }}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, " + w.color + ", transparent 70%)" }} />
              <div className="relative">
                <div className="text-4xl">{w.glyph}</div>
                <div className="mt-4 font-display text-2xl font-semibold" style={{ color: w.color }}>{w.team} Victory</div>
                <p className="mt-3 text-[15px] font-medium text-[var(--color-ink)]">{w.cond}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{w.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Results / rewards mock */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-panel)]/70 p-7 md:grid-cols-[1fr_1fr]">
          <div>
            <MonoTag color="var(--color-signal)">Match complete</MonoTag>
            <div className="mt-4 font-display text-3xl font-bold" style={{ color: "var(--color-signal)" }}>PROTOCOL VICTORY 🏆</div>
            <div className="mt-4 flex flex-wrap gap-6 font-display">
              <div><span className="text-2xl font-semibold text-[var(--color-ink)]">+250</span> <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">XP</span></div>
              <div><span className="text-2xl font-semibold text-[var(--color-ink)]">+40</span> <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">Reputation</span></div>
              <div><span className="rounded bg-[var(--color-gold)]/15 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-gold)]">🏅 Master Investigator</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)]/60 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Individual achievements</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-[var(--color-ink)]"><span className="text-[var(--color-signal)]">✓</span> David — Assassin Identified</li>
              <li className="flex items-center gap-2 text-[var(--color-ink)]"><span className="text-[var(--color-signal)]">✓</span> Alice — 2 Players Protected</li>
              <li className="flex items-center gap-2 text-[var(--color-ink)]"><span className="text-[var(--color-signal)]">✓</span> Charlie — Survived 4 Rounds</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionHead kicker="Design Philosophy" title="Five principles hold the game together." />
          <div className="mt-12 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {PRINCIPLES.map((p) => (
              <div key={p.n} className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-panel)]/60 p-5">
                <div className="font-mono text-[12px] text-[var(--color-violet)]">{p.n}</div>
                <div className="mt-3 font-display text-[15px] font-semibold">{p.t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap + modes */}
      <section id="roadmap" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead kicker="Roadmap" title="From 6-player prototype to tournament arena." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ROADMAP.map((r) => (
            <div key={r.level} className="relative overflow-hidden rounded-2xl border p-7" style={{ borderColor: r.live ? "var(--color-violet)" : "var(--color-hairline)", background: r.live ? "var(--color-panel-2)" : "transparent" }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{r.level} · {r.meta}</span>
                <span className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: r.live ? "var(--color-signal)" : "var(--color-muted)", background: r.live ? "color-mix(in oklab, var(--color-signal) 14%, transparent)" : "var(--color-panel)" }}>{r.status}</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold">{r.title}</h3>
              <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-muted)]">
                {r.items.map((it) => (<li key={it} className="flex items-center gap-3"><span style={{ color: r.live ? "var(--color-violet)" : "var(--color-hairline)" }}>▸</span>{it}</li>))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <MonoTag color="var(--color-gold)">Future game modes</MonoTag>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-xl border border-[var(--color-hairline)] bg-[var(--color-panel)]/50 px-5 py-4">
                <div>
                  <div className="font-display text-[15px] font-semibold">{m.name}</div>
                  <div className="mt-0.5 text-[13px] text-[var(--color-muted)]">{m.d}</div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: m.live ? "var(--color-signal)" : "var(--color-muted)" }}>{m.live ? "Live" : "Soon"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level 6: 70 Preprod User Directory & Living Feedback Loop */}
      <section className="border-t border-[var(--color-hairline)]/60 bg-[var(--color-midnight)]/50">
        <PreprodDirectory
          onOpenFeedback={() => setShowFeedbackModal(true)}
          onOpenCadetManual={() => setShowCadetManual(true)}
        />
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-6 py-28">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-panel)] p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(600px circle at 50% -10%, var(--color-violet-dim), transparent 70%)" }} />
          <div className="relative">
            <MonoTag color="var(--color-signal)">The strongest pitch</MonoTag>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(1.8rem,4.5vw,3.2rem)] font-bold leading-[1.05] tracking-tight">What do multiplayer games become when hidden information stays private?</h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
              Not “Among Us on a blockchain.” A privacy-native deduction game that cannot function without confidential state — and proves every action, round after round.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleEnterLobby}
                className="group relative overflow-hidden rounded-md px-7 py-3 font-display text-[14px] font-semibold tracking-wide text-[#0b0713] transition hover:brightness-110"
                style={{ background: "linear-gradient(120deg, var(--color-cyan), var(--color-violet))", boxShadow: "0 0 30px -6px var(--color-cyan)" }}
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md" style={{ animation: "sweep-x 3.5s linear infinite" }} />
                <span className="relative">Create a Match</span>
              </button>
              <a href="#roles" className="rounded-md border border-[var(--color-hairline)] px-7 py-3 font-display text-[14px] font-semibold tracking-wide transition hover:border-[var(--color-violet)]">Meet the Roles</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-hairline)]/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-[var(--color-hairline)] bg-[var(--color-panel)] text-xs">◐</span>
            <span className="font-display text-[13px] font-semibold tracking-[0.14em]">SHADOW PROTOCOL</span>
          </div>
          <div className="flex flex-col items-center gap-1 md:items-end">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Midnight Builder Challenge · Level 6 Supermoon</p>
            <p className="font-mono text-[10px] tracking-wider text-[var(--color-muted)]/80">Powered by Midnight · Privacy is the mechanic</p>
          </div>
        </div>
      </footer>

      {/* Level 6 Modals */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        playerHandle="cadet_player"
      />

      <CadetOnboarding
        isOpen={showCadetManual}
        onClose={() => setShowCadetManual(false)}
      />

      <WalletRequiredModal
        isOpen={showWalletRequiredModal}
        onClose={() => setShowWalletRequiredModal(false)}
        onConnect={() => window.dispatchEvent(new CustomEvent("trigger-1am-connect"))}
      />
    </div>
  )
}
