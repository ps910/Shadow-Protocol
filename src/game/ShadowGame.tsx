import React, { useEffect, useMemo, useRef, useState } from "react"

/* --------------------------------------------------------------------------
   Shadow Protocol — Level 4 playable prototype, Among Us styling.
   A local 6-player match: you + 5 crewmates. Full loop:
   lobby → role reveal → night (tasks) → verify → resolve → day →
   emergency meeting vote → ejection → win check → next round / results.
---------------------------------------------------------------------------*/

type RoleKey = "assassin" | "guardian" | "investigator" | "civilian"
type Team = "shadow" | "protocol"
type Phase = "lobby" | "reveal" | "night" | "verify" | "resolve" | "day" | "vote" | "tally" | "over"

const ROLE_META: Record<RoleKey, { name: string; team: Team; glyph: string; color: string; blurb: string }> = {
  assassin: { name: "Assassin", team: "shadow", glyph: "🗡", color: "var(--color-danger)", blurb: "Eliminate the Protocol. Strike one crewmate each night." },
  guardian: { name: "Guardian", team: "protocol", glyph: "🛡", color: "var(--color-signal)", blurb: "Shield one crewmate each night — including yourself." },
  investigator: { name: "Investigator", team: "protocol", glyph: "🔎", color: "var(--color-violet)", blurb: "Scan one crewmate each night to learn their faction." },
  civilian: { name: "Civilian", team: "protocol", glyph: "👤", color: "#9aa2cf", blurb: "No night power. Do your tasks, read the room, and vote." },
}

const TEAM_COLOR: Record<Team, string> = { shadow: "var(--color-danger)", protocol: "var(--color-signal)" }

const NAMES = ["Bob", "Charlie", "David", "Emma", "Frank"]
// vivid crewmate colors — you are lime and stand out
const HUES = ["#5ee45b", "#e0392b", "#2f6bff", "#f55dc0", "#ef8f2b", "#33ddd0"]
// 6-player deal: 1 Assassin, 2 Guardian, 1 Investigator, 2 Civilian
const DEAL: RoleKey[] = ["assassin", "guardian", "guardian", "investigator", "civilian", "civilian"]

interface Player {
  id: number
  name: string
  role: RoleKey
  team: Team
  alive: boolean
  isYou: boolean
  hue: string
}

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

function makePlayers(): Player[] {
  const roles = shuffle(DEAL)
  const names = ["You", ...NAMES]
  return names.map((name, i) => ({
    id: i, name, role: roles[i], team: ROLE_META[roles[i]].team, alive: true, isYou: i === 0, hue: HUES[i],
  }))
}

/* ------------------------------- crewmate art ----------------------------- */

export function Crewmate({ hue, size = 56, dead = false, floating = false, delay = 0 }: { hue: string; size?: number; dead?: boolean; floating?: boolean; delay?: number }) {
  const anim = dead ? undefined : floating ? `float-bob 3s ease-in-out ${delay}s infinite` : `idle-sway 4s ease-in-out ${delay}s infinite`
  return (
    <svg
      viewBox="0 0 100 108" width={size} height={size * 1.08}
      style={{ filter: dead ? "grayscale(0.8) brightness(0.6)" : `drop-shadow(0 4px 10px ${hue}66)`, animation: anim, transformOrigin: "50% 90%", overflow: "visible" }}
    >
      {/* backpack */}
      <rect x="14" y="42" width="20" height="34" rx="10" fill={hue} style={{ filter: "brightness(0.72)" }} />
      {/* body + legs */}
      <path
        d="M40 30 Q40 12 60 12 Q80 12 80 30 L80 84 L70 84 L70 72 L64 72 L64 84 L54 84 L54 72 L48 72 L48 84 L38 84 Z"
        fill={hue} stroke="rgba(0,0,0,0.35)" strokeWidth="2"
      />
      {/* visor */}
      <ellipse cx="64" cy="34" rx="16" ry="12" fill={dead ? "#3a3f55" : "#9fd2ea"} stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
      {/* animated visor sheen */}
      {!dead && (
        <ellipse cx="66" cy="33" rx="14" ry="10" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.25">
          <animate attributeName="opacity" values="0.05;0.4;0.05" dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
        </ellipse>
      )}
      <ellipse cx="70" cy="30" rx="5" ry="4" fill="#ffffff" opacity="0.7" />
      {dead && <text x="60" y="40" fontSize="16" textAnchor="middle" fill="#c9ccdd">✕</text>}
    </svg>
  )
}

export function Starfield() {
  const stars = useMemo(
    () => Array.from({ length: 42 }, () => ({
      top: Math.random() * 100, left: Math.random() * 100,
      s: Math.random() * 2 + 1, d: Math.random() * 3 + 1.5, delay: Math.random() * 3,
    })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((st, i) => (
        <span key={i} className="absolute rounded-full bg-white" style={{ top: `${st.top}%`, left: `${st.left}%`, width: st.s, height: st.s, animation: `twinkle ${st.d}s ease-in-out ${st.delay}s infinite` }} />
      ))}
    </div>
  )
}

function CrewCard({ p, selected, onClick, disabled, badge, badgeColor }: { p: Player; selected?: boolean; onClick?: () => void; disabled?: boolean; badge?: string; badgeColor?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex w-full flex-col items-center gap-1 rounded-xl border p-3 transition enabled:hover:-translate-y-1 enabled:hover:shadow-lg enabled:active:scale-95 disabled:opacity-40"
      style={{ borderColor: selected ? p.hue : "var(--color-hairline)", background: selected ? "var(--color-panel-2)" : "transparent" }}
    >
      <Crewmate hue={p.hue} size={46} dead={!p.alive} />
      <span className="font-display text-[12px] font-medium">{p.name}</span>
      {badge && <span className="absolute -right-1 -top-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]" style={{ background: badgeColor ?? p.hue, color: "#08070d" }}>{badge}</span>}
    </button>
  )
}

/* ------------------------------ mini-game --------------------------------- */
// "Signal Lock" — a sweeping marker must be locked inside the target zone
// three times to authorize the night action. A station task, cyberpunk-styled.

function SignalLock({ accent, verb, onDone }: { accent: string; verb: string; onDone: () => void }) {
  const [pos, setPos] = useState(4)
  const [zone, setZone] = useState(38)
  const [locks, setLocks] = useState(0)
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null)
  const [done, setDone] = useState(false)
  const ZONE_W = 15
  const need = 3

  useEffect(() => {
    let p = 4, d = 1
    const speed = 1.9
    const id = window.setInterval(() => {
      p += d * speed
      if (p >= 100) { p = 100; d = -1 }
      if (p <= 0) { p = 0; d = 1 }
      setPos(p)
    }, 16)
    return () => clearInterval(id)
  }, [])

  const lock = () => {
    if (done) return
    const hit = pos >= zone && pos <= zone + ZONE_W
    if (hit) {
      const n = locks + 1
      setFlash("hit")
      if (n >= need) { setDone(true); setLocks(n); window.setTimeout(onDone, 500); return }
      setLocks(n)
      setZone(12 + Math.random() * 62)
    } else {
      setFlash("miss")
    }
    window.setTimeout(() => setFlash(null), 180)
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Station Task · Signal Lock</div>
      <h3 className="mt-1 font-display text-xl font-bold" style={{ color: accent }}>Calibrate to {verb.toLowerCase()}</h3>
      <p className="mt-1 text-[13px] text-[var(--color-muted)]">Lock the pulse inside the band — {need} times to seal your action.</p>

      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: need }).map((_, i) => (
          <span key={i} className="h-1.5 w-10 rounded-full transition" style={{ background: i < locks ? accent : "var(--color-hairline)", boxShadow: i < locks ? `0 0 10px ${accent}` : undefined }} />
        ))}
      </div>

      <div
        className="relative mt-5 h-16 overflow-hidden rounded-xl border transition"
        style={{ borderColor: flash === "hit" ? "var(--color-signal)" : flash === "miss" ? "var(--color-danger)" : "var(--color-hairline)", background: "var(--color-void)", boxShadow: flash === "hit" ? "0 0 24px -6px var(--color-signal)" : flash === "miss" ? "0 0 24px -6px var(--color-danger)" : undefined }}
      >
        {/* grid ticks */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 9%, color-mix(in oklab, var(--color-cyan) 30%, transparent) 9% 9.4%)" }} />
        {/* target zone */}
        <div className="absolute inset-y-2 rounded" style={{ left: `${zone}%`, width: `${ZONE_W}%`, background: `color-mix(in oklab, ${accent} 22%, transparent)`, border: `1px solid ${accent}`, boxShadow: `inset 0 0 16px -6px ${accent}` }} />
        {/* marker */}
        <div className="absolute inset-y-0 w-0.5" style={{ left: `${pos}%`, background: "#fff", boxShadow: "0 0 12px 2px #fff" }} />
      </div>

      <button
        onClick={lock}
        disabled={done}
        className="mt-5 w-full rounded-md px-6 py-3 font-display text-[15px] font-bold tracking-wide text-[#08070d] transition enabled:hover:brightness-110 disabled:opacity-60"
        style={{ background: `linear-gradient(120deg, ${accent}, var(--color-violet))`, boxShadow: `0 0 24px -8px ${accent}` }}
      >
        {done ? "SEALED ✓" : "◉ LOCK"}
      </button>
    </div>
  )
}

/* ---------------------------------- game ---------------------------------- */

export default function ShadowGame({ onExit }: { onExit: () => void }) {
  const [players, setPlayers] = useState<Player[]>(makePlayers)
  const [phase, setPhase] = useState<Phase>("lobby")
  const [round, setRound] = useState(1)
  const [feed, setFeed] = useState<string[]>([])
  const [nightEvent, setNightEvent] = useState<string>("")
  const [clue, setClue] = useState<string>("")
  const [yourNightPick, setYourNightPick] = useState<number | null>(null)
  const [miniTarget, setMiniTarget] = useState<number | null>(null)
  const [miniOpen, setMiniOpen] = useState(false)
  const [tally, setTally] = useState<{ id: number; votes: number }[]>([])
  const [exiledId, setExiledId] = useState<number | null>(null)
  const [winner, setWinner] = useState<Team | null>(null)
  const [verifyStep, setVerifyStep] = useState(0)

  const you = players[0]
  const alive = useMemo(() => players.filter((p) => p.alive), [players])
  const aliveOthers = useMemo(() => alive.filter((p) => !p.isYou), [alive])
  const timers = useRef<number[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  useEffect(() => () => clearTimers(), [])

  const logLine = (line: string) => setFeed((f) => [line, ...f].slice(0, 8))

  const checkWinner = (ps: Player[]): Team | null => {
    const a = ps.filter((p) => p.alive && p.team === "shadow").length
    const pr = ps.filter((p) => p.alive && p.team === "protocol").length
    if (a === 0) return "protocol"
    if (a >= pr) return "shadow"
    return null
  }

  const startMatch = () => setPhase("reveal")

  const beginNight = () => {
    setYourNightPick(null); setMiniTarget(null); setMiniOpen(false); setClue(""); setPhase("night")
    if (!you.alive) later(() => submitNight(null), 200)
  }

  // open the Signal Lock task; on success it commits the (already chosen) action
  const openMini = (target: number | null) => { setMiniTarget(target); setMiniOpen(true) }
  const finishMini = () => { setMiniOpen(false); submitNight(miniTarget) }

  const submitNight = (targetId: number | null) => {
    const alivePlayers = players.filter((p) => p.alive)
    const guardianProtects = new Set<number>()
    let assassinTarget: number | null = null
    let yourClue = ""

    alivePlayers.forEach((p) => {
      if (p.isYou) {
        if (p.role === "guardian" && targetId != null) guardianProtects.add(targetId)
        if (p.role === "assassin" && targetId != null) assassinTarget = targetId
        if (p.role === "investigator" && targetId != null) {
          const t = players[targetId]
          yourClue = `Scan: ${t.name} reads ${ROLE_META[t.role].team === "shadow" ? "SHADOW" : "PROTOCOL"} alignment.`
        }
        return
      }
      const others = alivePlayers.filter((o) => o.id !== p.id)
      if (p.role === "assassin") {
        const prot = others.filter((o) => o.team === "protocol")
        assassinTarget = pick(prot.length ? prot : others).id
      }
      if (p.role === "guardian") guardianProtects.add(pick(alivePlayers).id)
    })

    setYourNightPick(targetId)
    if (yourClue) setClue(yourClue)
    setPhase("verify"); setVerifyStep(0)
    const steps = 4
    for (let i = 0; i < steps; i++) later(() => setVerifyStep(i + 1), 460 * (i + 1))
    later(() => resolveNight(assassinTarget, guardianProtects, yourClue), 460 * (steps + 1) + 300)
  }

  const resolveNight = (assassinTarget: number | null, protects: Set<number>, yourClue: string) => {
    setPhase("resolve")
    let event = "The night passed quietly. No one was harmed."
    let next = [...players]
    if (assassinTarget != null) {
      const target = players[assassinTarget]
      if (protects.has(assassinTarget)) {
        event = `${target.name} was attacked in the night — but a Guardian shielded them. No one was lost.`
      } else {
        next = next.map((p) => (p.id === assassinTarget ? { ...p, alive: false } : p))
        event = `${target.name} was found eliminated. They were the ${ROLE_META[target.role].name}.`
      }
    }
    setPlayers(next); setNightEvent(event)
    logLine(`🌙 Night ${round}: ${event}`)
    if (yourClue) logLine(`🔎 ${yourClue}`)
    const w = checkWinner(next)
    later(() => { if (w) return endGame(w); setPhase("day") }, 1500)
  }

  const beginVote = () => { setExiledId(null); setPhase("vote") }

  const submitVote = (targetId: number) => {
    const counts = new Map<number, number>()
    const bump = (id: number) => counts.set(id, (counts.get(id) ?? 0) + 1)
    bump(targetId)
    players.filter((p) => p.alive && !p.isYou).forEach((p) => {
      const opts = players.filter((o) => o.alive && o.id !== p.id)
      const weighted = p.team === "shadow" ? opts.filter((o) => o.team === "protocol") : opts
      bump(pick(weighted.length ? weighted : opts).id)
    })
    const result = players.filter((p) => p.alive).map((p) => ({ id: p.id, votes: counts.get(p.id) ?? 0 })).sort((a, b) => b.votes - a.votes)
    setTally(result)
    const top = result[0]
    const exiled = pick(result.filter((r) => r.votes === top.votes)).id
    setExiledId(exiled)
    setPhase("tally")
    const next = players.map((p) => (p.id === exiled ? { ...p, alive: false } : p))
    const exiledP = players[exiled]
    logLine(`🗳 Round ${round}: ${exiledP.name} was ejected — the ${ROLE_META[exiledP.role].name}.`)
    later(() => {
      setPlayers(next)
      const w = checkWinner(next)
      if (w) return endGame(w)
      later(() => { setRound((r) => r + 1); beginNight() }, 1400)
    }, 3200)
  }

  const endGame = (w: Team) => { setWinner(w); setPhase("over") }

  const restart = () => {
    clearTimers()
    setPlayers(makePlayers()); setPhase("lobby"); setRound(1); setFeed([]); setNightEvent(""); setClue("")
    setYourNightPick(null); setTally([]); setExiledId(null); setWinner(null); setVerifyStep(0)
  }

  const nightNeedsTarget = you.alive && (you.role === "assassin" || you.role === "guardian" || you.role === "investigator")
  const nightVerb = you.role === "assassin" ? "Eliminate" : you.role === "guardian" ? "Shield" : "Scan"
  const nightTargets = you.role === "guardian" ? alive : aliveOthers
  const exiledP = exiledId != null ? players[exiledId] : null

  const phaseLabel: Record<Phase, string> = {
    lobby: "Lobby", reveal: "Role Assignment", night: "Night · Tasks", verify: "Midnight Verifies",
    resolve: "Dawn", day: "Discussion", vote: "Emergency Meeting", tally: "Ejection", over: "Game Over",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05060c]/97 backdrop-blur-md">
      <Starfield />
      <div className="relative mx-auto min-h-full max-w-3xl px-4 py-6">
        <div className="scanlines relative overflow-hidden rounded-2xl border border-[var(--color-cyan)]/20 glass shadow-2xl neon-border">
          {/* top light sweep */}
          <div className="pointer-events-none absolute top-0 z-10 h-px w-full opacity-70" style={{ background: "linear-gradient(90deg, transparent, var(--color-cyan), transparent)" }} />
          {/* banner */}
          <div className="flex items-center justify-between border-b border-[var(--color-hairline)] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-hairline)] bg-[var(--color-panel)] font-display text-sm">◐</span>
              <span className="font-display text-[13px] font-semibold tracking-[0.14em]">SHADOW PROTOCOL</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {phase !== "lobby" && phase !== "over" && <span>Round {round}</span>}
              <span className="rounded bg-[var(--color-violet)]/15 px-2 py-0.5 text-[var(--color-violet)]">{phaseLabel[phase]}</span>
            </div>
          </div>

          <div key={phase} className="p-6 md:p-8" style={{ animation: "fadeUp 0.5s ease both" }}>
            {/* LOBBY */}
            {phase === "lobby" && (
              <div className="text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Game #A8F92 · Classic · 6 crewmates</div>
                <h2 className="mt-3 font-display text-3xl font-bold">The Skeld awaits</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-muted)]">Roles are dealt in secret — you'll see only your own. Protocol keeps the ship running; the Shadow picks you off one by one.</p>
                <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3 sm:grid-cols-6">
                  {players.map((p, i) => (
                    <div key={p.id} className="flex flex-col items-center gap-1" style={{ animation: `popIn 0.5s ease ${i * 0.09}s both` }}>
                      <Crewmate hue={p.hue} size={54} floating delay={i * 0.3} />
                      <span className="font-display text-[12px] font-medium">{p.name}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-signal)]">Ready ✓</span>
                    </div>
                  ))}
                </div>
                <button onClick={startMatch} className="mt-9 rounded-md bg-[var(--color-violet)] px-8 py-3 font-display text-[14px] font-semibold tracking-wide text-[#0b0713] transition hover:brightness-110">Start Match →</button>
              </div>
            )}

            {/* REVEAL */}
            {phase === "reveal" && (
              <div className="text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">For your eyes only · ⊘ private</div>
                <div className="scanlines relative mx-auto mt-6 w-full max-w-sm overflow-hidden rounded-2xl border-2 p-8" style={{ borderColor: ROLE_META[you.role].color, animation: "popIn 0.6s ease both", boxShadow: `0 0 40px -10px ${ROLE_META[you.role].color}` }}>
                  <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(300px circle at 50% 0%, ${ROLE_META[you.role].color}, transparent 70%)` }} />
                  {/* rotating aura */}
                  <div className="pointer-events-none absolute -inset-10 opacity-20" style={{ background: `conic-gradient(from 0deg, transparent, ${ROLE_META[you.role].color}, transparent 40%)`, animation: "ray-rotate 8s linear infinite" }} />
                  <div className="relative flex flex-col items-center">
                    <Crewmate hue={you.hue} size={90} floating />
                    <div className="mt-4 text-3xl" style={{ animation: "count-pop 0.5s ease 0.4s both" }}>{ROLE_META[you.role].glyph}</div>
                    <div className="mt-1 font-display text-3xl font-bold text-glow" style={{ color: ROLE_META[you.role].color }}>{ROLE_META[you.role].name}</div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: TEAM_COLOR[you.team] }}>Team · {you.team === "shadow" ? "Shadow" : "Protocol"}</div>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">{ROLE_META[you.role].blurb}</p>
                  </div>
                </div>
                <button onClick={beginNight} className="mt-8 rounded-md bg-[var(--color-violet)] px-8 py-3 font-display text-[14px] font-semibold tracking-wide text-[#0b0713] transition hover:brightness-110">Lights out 🌙</button>
              </div>
            )}

            {/* NIGHT */}
            {phase === "night" && (
              <div>
                {miniOpen ? (
                  <SignalLock accent={ROLE_META[you.role].color} verb={nightNeedsTarget ? nightVerb : "run tasks"} onDone={finishMini} />
                ) : (
                  <>
                    <div className="text-center">
                      <div className="mx-auto text-4xl" style={{ width: "fit-content", animation: "moon-glow 4s ease-in-out infinite" }}>🌙</div>
                      <h2 className="mt-2 font-display text-2xl font-bold">Night {round}</h2>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {nightNeedsTarget ? `Choose a crewmate to ${nightVerb.toLowerCase()}, then calibrate to seal it.` : you.alive ? "You have no night power — head to the station and run your tasks." : "You're a ghost now — watch the night unfold."}
                      </p>
                    </div>
                    {nightNeedsTarget && (
                      <>
                        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
                          {nightTargets.map((p, i) => (
                            <div key={p.id} style={{ animation: `popIn 0.4s ease ${i * 0.06}s both` }}>
                              <CrewCard p={p} selected={yourNightPick === p.id} onClick={() => setYourNightPick(p.id)} badge={yourNightPick === p.id ? nightVerb : undefined} badgeColor={ROLE_META[you.role].color} />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 text-center">
                          <button disabled={yourNightPick == null} onClick={() => openMini(yourNightPick)} className="rounded-md px-8 py-3 font-display text-[14px] font-semibold tracking-wide text-[#08070d] transition enabled:hover:brightness-110 disabled:opacity-40" style={{ background: "linear-gradient(120deg, var(--color-cyan), var(--color-violet))", boxShadow: "0 0 24px -8px var(--color-cyan)" }}>Calibrate & Commit 🔒</button>
                        </div>
                      </>
                    )}
                    {!nightNeedsTarget && you.alive && (
                      <div className="mt-6 text-center">
                        <button onClick={() => openMini(null)} className="rounded-md px-6 py-3 font-display text-[14px] font-semibold tracking-wide text-[#08070d] transition hover:brightness-110" style={{ background: "linear-gradient(120deg, var(--color-cyan), var(--color-violet))", boxShadow: "0 0 24px -8px var(--color-cyan)" }}>Go to Station →</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* VERIFY */}
            {phase === "verify" && (
              <div className="mx-auto max-w-md text-center">
                <div className="relative mx-auto grid h-20 w-20 place-items-center">
                  <span className="absolute inset-0 rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--color-cyan)", borderRightColor: "var(--color-violet)", animation: "spin-slow 1.4s linear infinite" }} />
                  <span className="absolute inset-2 rounded-full border border-transparent" style={{ borderBottomColor: "var(--color-magenta)", animation: "spin-slow 2.2s linear infinite reverse" }} />
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-panel-2)] text-xl text-[var(--color-cyan)] text-glow" style={{ animation: "pulse-ring 2.6s infinite" }}>◐</span>
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold">Midnight is verifying…</h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Actions are checked for legitimacy without revealing who did what.</p>
                <div className="mt-6 space-y-2 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-void)] p-5 text-left font-mono text-[13px]">
                  {["is_active(actor) → true", "has_role(action) → ✓", "unused_this_round → ✓", "commit(action) → sealed"].map((l, i) => (
                    <div key={i} className={"flex gap-3 transition " + (i < verifyStep ? "opacity-100" : "opacity-25")}>
                      <span className="text-[var(--color-violet-dim)]">›</span><span className="text-[var(--color-signal)]">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESOLVE */}
            {phase === "resolve" && (
              <div className="mx-auto max-w-md text-center">
                <div className="text-4xl">⚔️</div>
                <h2 className="mt-3 font-display text-xl font-semibold">Dawn breaks</h2>
                <p className="mt-4 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)]/60 p-5 text-[15px] leading-relaxed text-[var(--color-ink)]">{nightEvent}</p>
                {clue && <p className="mt-3 rounded-lg border border-dashed border-[var(--color-violet)]/40 bg-[var(--color-violet)]/10 p-3 font-mono text-[12px] text-[var(--color-violet)]">🔎 {clue}</p>}
              </div>
            )}

            {/* DAY */}
            {phase === "day" && (
              <div>
                <div className="text-center">
                  <div className="relative mx-auto grid h-14 w-14 place-items-center">
                    <span className="absolute inset-0" style={{ animation: "ray-rotate 12s linear infinite", background: "conic-gradient(from 0deg, transparent 0 8%, color-mix(in oklab, var(--color-gold) 55%, transparent) 9% 11%, transparent 12% 20%, color-mix(in oklab, var(--color-gold) 55%, transparent) 21% 23%, transparent 24% 33%, color-mix(in oklab, var(--color-gold) 55%, transparent) 34% 36%, transparent 37%)", borderRadius: "9999px", maskImage: "radial-gradient(circle, transparent 40%, black 42%)" }} />
                    <span className="relative text-3xl">☀️</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold">Day {round}</h2>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{nightEvent}</p>
                </div>
                <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)]/40 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Crew chatter</div>
                  <div className="mt-3 space-y-3 text-sm">
                    {aliveOthers.slice(0, 3).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-2" style={{ animation: `rise-in 0.5s ease ${0.3 + i * 0.5}s both` }}>
                        <Crewmate hue={p.hue} size={28} delay={i * 0.4} />
                        <span className="text-[var(--color-muted)]"><span className="font-display font-medium text-[var(--color-ink)]">{p.name}:</span> {["“Where was everyone during the night?”", "“I don't trust the quiet ones.”", "“If someone scanned a Shadow, speak up.”"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {clue && <p className="mt-3 rounded-lg border border-dashed border-[var(--color-violet)]/40 bg-[var(--color-violet)]/10 p-3 font-mono text-[12px] text-[var(--color-violet)]">🔎 {clue}</p>}
                <div className="mt-6 text-center">
                  <button onClick={beginVote} className="rounded-md px-8 py-3 font-display text-[14px] font-bold tracking-wide text-white transition hover:brightness-110" style={{ background: "var(--color-danger)", animation: "emergency 1.6s ease-in-out infinite" }}>⚠ Emergency Meeting</button>
                </div>
              </div>
            )}

            {/* VOTE */}
            {phase === "vote" && (
              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 -z-0" style={{ background: "radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--color-danger) 35%, transparent), transparent 60%)", animation: "alarm 1.4s ease-in-out infinite" }} />
                <div className="relative text-center">
                  <div className="text-3xl" style={{ animation: "shake 0.9s ease-in-out infinite" }}>⚠️</div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-glow" style={{ color: "var(--color-danger)" }}>Emergency Meeting</h2>
                  <p className="mt-1 font-display text-lg">Who's the Shadow?</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">Your ballot is sealed until the meeting closes. {you.alive ? "Tap a crewmate to vote." : "Ghosts can't vote."}</p>
                </div>
                <div className="relative mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
                  {alive.filter((p) => !p.isYou || !you.alive).map((p, i) => (
                    <div key={p.id} style={{ animation: `popIn 0.4s ease ${i * 0.06}s both` }}>
                      <CrewCard p={p} disabled={!you.alive} onClick={() => submitVote(p.id)} badge="Eject" badgeColor="var(--color-danger)" />
                    </div>
                  ))}
                </div>
                {!you.alive && (
                  <div className="mt-5 text-center">
                    <button onClick={() => submitVote(pick(aliveOthers).id)} className="rounded-md border border-[var(--color-hairline)] px-6 py-3 font-display text-[13px] font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-ink)]">Watch the vote →</button>
                  </div>
                )}
              </div>
            )}

            {/* TALLY / EJECTION */}
            {phase === "tally" && exiledP && (
              <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-[var(--color-hairline)] bg-[#05060c]">
                <Starfield />
                <div className="absolute top-1/2 -translate-y-1/2" style={{ animation: "eject 3s ease-in forwards" }}>
                  <Crewmate hue={exiledP.hue} size={72} />
                </div>
                <div className="relative flex min-h-[340px] flex-col items-center justify-end p-6 text-center">
                  <div className="mb-2 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--color-muted)]">
                    {tally.map((t) => (<span key={t.id}>{players[t.id].name}: <span className="text-[var(--color-ink)]">{t.votes}</span></span>))}
                  </div>
                  <p className="font-display text-2xl font-bold text-white" style={{ animation: "fadeUp 0.5s ease 1.6s both" }}>{exiledP.name} was ejected.</p>
                  <p className="mt-1 font-display text-lg text-glow" style={{ color: ROLE_META[exiledP.role].color, animation: "count-pop 0.5s ease 2.1s both" }}>
                    {exiledP.name} was the {ROLE_META[exiledP.role].name} {ROLE_META[exiledP.role].glyph}
                  </p>
                </div>
              </div>
            )}

            {/* OVER */}
            {phase === "over" && winner && (
              <div className="text-center">
                <div className="mx-auto mb-2 w-fit" style={{ animation: "popIn 0.6s ease both" }}><Crewmate hue={winner === "shadow" ? "#e0392b" : "#33ddd0"} size={80} floating /></div>
                <h2 className="mt-2 font-display text-4xl font-bold text-glow" style={{ color: TEAM_COLOR[winner], animation: "count-pop 0.6s ease 0.2s both" }}>{winner === "protocol" ? "PROTOCOL WINS" : "SHADOW WINS"} 🏆</h2>
                <p className="mt-3 text-sm text-[var(--color-muted)]">{winner === "protocol" ? "Every Assassin has been ejected. The ship is safe." : "The Shadow seized control of the crew."}</p>
                <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-display text-sm font-semibold" style={{ background: you.team === winner ? "color-mix(in oklab, var(--color-signal) 14%, transparent)" : "var(--color-midnight)", color: you.team === winner ? "var(--color-signal)" : "var(--color-muted)" }}>
                  {you.team === winner ? "Victory · +250 XP · +40 Reputation" : `You played the ${ROLE_META[you.role].name} · +80 XP`}
                </div>
                <div className="mx-auto mt-8 max-w-md rounded-xl border border-[var(--color-hairline)] bg-[var(--color-midnight)]/50 p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">Crew revealed</div>
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {players.map((p, i) => (
                      <div key={p.id} className="flex flex-col items-center gap-1" style={{ animation: `popIn 0.4s ease ${0.4 + i * 0.08}s both` }}>
                        <Crewmate hue={p.hue} size={40} dead={!p.alive} delay={i * 0.3} />
                        <span className={"font-display text-[11px] " + (p.alive ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] line-through")}>{p.name}</span>
                        <span className="font-mono text-[9px] uppercase" style={{ color: TEAM_COLOR[p.team] }}>{ROLE_META[p.role].name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex justify-center gap-3">
                  <button onClick={restart} className="rounded-md bg-[var(--color-violet)] px-7 py-3 font-display text-[14px] font-semibold tracking-wide text-[#0b0713] transition hover:brightness-110">Play Again</button>
                  <button onClick={onExit} className="rounded-md border border-[var(--color-hairline)] px-7 py-3 font-display text-[14px] font-semibold transition hover:border-[var(--color-violet)]">Exit to Site</button>
                </div>
              </div>
            )}
          </div>

          {/* footer: crew status + feed */}
          {phase !== "over" && (
            <div className="border-t border-[var(--color-hairline)] px-6 py-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">Alive {alive.length}/6</span>
                {players.map((p) => (
                  <span key={p.id} className="flex items-center gap-1">
                    <Crewmate hue={p.hue} size={18} dead={!p.alive} />
                    <span className={"font-display text-[11px] " + (p.alive ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] line-through")}>{p.name}</span>
                  </span>
                ))}
                <button onClick={onExit} className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)] transition hover:text-[var(--color-danger)]">Leave ✕</button>
              </div>
              {feed.length > 0 && (
                <div className="mt-3 max-h-20 space-y-1 overflow-y-auto text-[12px] text-[var(--color-muted)]">
                  {feed.map((f, i) => (<div key={i}>{f}</div>))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
