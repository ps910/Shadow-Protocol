import { useState, useEffect } from 'react';
import type { GameState, Player, DeadBody } from '../game/gameEngine';
import {
  RoomId,
  AEGIS_STATION_ROOMS,
  ALL_ROOM_IDS,
  canMoveBetween
} from '../game/stationMap';
import type { PlayerTask } from '../game/tasks';
import { isEvil, Role } from '../game/roles';

interface AegisStationViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onMovePlayer: (targetRoom: RoomId) => void;
  onOpenTask: (task: PlayerTask) => void;
  onTriggerSabotage: (type: 'reactor' | 'comms') => void;
  onResolveSabotage: () => void;
  onEliminate: (targetId: string) => void;
  onReportBody: () => void;
  onCallEmergency: () => void;
}

export function AegisStationView({
  gameState,
  currentPlayer,
  onMovePlayer,
  onOpenTask,
  onTriggerSabotage,
  onResolveSabotage,
  onEliminate,
  onReportBody,
  onCallEmergency,
}: AegisStationViewProps) {
  const currentRoomDef = AEGIS_STATION_ROOMS[currentPlayer.currentRoom];
  const isShadow = isEvil(currentPlayer.role || Role.Civilian);

  // Find players in the same room
  const playersInSameRoom = gameState.players.filter(
    p => p.isAlive && p.currentRoom === currentPlayer.currentRoom && p.id !== currentPlayer.id
  );

  // Find dead bodies in the same room
  const deadBodyInSameRoom = gameState.deadBodies.find(
    b => b.roomId === currentPlayer.currentRoom && !b.reported
  );

  // Find available task in this room for current player
  const taskInCurrentRoom = currentPlayer.tasks.find(
    t => t.roomId === currentPlayer.currentRoom && !t.isCompleted
  );

  // Sabotage active and in required room
  const canStabilizeSabotage =
    gameState.activeSabotage &&
    gameState.activeSabotage.requiredRoom === currentPlayer.currentRoom;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* ─── GLOBAL STATION STATUS BAR ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md) var(--space-xl)',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Task Progress Bar */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: 'var(--space-xs)' }}>
            <span style={{ color: 'var(--protocol-cyan)', fontWeight: 600 }}>PROTOCOL TASK COMPLETION</span>
            <span style={{ color: 'var(--protocol)', fontWeight: 700 }}>
              {gameState.taskProgress.completed} / {gameState.taskProgress.total} ({gameState.taskProgress.percentage}%)
            </span>
          </div>
          <div style={{
            height: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: `${gameState.taskProgress.percentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--protocol), var(--protocol-cyan))',
              boxShadow: '0 0 10px var(--protocol-glow)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>

        {/* Current Location Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: '1.5rem' }}>{currentRoomDef.icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              CURRENT SECTOR
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: currentRoomDef.color }}>
              {currentRoomDef.name}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE SABOTAGE EMERGENCY BANNER ─── */}
      {gameState.activeSabotage && (
        <div className="animate-slide-up" style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--shadow)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md) var(--space-xl)',
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 0 25px var(--shadow-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--shadow-light)' }}>
                {gameState.activeSabotage.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                {gameState.activeSabotage.description}
              </div>
            </div>
          </div>
          {canStabilizeSabotage ? (
            <button className="btn btn-primary" onClick={onResolveSabotage} style={{ background: 'var(--shadow)', borderColor: 'var(--shadow)' }}>
              ⚡ Defuse in {currentRoomDef.name}
            </button>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--shadow)', fontWeight: 700 }}>
              RUSH TO {gameState.activeSabotage.requiredRoom.toUpperCase()}!
            </span>
          )}
        </div>
      )}

      {/* ─── MAIN STATION INTERACTIVE VIEWPORT ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 'var(--space-lg)'
      }}>
        {/* Left: Interactive Aegis Station Blueprint Map */}
        <div className="station-schematic-wrapper">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', position: 'relative', zIndex: 3 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="network-beacon-dot" />
                <span className="section-tag tag-purple" style={{ marginBottom: 0 }}>
                  AEGIS STATION HOLOGRAPHIC SCHEMATIC · SECTOR ORBIT 7
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Tactical Sector Grid
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                color: 'var(--protocol-cyan)',
                background: 'rgba(6, 182, 212, 0.08)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(6, 182, 212, 0.25)'
              }}>
                ZK TELEMETRY STREAMING
              </span>
            </div>
          </div>

          {/* 2D Schematic Compartment Grid with SVG Conduit Layer */}
          <div style={{ position: 'relative' }}>
            {/* SVG Corridors Overlay */}
            <svg className="conduit-svg-layer" viewBox="0 0 600 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="conduitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Command (top center: 300, 60) to Hub (middle center: 300, 200) */}
              <line x1="300" y1="80" x2="300" y2="160" className={`conduit-line ${currentPlayer.currentRoom === 'command' || currentPlayer.currentRoom === 'hub' ? 'active' : ''}`} />

              {/* Engine (middle left: 100, 200) to Hub (middle center: 300, 200) */}
              <line x1="170" y1="200" x2="230" y2="200" className={`conduit-line ${currentPlayer.currentRoom === 'engine' || currentPlayer.currentRoom === 'hub' ? 'active' : ''}`} />

              {/* Hub (middle center: 300, 200) to Security (middle right: 500, 200) */}
              <line x1="370" y1="200" x2="430" y2="200" className={`conduit-line ${currentPlayer.currentRoom === 'hub' || currentPlayer.currentRoom === 'security' ? 'active' : ''}`} />

              {/* Engine (middle left: 100, 200) to Reactor (bottom left: 100, 320) */}
              <line x1="100" y1="240" x2="100" y2="280" className={`conduit-line ${currentPlayer.currentRoom === 'engine' || currentPlayer.currentRoom === 'reactor' ? 'active' : ''}`} />

              {/* Hub (middle center: 300, 200) to Lab (bottom center: 300, 320) */}
              <line x1="300" y1="240" x2="300" y2="280" className={`conduit-line ${currentPlayer.currentRoom === 'hub' || currentPlayer.currentRoom === 'lab' ? 'active' : ''}`} />

              {/* Security (middle right: 500, 200) to Comms (bottom right: 500, 320) */}
              <line x1="500" y1="240" x2="500" y2="280" className={`conduit-line ${currentPlayer.currentRoom === 'security' || currentPlayer.currentRoom === 'comms' ? 'active' : ''}`} />

              {/* Reactor (bottom left: 100, 320) to Lab (bottom center: 300, 320) */}
              <line x1="170" y1="320" x2="230" y2="320" className={`conduit-line ${currentPlayer.currentRoom === 'reactor' || currentPlayer.currentRoom === 'lab' ? 'active' : ''}`} />

              {/* Lab (bottom center: 300, 320) to Comms (bottom right: 500, 320) */}
              <line x1="370" y1="320" x2="430" y2="320" className={`conduit-line ${currentPlayer.currentRoom === 'lab' || currentPlayer.currentRoom === 'comms' ? 'active' : ''}`} />
            </svg>

            {/* Compartment Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'auto auto auto',
              gap: 'var(--space-md)',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Row 1: Command Center (Centered) */}
              <div style={{ gridColumn: '2 / 3', display: 'flex', justifyContent: 'center' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['command']}
                  isCurrent={currentPlayer.currentRoom === 'command'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'command')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'command')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'command' && !b.reported)}
                  onClick={() => onMovePlayer('command')}
                />
              </div>

              {/* Row 2: Engine, Hub, Security */}
              <div style={{ gridColumn: '1 / 2' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['engine']}
                  isCurrent={currentPlayer.currentRoom === 'engine'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'engine')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'engine')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'engine' && !b.reported)}
                  onClick={() => onMovePlayer('engine')}
                />
              </div>
              <div style={{ gridColumn: '2 / 3' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['hub']}
                  isCurrent={currentPlayer.currentRoom === 'hub'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'hub')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'hub')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'hub' && !b.reported)}
                  onClick={() => onMovePlayer('hub')}
                />
              </div>
              <div style={{ gridColumn: '3 / 4' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['security']}
                  isCurrent={currentPlayer.currentRoom === 'security'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'security')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'security')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'security' && !b.reported)}
                  onClick={() => onMovePlayer('security')}
                />
              </div>

              {/* Row 3: Reactor, Lab, Comms */}
              <div style={{ gridColumn: '1 / 2' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['reactor']}
                  isCurrent={currentPlayer.currentRoom === 'reactor'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'reactor')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'reactor')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'reactor' && !b.reported)}
                  onClick={() => onMovePlayer('reactor')}
                />
              </div>
              <div style={{ gridColumn: '2 / 3' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['lab']}
                  isCurrent={currentPlayer.currentRoom === 'lab'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'lab')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'lab')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'lab' && !b.reported)}
                  onClick={() => onMovePlayer('lab')}
                />
              </div>
              <div style={{ gridColumn: '3 / 4' }}>
                <RoomCard
                  room={AEGIS_STATION_ROOMS['comms']}
                  isCurrent={currentPlayer.currentRoom === 'comms'}
                  canMove={canMoveBetween(currentPlayer.currentRoom, 'comms')}
                  players={gameState.players.filter(p => p.isAlive && p.currentRoom === 'comms')}
                  deadBodies={gameState.deadBodies.filter(b => b.roomId === 'comms' && !b.reported)}
                  onClick={() => onMovePlayer('comms')}
                />
              </div>
            </div>
          </div>

          {/* Bottom Room Interaction Console */}
          <div style={{
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-md) var(--space-lg)',
            background: 'rgba(5, 8, 17, 0.7)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--protocol-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                TERMINAL:
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {currentRoomDef.terminalName}
              </span>
            </div>

            {/* Contextual Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {/* Task Completion */}
              {taskInCurrentRoom && (
                <button className="btn btn-primary" onClick={() => onOpenTask(taskInCurrentRoom)}>
                  ⚡ Complete Task: {taskInCurrentRoom.name}
                </button>
              )}

              {/* Stabilize Sabotage */}
              {canStabilizeSabotage && (
                <button className="btn btn-primary" onClick={onResolveSabotage} style={{ background: 'var(--shadow)', borderColor: 'var(--shadow)' }}>
                  🛡️ Stabilize {currentRoomDef.name}
                </button>
              )}

              {/* Report Body */}
              {deadBodyInSameRoom && (
                <button className="btn btn-danger btn-lg" onClick={onReportBody} style={{ background: 'var(--shadow)', color: '#fff', fontWeight: 700 }}>
                  🚨 REPORT DEAD BODY ({deadBodyInSameRoom.victimName})
                </button>
              )}

              {/* Command Center Emergency Button */}
              {currentRoomDef.hasEmergencyButton && (
                <button className="btn btn-secondary" onClick={onCallEmergency}>
                  🚨 Call Emergency Meeting
                </button>
              )}

              {/* Assassin Elimination Action */}
              {currentPlayer.role === Role.Assassin && playersInSameRoom.length > 0 && (
                playersInSameRoom.map(target => (
                  <button
                    key={target.id}
                    className="btn btn-danger"
                    onClick={() => onEliminate(target.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'var(--shadow)', color: 'var(--shadow-light)' }}
                  >
                    🗡️ Eliminate {target.name}
                  </button>
                ))
              )}

              {/* Spy Sabotage Actions */}
              {isShadow && !gameState.activeSabotage && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => onTriggerSabotage('reactor')}>
                    ☢️ Sabotage Reactor
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onTriggerSabotage('comms')}>
                    📡 Blackout Comms
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Personal Task Dossier & Sector Intel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Player Identity Card */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '1.75rem' }}>{currentPlayer.avatar}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{currentPlayer.name} (You)</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: isShadow ? 'var(--shadow)' : 'var(--protocol)' }}>
                  {currentPlayer.role} · {isShadow ? 'SHADOW OPERATIVE' : 'PROTOCOL CREW'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {currentPlayer.role === Role.Assassin && 'Stalk lone targets into compartments. Eliminate without being observed.'}
              {currentPlayer.role === Role.Spy && 'Trigger sabotages and mislead investigation with phantom signals.'}
              {currentPlayer.role === Role.Guardian && 'Protect allies and verify cryptographic alibis during meetings.'}
              {currentPlayer.role === Role.Investigator && 'Scan suspect crew members at the Security biometric station.'}
              {currentPlayer.role === Role.Civilian && 'Complete your assigned tasks to advance Protocol completion.'}
            </div>
          </div>

          {/* Assigned Tasks Checklist */}
          <div className="card" style={{ padding: 'var(--space-lg)', flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', letterSpacing: '0.1em' }}>
              YOUR ASSIGNED TASKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentPlayer.tasks.map(t => {
                const isCurrent = t.roomId === currentPlayer.currentRoom;
                return (
                  <div
                    key={t.id}
                    onClick={() => !t.isCompleted && isCurrent && onOpenTask(t)}
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      background: t.isCompleted ? 'rgba(16, 185, 129, 0.08)' : isCurrent ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: t.isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : isCurrent ? '1px solid var(--protocol-cyan)' : '1px solid var(--border)',
                      cursor: !t.isCompleted && isCurrent ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: t.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {t.name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {t.roomId.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div>
                      {t.isCompleted ? (
                        <span style={{ color: 'var(--protocol)', fontWeight: 700, fontSize: '0.75rem' }}>✓ DONE</span>
                      ) : isCurrent ? (
                        <span style={{ color: 'var(--protocol-cyan)', fontWeight: 700, fontSize: '0.75rem' }}>OPEN ➔</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>GO TO ROOM</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Room Compartment Card Subcomponent ──────────────────────────────
interface RoomCardProps {
  room: typeof AEGIS_STATION_ROOMS[RoomId];
  isCurrent: boolean;
  canMove: boolean;
  players: Player[];
  deadBodies: DeadBody[];
  onClick: () => void;
}

function RoomCard({ room, isCurrent, canMove, players, deadBodies, onClick }: RoomCardProps) {
  const hasDeadBody = deadBodies.length > 0;

  return (
    <div
      onClick={canMove ? onClick : undefined}
      className="room-card-enhanced"
      style={{
        width: '100%',
        minHeight: '120px',
        padding: 'var(--space-md)',
        background: isCurrent
          ? `${room.color}22`
          : canMove
          ? 'rgba(15, 20, 36, 0.8)'
          : 'rgba(10, 14, 26, 0.5)',
        border: isCurrent
          ? `2px solid ${room.color}`
          : hasDeadBody
          ? '2px dashed var(--shadow)'
          : canMove
          ? '1px solid rgba(6, 182, 212, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-lg)',
        cursor: canMove && !isCurrent ? 'pointer' : 'default',
        boxShadow: isCurrent 
          ? `0 0 25px ${room.color}44, 0 0 10px ${room.color}22 inset` 
          : canMove 
          ? '0 4px 15px rgba(0, 0, 0, 0.4)' 
          : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Corner Reticles */}
      <div style={{ position: 'absolute', top: 4, left: 4, width: 6, height: 6, borderTop: `1px solid ${room.color}`, borderLeft: `1px solid ${room.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderTop: `1px solid ${room.color}`, borderRight: `1px solid ${room.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 4, left: 4, width: 6, height: 6, borderBottom: `1px solid ${room.color}`, borderLeft: `1px solid ${room.color}`, opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 6, height: 6, borderBottom: `1px solid ${room.color}`, borderRight: `1px solid ${room.color}`, opacity: 0.6 }} />

      {/* Top row: icon, code, status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span style={{ fontSize: '1.25rem' }}>{room.icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: room.color, fontWeight: 700, letterSpacing: '0.08em' }}>
            [{room.code}]
          </span>
        </div>
        {isCurrent ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="radar-blip-ring" />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              background: room.color,
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              AGENT HERE
            </span>
          </div>
        ) : canMove ? (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: 'var(--protocol-cyan)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700
          }}>
            TRANSLOCATE ➔
          </span>
        ) : null}
      </div>

      {/* Room Name */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: '0.25rem 0' }}>
        {room.name}
      </div>

      {/* Occupants or Alerts */}
      <div>
        {hasDeadBody && (
          <div style={{ 
            color: 'var(--shadow)', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.75rem', 
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--shadow)'
          }}>
            ☠️ CASUALTY DISCOVERED!
          </div>
        )}
        {players.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {players.map(p => (
              <span
                key={p.id}
                title={`${p.name} (${p.id})`}
                style={{
                  fontSize: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
              >
                {p.avatar}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

