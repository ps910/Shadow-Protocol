import { describe, it, expect } from 'vitest';
import {
  initializeGame,
  startGame,
  movePlayer,
  completePlayerTask,
  triggerSabotageAction,
  resolveSabotageAction,
  eliminatePlayerInRoom,
  reportDeadBodyAction,
  callEmergencyButtonAction,
  submitShieldedVote,
  resolveEmergencyVote,
  GamePhase,
} from '../game/gameEngine';
import { canMoveBetween, AEGIS_STATION_ROOMS, generateRoomBeacon } from '../game/stationMap';
import { generateTaskNullifier } from '../game/tasks';
import { generateAlibiProof, verifyAlibiClaim } from '../game/privacyVerifier';
import { Role } from '../game/roles';

describe('Aegis Station — Spatial Map & Navigation', () => {
  it('enforces room adjacency rules on Aegis Station', () => {
    // Command Center connects to Central Hub
    expect(canMoveBetween('command', 'hub')).toBe(true);
    expect(canMoveBetween('hub', 'command')).toBe(true);

    // Central Hub connects to Engine, Security, and Lab
    expect(canMoveBetween('hub', 'engine')).toBe(true);
    expect(canMoveBetween('hub', 'security')).toBe(true);
    expect(canMoveBetween('hub', 'lab')).toBe(true);

    // Command cannot jump directly to Reactor or Comms
    expect(canMoveBetween('command', 'reactor')).toBe(false);
    expect(canMoveBetween('command', 'comms')).toBe(false);
  });

  it('moves player between valid adjacent rooms', () => {
    const state = initializeGame(6);
    // Move player-0 (starting in command) to hub
    state.players[0].currentRoom = 'command';
    const moved = movePlayer(state, 'player-0', 'hub');
    expect(moved.players[0].currentRoom).toBe('hub');

    // Attempt invalid jump to reactor (should be rejected)
    const invalidMove = movePlayer(moved, 'player-0', 'reactor');
    expect(invalidMove.players[0].currentRoom).toBe('hub');
  });

  it('generates deterministic room beacon alibi tokens', () => {
    const timestamp = 1700000000000;
    const token1 = generateRoomBeacon('reactor', timestamp);
    const token2 = generateRoomBeacon('reactor', timestamp);

    expect(token1).toContain('BCN-REACTOR');
    expect(token1).toBe(token2);

    const commsToken = generateRoomBeacon('comms', timestamp);
    expect(commsToken).toContain('BCN-COMMS');
    expect(commsToken).not.toBe(token1);
  });
});

describe('Aegis Station — Tasks & Mini-Game Progression', () => {
  it('assigns tasks to each crew member', () => {
    const state = initializeGame(6);
    state.players.forEach(p => {
      expect(p.tasks.length).toBeGreaterThanOrEqual(2);
      p.tasks.forEach(t => {
        expect(t.isCompleted).toBe(false);
        expect(AEGIS_STATION_ROOMS[t.roomId]).toBeDefined();
      });
    });
  });

  it('completes task, updates progress, and produces a single-use nullifier', () => {
    const state = initializeGame(6);
    const player = state.players[0];
    const task = player.tasks[0];

    const updated = completePlayerTask(state, player.id, task.id);
    const updatedTask = updated.players[0].tasks.find(t => t.id === task.id);

    expect(updatedTask?.isCompleted).toBe(true);
    expect(updatedTask?.taskNullifier).toBeDefined();
    expect(updatedTask?.taskNullifier).toContain('0xNULL');
    expect(updated.taskProgress.completed).toBe(state.taskProgress.completed + 1);
  });

  it('triggers Protocol Victory when task progress reaches 100%', () => {
    const state = initializeGame(6);
    // Mark all tasks except one as completed
    const player = state.players[0];
    state.players.forEach(p => {
      p.tasks.forEach(t => {
        t.isCompleted = true;
      });
    });
    // Uncomplete one task
    player.tasks[0].isCompleted = false;

    // Complete the final task
    const winState = completePlayerTask(state, player.id, player.tasks[0].id);

    expect(winState.phase).toBe(GamePhase.GameOver);
    expect(winState.outcome).toBe('good_wins');
    expect(winState.winner).toBe('good');
  });
});

describe('Aegis Station — Sabotage Mechanics', () => {
  it('triggers Reactor Meltdown with critical countdown timer', () => {
    const state = initializeGame(6);
    const sabotaged = triggerSabotageAction(state, 'reactor');

    expect(sabotaged.activeSabotage).not.toBeNull();
    expect(sabotaged.activeSabotage?.type).toBe('reactor');
    expect(sabotaged.activeSabotage?.isCritical).toBe(true);
    expect(sabotaged.activeSabotage?.secondsRemaining).toBe(45);
    expect(sabotaged.activeSabotage?.requiredRoom).toBe('reactor');
  });

  it('resolves active sabotage when stabilized', () => {
    const state = initializeGame(6);
    const sabotaged = triggerSabotageAction(state, 'comms');
    expect(sabotaged.activeSabotage?.type).toBe('comms');

    const resolved = resolveSabotageAction(sabotaged);
    expect(resolved.activeSabotage).toBeNull();
  });
});

describe('Aegis Station — Elimination, Body Discovery & Alibis', () => {
  it('allows assassin to eliminate a player in the same room', () => {
    const state = initializeGame(6);
    const assassin = state.players[1]; // Bob
    const victim = state.players[0];   // Alice
    assassin.role = Role.Assassin;
    assassin.currentRoom = 'reactor';
    victim.currentRoom = 'reactor';

    const eliminated = eliminatePlayerInRoom(state, assassin.id, victim.id);
    const updatedVictim = eliminated.players.find(p => p.id === victim.id);

    expect(updatedVictim?.isAlive).toBe(false);
    expect(eliminated.deadBodies.length).toBe(1);
    expect(eliminated.deadBodies[0].victimId).toBe(victim.id);
    expect(eliminated.deadBodies[0].roomId).toBe('reactor');
  });

  it('triggers Emergency Meeting when discovering a dead body', () => {
    const state = initializeGame(6);
    const reporter = state.players[2]; // Charlie
    reporter.currentRoom = 'reactor';

    state.deadBodies = [{
      victimId: 'player-0',
      victimName: 'Alice',
      victimAvatar: '👩‍🚀',
      roomId: 'reactor',
      timestamp: Date.now(),
      reported: false,
    }];

    const meeting = reportDeadBodyAction(state, reporter.id);

    expect(meeting.phase).toBe(GamePhase.EmergencyMeeting);
    expect(meeting.emergencyState?.reason).toBe('body');
    expect(meeting.emergencyState?.roomFound).toBe('reactor');
    expect(meeting.emergencyState?.reporterId).toBe(reporter.id);
  });

  it('triggers Emergency Meeting from Command Center emergency button', () => {
    const state = initializeGame(6);
    const caller = state.players[0];
    caller.currentRoom = 'command';

    const meeting = callEmergencyButtonAction(state, caller.id);

    expect(meeting.phase).toBe(GamePhase.EmergencyMeeting);
    expect(meeting.emergencyState?.reason).toBe('button');
  });

  it('generates and verifies cryptographic alibi claims', async () => {
    const state = initializeGame(6);
    const suspect = state.players[3]; // David in comms
    suspect.currentRoom = 'comms';
    const timestamp = Date.now();

    const alibi = await generateAlibiProof(
      suspect.secret!,
      suspect.id,
      suspect.name,
      'comms',
      'Communications Array',
      timestamp
    );

    expect(alibi.beaconToken).toContain('BCN-COMMS');

    // Verify against crime scene in reactor
    const claim = verifyAlibiClaim(alibi, 'reactor', timestamp);
    expect(claim.isVerified).toBe(true);
    expect(claim.status).toBe('ALIBI CONFIRMED');
    expect(claim.details).toContain('Cleared of direct involvement');
  });
});

describe('Aegis Station — Shielded Voting & Ejection', () => {
  it('records shielded votes and exiles plurality suspect', () => {
    const initial = initializeGame(6);
    const state = startGame(initial);
    state.phase = GamePhase.Voting;
    state.round = 1;

    // Bob (suspect) gets 3 votes, Charlie gets 1 vote
    let voted = submitShieldedVote(state, 'player-0', 'player-1');
    voted = submitShieldedVote(voted, 'player-2', 'player-1');
    voted = submitShieldedVote(voted, 'player-3', 'player-1');
    voted = submitShieldedVote(voted, 'player-4', 'player-2');

    const result = resolveEmergencyVote(voted);

    expect(result.players.find(p => p.id === 'player-1')?.isAlive).toBe(false);
  });
});
