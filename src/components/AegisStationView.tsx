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
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          position: 'relative',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <div>
              <span className="section-tag tag-purple">AEGIS STATION SCHEMATIC · LIVE TELEMETRY</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
                Sector Overview
              </h3>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              CLICK ANY ADJACENT ROOM TO NAVIGATE
            </div>
          </div>

          {/* 2D Schematic Compartment Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto auto',
            gap: 'var(--space-md)',
            position: 'relative'
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
      style={{
        width: '100%',
        minHeight: '110px',
        padding: 'var(--space-md)',
        background: isCurrent
          ? `${room.color}18`
          : canMove
          ? 'var(--bg-secondary)'
          : 'rgba(15, 20, 36, 0.4)',
        border: isCurrent
          ? `2px solid ${room.color}`
          : hasDeadBody
          ? '2px dashed var(--shadow)'
          : canMove
          ? '1px solid var(--border)'
          : '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: 'var(--radius-lg)',
        cursor: canMove && !isCurrent ? 'pointer' : 'default',
        boxShadow: isCurrent ? `0 0 20px ${room.color}33` : 'none',
        transition: 'all var(--transition)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top row: icon, code, status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span style={{ fontSize: '1.25rem' }}>{room.icon}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: room.color, fontWeight: 700 }}>
            {room.code}
          </span>
        </div>
        {isCurrent && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            background: room.color,
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700
          }}>
            YOU ARE HERE
          </span>
        )}
      </div>

      {/* Room Name */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
        {room.name}
      </div>

      {/* Occupants or Alerts */}
      <div>
        {hasDeadBody && (
          <div style={{ color: 'var(--shadow)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
            ☠️ CASUALTY FOUND!
          </div>
        )}
        {players.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
            {players.map(p => (
              <span
                key={p.id}
                title={p.name}
                style={{
                  fontSize: '0.875rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)'
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
