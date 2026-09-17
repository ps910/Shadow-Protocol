import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BlacksiteFacility, RoomZone } from './world/BlacksiteFacility';
import { AvatarController, MovementInput } from './player/AvatarController';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera';
import { InteractiveTerminals, TerminalData } from './tasks/InteractiveTerminals';
import { CryptographicVFX } from './vfx/CryptographicVFX';

interface Shadow3DSceneProps {
  onExit?: () => void;
  playerRole?: 'assassin' | 'guardian' | 'investigator' | 'civilian';
  playerName?: string;
}

const ROLE_COLORS: Record<string, number> = {
  assassin: 0xe0392b,
  guardian: 0x33ddd0,
  investigator: 0x9d4edd,
  civilian: 0xf59e0b,
};

export const Shadow3DScene: React.FC<Shadow3DSceneProps> = ({
  onExit,
  playerRole = 'guardian',
  playerName = 'Alice',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const facilityRef = useRef<BlacksiteFacility | null>(null);
  const avatarRef = useRef<AvatarController | null>(null);
  const cameraSysRef = useRef<ThirdPersonCamera | null>(null);
  const terminalsRef = useRef<InteractiveTerminals | null>(null);
  const vfxRef = useRef<CryptographicVFX | null>(null);

  // UI state
  const [currentRoom, setCurrentRoom] = useState<string>('Central Hub');
  const [nearbyTerminal, setNearbyTerminal] = useState<TerminalData | null>(null);
  const [activeTask, setActiveTask] = useState<TerminalData | null>(null);
  const [taskSolved, setTaskSolved] = useState(false);
  const [isSabotageAlarm, setIsSabotageAlarm] = useState(false);
  const [fps, setFps] = useState(60);
  const [cipherInput, setCipherInput] = useState<number[]>([4, 2, 7]);

  // Movement input tracking
  const inputRef = useRef<MovementInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  const isMouseDownRef = useRef(false);

  // Initialize Three.js WebGL Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const cameraSys = new ThirdPersonCamera(60, width / height);
    cameraSysRef.current = cameraSys;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. World Facility
    const facility = new BlacksiteFacility();
    facilityRef.current = facility;
    scene.add(facility.group);

    // 5. Player Avatar
    const roleColor = ROLE_COLORS[playerRole] || 0x33ddd0;
    const avatar = new AvatarController(roleColor);
    avatarRef.current = avatar;
    scene.add(avatar.mesh);

    // 6. Interactive Terminals
    const terminals = new InteractiveTerminals();
    terminalsRef.current = terminals;
    scene.add(terminals.group);

    // 7. Cryptographic VFX
    const vfx = new CryptographicVFX();
    vfxRef.current = vfx;
    scene.add(vfx.group);

    // 8. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // FPS tracking
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Update Facility (plasma rotation, alarms)
      facility.update(now / 1000, isSabotageAlarm);

      // Update Player
      avatar.update(delta, inputRef.current, cameraSys.yaw);

      // Update Room presence
      const room = facility.getRoomAt(avatar.position.x, avatar.position.z);
      setCurrentRoom(room.name);

      // Update Terminals proximity
      const near = terminals.update(now / 1000, avatar.position);
      setNearbyTerminal(near);

      // Update Camera follow
      cameraSys.update(delta, avatar.position, inputRef.current.sprint, activeTask !== null);

      // Update VFX
      vfx.update(delta);

      renderer.render(scene, cameraSys.camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraSysRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraSysRef.current.resize(w, h);
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [playerRole, isSabotageAlarm, activeTask]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = true;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = true;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = true;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = true;
      if (e.shiftKey) inputRef.current.sprint = true;

      // Interact key [E]
      if (key === 'e' && nearbyTerminal && !activeTask) {
        setActiveTask(nearbyTerminal);
        setTaskSolved(false);
        if (avatarRef.current) avatarRef.current.state = 'TASK';
      }

      // Close modal with Escape
      if (key === 'escape' && activeTask) {
        setActiveTask(null);
        if (avatarRef.current) avatarRef.current.state = 'IDLE';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = false;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = false;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = false;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = false;
      if (!e.shiftKey) inputRef.current.sprint = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyTerminal, activeTask]);

  // Mouse camera orbit
  const handleMouseDown = () => {
    isMouseDownRef.current = true;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current && cameraSysRef.current) {
      cameraSysRef.current.onMouseMove(e.movementX, e.movementY);
    }
  };

  // Trigger Zero-Knowledge Proof Swirl VFX
  const triggerCryptographicProof = useCallback(() => {
    if (avatarRef.current && vfxRef.current) {
      vfxRef.current.triggerProofVFX(avatarRef.current.position);
    }
  }, []);

  const handleSolveTask = () => {
    setTaskSolved(true);
    triggerCryptographicProof();
    setTimeout(() => {
      setActiveTask(null);
      if (avatarRef.current) avatarRef.current.state = 'IDLE';
    }, 1800);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="relative h-screen w-full select-none overflow-hidden bg-black font-body text-white"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Cyberpunk HUD Overlay */}
      {/* Top Header Bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-6">
        {/* Room / Sector Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)] animate-pulse" />
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">BLACKSITE-01 · ORBITAL DECK</div>
            <div className="font-display text-base font-bold text-white">{currentRoom}</div>
          </div>
        </div>

        {/* Player Badge & Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl px-4 py-2 text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted)]">{playerRole.toUpperCase()}</div>
            <div className="font-display text-sm font-semibold text-white">{playerName}</div>
          </div>

          <div className="rounded-2xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/10 backdrop-blur-xl px-3 py-2 font-mono text-xs text-[var(--color-cyan)]">
            {fps} FPS
          </div>

          {/* Alarm Toggle Button (for testing emergency lighting) */}
          <button
            onClick={() => setIsSabotageAlarm(!isSabotageAlarm)}
            className={`pointer-events-auto rounded-xl border px-3 py-2 font-mono text-xs transition ${
              isSabotageAlarm
                ? 'border-red-500 bg-red-950/80 text-red-400 animate-pulse'
                : 'border-white/10 bg-black/60 text-white/70 hover:border-white/30'
            }`}
            title="Toggle Station Emergency Alarm"
          >
            {isSabotageAlarm ? '🚨 ALARM ACTIVE' : '⚠️ TEST ALARM'}
          </button>

          {/* Exit 3D View Button */}
          {onExit && (
            <button
              onClick={onExit}
              className="pointer-events-auto rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 font-mono text-xs transition"
              title="Return to Main Menu"
            >
              ✕ Exit 3D
            </button>
          )}
        </div>
      </div>

      {/* Proximity Interaction Prompt */}
      {nearbyTerminal && !activeTask && (
        <div className="pointer-events-none absolute inset-x-0 bottom-32 flex justify-center">
          <div className="pointer-events-auto animate-bounce flex items-center gap-3 rounded-2xl border border-[var(--color-cyan)] bg-black/80 backdrop-blur-xl px-6 py-3 shadow-[0_0_30px_rgba(51,221,208,0.4)]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-cyan)] font-mono text-xs font-black text-black">
              E
            </span>
            <div className="font-display text-sm font-bold text-white">
              ACCESS {nearbyTerminal.name.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Cheatsheet & ZK Proof Simulator Trigger */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
        {/* Navigation Controls Dock */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-3 text-[11px] font-mono text-[var(--color-muted)]">
          <span className="rounded bg-white/10 px-2 py-0.5 text-white font-semibold">WASD</span>
          <span>Move</span>
          <span className="mx-1 opacity-40">|</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white font-semibold">SHIFT</span>
          <span>Sprint</span>
          <span className="mx-1 opacity-40">|</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white font-semibold">DRAG MOUSE</span>
          <span>Orbit Camera</span>
        </div>

        {/* Trigger ZK Cryptographic Proof Vortex */}
        <button
          onClick={triggerCryptographicProof}
          className="pointer-events-auto group relative overflow-hidden rounded-2xl px-5 py-3 font-display text-xs font-bold uppercase tracking-wider text-[#080b18] transition hover:brightness-110 shadow-lg shadow-[var(--color-cyan)]/30"
          style={{
            background: 'linear-gradient(135deg, var(--color-cyan), var(--color-violet))',
          }}
        >
          <span className="relative flex items-center gap-2">
            <span>⚡ Emit ZK Proof Swirl</span>
            <span className="font-mono text-[10px] opacity-80">(Visual Cryptography)</span>
          </span>
        </button>
      </div>

      {/* In-World 3D Interactive Task Modal */}
      {activeTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="cyber-card hud-bracket w-full max-w-lg rounded-3xl p-8 border border-[var(--color-cyan)]/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔐</span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-cyan)]">BLACKSITE TERMINAL INTERFACE</div>
                  <h3 className="font-display text-xl font-bold text-white">{activeTask.name}</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTask(null);
                  if (avatarRef.current) avatarRef.current.state = 'IDLE';
                }}
                className="rounded-lg p-1.5 text-[var(--color-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Task Interactive Body */}
            <div className="mt-6 text-center">
              {activeTask.type === 'CIPHER' ? (
                <div className="space-y-6">
                  <p className="text-sm text-[var(--color-muted)]">
                    Rotate the cryptographic cipher wheels to align the Midnight decryption hash:
                  </p>
                  <div className="flex justify-center gap-4">
                    {cipherInput.map((val, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const next = [...cipherInput];
                          next[idx] = (next[idx] + 1) % 10;
                          setCipherInput(next);
                        }}
                        className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[var(--color-cyan)] bg-[var(--color-midnight)] font-mono text-2xl font-black text-[var(--color-cyan)] shadow-[0_0_15px_rgba(51,221,208,0.3)] transition hover:scale-105"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="font-mono text-xs text-[var(--color-muted)]">
                    Target Hash Alignment: <span className="text-white">0x7F4A...B912</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-[var(--color-muted)]">
                    Calibrate the terminal nodes to stabilize local sector throughput and submit a zero-knowledge alibi receipt.
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-left space-y-1 text-[var(--color-cyan)]">
                    <div>{'>'} System: {activeTask.name}</div>
                    <div>{'>'} Sector: {activeTask.roomId}</div>
                    <div>{'>'} Witness: [SEALED LOCAL STATE]</div>
                    <div>{'>'} Nullifier: Ready for generation</div>
                  </div>
                </div>
              )}

              {/* Status or Success */}
              {taskSolved ? (
                <div className="mt-6 rounded-2xl border border-[var(--color-signal)]/40 bg-[var(--color-signal)]/10 p-4 font-display text-sm font-bold text-[var(--color-signal)] animate-pulse">
                  ✓ TASK COMPLETED · MIDNIGHT ZK PROOF DISPATCHED!
                </div>
              ) : (
                <button
                  onClick={handleSolveTask}
                  className="mt-8 w-full rounded-2xl py-3.5 font-display text-sm font-bold uppercase tracking-wider text-black transition hover:brightness-110 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-cyan), var(--color-signal))',
                  }}
                >
                  ⚡ Complete Task & Commit ZK Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
