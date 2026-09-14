/**
 * Shadow Protocol — Core Game Engine
 *
 * Manages the complete game lifecycle aboard Aegis Station:
 * Lobby → Role Reveal → Free Roam & Tasks → Emergency Meeting → Shielded Voting → Resolution
 *
 * PRIVACY MODEL:
 * - PUBLIC: Round, alive status, task progress percentage, active sabotage, public events, final vote tallies
 * - PRIVATE: Player roles, task nullifiers, night actions, individual votes, room beacon alibis
 */

import {
  Role,
  ActionType,
  ROLE_METADATA,
  DEFAULT_ROLE_DISTRIBUTION,
  isActionValid,
  isEvil,
} from './roles';

import {
  RoomId,
  AEGIS_STATION_ROOMS,
  canMoveBetween,
  generateRoomBeacon,
} from './stationMap';

import {
  PlayerTask,
  generateTasksForPlayer,
  calculateTaskProgress,
  generateTaskNullifier,
} from './tasks';

import {
  SabotageState,
  SabotageType,
  createSabotage,
} from './sabotage';

import {
  AlibiReceipt,
  generateAlibiProof,
  verifyAlibiClaim,
} from './privacyVerifier';

// ─── Game Phase Enum ─────────────────────────────────────────────────
export enum GamePhase {
  Lobby = 'LOBBY',
  RoleReveal = 'ROLE_REVEAL',
  FreeRoam = 'FREE_ROAM',
  EmergencyMeeting = 'EMERGENCY_MEETING',
  Voting = 'VOTING',
  VoteResult = 'VOTE_RESULT',
  GameOver = 'GAME_OVER',
  // Backwards compatibility aliases:
  Night = 'NIGHT',
  DayReport = 'DAY_REPORT',
  Discussion = 'DISCUSSION',
}

// ─── Player State ────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: Role | null;        // PRIVATE — only visible to the player themselves
  isAlive: boolean;          // PUBLIC
  commitment: string;        // PUBLIC — hash of (secret + role)
  secret: Uint8Array | null; // PRIVATE — never leaves the client
  hasActed: boolean;         // Per-round action tracking
  hasVoted: boolean;         // Per-round vote tracking
  currentRoom: RoomId;       // Current location aboard Aegis Station
  tasks: PlayerTask[];       // Assigned mini-game tasks
}

// ─── Night / Free Roam Action ────────────────────────────────────────
export interface NightAction {
  playerId: string;
  action: ActionType;
  targetId: string | null;
  actionHash: string;
  round: number;
}

// ─── Vote ────────────────────────────────────────────────────────────
export interface Vote {
  voterId: string;
  targetId: string;          // 'skip' or player ID
  voteHash: string;
  round: number;
}

// ─── Game Event ──────────────────────────────────────────────────────
export interface GameEvent {
  id: string;
  round: number;
  type: 'attack_survived' | 'attack_killed' | 'no_attack' | 'player_eliminated' | 'game_start' | 'phase_change' | 'vote_result' | 'task_completed' | 'sabotage_triggered' | 'sabotage_resolved' | 'body_reported' | 'emergency_called';
  message: string;
  isPublic: boolean;
  timestamp: Date;
}

// ─── Vote Result ─────────────────────────────────────────────────────
export interface VoteResult {
  round: number;
  votes: Record<string, number>;  // targetId → count
  eliminatedId: string | null;
  isTie: boolean;
}

// ─── Dead Body Record ────────────────────────────────────────────────
export interface DeadBody {
  victimId: string;
  victimName: string;
  victimAvatar: string;
  roomId: RoomId;
  timestamp: number;
  reported: boolean;
}

// ─── Emergency State ─────────────────────────────────────────────────
export interface EmergencyState {
  reporterId: string;
  reporterName: string;
  reporterAvatar: string;
  reason: 'body' | 'button';
  roomFound?: RoomId;
  deadBody?: DeadBody;
  discussionTranscript: Array<{
    senderName: string;
    senderAvatar: string;
    text: string;
    isEvidence?: boolean;
  }>;
}

export type GameOutcome = 'ongoing' | 'good_wins' | 'evil_wins';

// ─── Game State ──────────────────────────────────────────────────────
export interface GameState {
  gameId: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  players: Player[];
  nightActions: NightAction[];
  votes: Vote[];
  events: GameEvent[];
  voteResults: VoteResult[];
  outcome: GameOutcome;
  winner: 'good' | 'evil' | null;
  winReason?: string;
  winMessage?: string;
  // Aegis Station states:
  deadBodies: DeadBody[];
  activeSabotage: SabotageState | null;
  taskProgress: { completed: number; total: number; percentage: number };
  emergencyState: EmergencyState | null;
  alibiReceipts: Record<string, AlibiReceipt>;
}

// ─── Default Players Setup ───────────────────────────────────────────
const DEFAULT_PLAYER_NAMES = [
  { name: 'Alice', avatar: '👩‍🚀' },
  { name: 'Bob', avatar: '👨‍🚀' },
  { name: 'Charlie', avatar: '🕵️' },
  { name: 'David', avatar: '🧑‍💻' },
  { name: 'Emma', avatar: '👩‍🔬' },
  { name: 'Frank', avatar: '🧑‍🚀' },
];

const STARTING_ROOMS: RoomId[] = ['command', 'hub', 'engine', 'security', 'reactor', 'lab'];

/**
 * Generate a cryptographically secure random 32-byte secret
 */
function generateSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Generate a simulated commitment hash
 */
function generateCommitment(secret: Uint8Array, role: Role): string {
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = (hash << 5) - hash + secret[i];
    hash |= 0;
  }
  for (let i = 0; i < role.length; i++) {
    hash = (hash << 5) - hash + role.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

// ─── Game Initialization ─────────────────────────────────────────────
export function initializeGame(playerCount = 6): GameState {
  const roles = [...DEFAULT_ROLE_DISTRIBUTION].slice(0, playerCount);

  const players: Player[] = DEFAULT_PLAYER_NAMES.slice(0, playerCount).map((p, index) => {
    const secret = generateSecret();
    const role = roles[index];
    const commitment = generateCommitment(secret, role);
    const isShadow = isEvil(role);
    const assignedTasks = generateTasksForPlayer(`player-${index}`, isShadow);
    const startingRoom = STARTING_ROOMS[index % STARTING_ROOMS.length];

    return {
      id: `player-${index}`,
      name: p.name,
      avatar: p.avatar,
      role: null,
      isAlive: true,
      commitment,
      secret,
      hasActed: false,
      hasVoted: false,
      currentRoom: startingRoom,
      tasks: assignedTasks,
    };
  });

  // Calculate initial task progress
  const initialTaskDict: Record<string, PlayerTask[]> = {};
  players.forEach(p => {
    initialTaskDict[p.id] = p.tasks;
  });
  const taskProgress = calculateTaskProgress(initialTaskDict);

  return {
    gameId: `aegis-${Date.now().toString(36)}`,
    phase: GamePhase.Lobby,
    round: 0,
    maxRounds: 5,
    players,
    nightActions: [],
    votes: [],
    events: [{
      id: `evt-${Date.now()}`,
      round: 0,
      type: 'game_start',
      message: 'Aegis Station mission initialized. 6 crew agents connected.',
      isPublic: true,
      timestamp: new Date(),
    }],
    voteResults: [],
    outcome: 'ongoing',
    winner: null,
    deadBodies: [],
    activeSabotage: null,
    taskProgress,
    emergencyState: null,
    alibiReceipts: {},
  };
}

// ─── Station Movement ────────────────────────────────────────────────
export function movePlayer(
  gameState: GameState,
  playerId: string,
  targetRoom: RoomId,
): GameState {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) return gameState;

  if (!canMoveBetween(player.currentRoom, targetRoom)) {
    return gameState;
  }

  const updatedPlayers = gameState.players.map(p =>
    p.id === playerId ? { ...p, currentRoom: targetRoom } : p
  );

  return {
    ...gameState,
    players: updatedPlayers,
  };
}

// ─── Task Completion ─────────────────────────────────────────────────
export function completePlayerTask(
  gameState: GameState,
  playerId: string,
  taskId: string,
): GameState {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) return gameState;

  const nullifier = generateTaskNullifier(playerId, taskId, gameState.round);

  const updatedTasks = player.tasks.map(t =>
    t.id === taskId ? { ...t, isCompleted: true, completedAtRound: gameState.round, taskNullifier: nullifier } : t
  );

  const updatedPlayers = gameState.players.map(p =>
    p.id === playerId ? { ...p, tasks: updatedTasks } : p
  );

  // Recalculate progress
  const taskDict: Record<string, PlayerTask[]> = {};
  updatedPlayers.forEach(p => {
    taskDict[p.id] = p.tasks;
  });
  const taskProgress = calculateTaskProgress(taskDict);

  const newEvents = [
    ...gameState.events,
    {
      id: `evt-${Date.now()}`,
      round: gameState.round,
      type: 'task_completed' as const,
      message: `A station task was completed. Global protocol completion: ${taskProgress.percentage}%.`,
      isPublic: true,
      timestamp: new Date(),
    }
  ];

  // Win condition: Tasks 100%
  if (taskProgress.percentage >= 100) {
    return {
      ...gameState,
      players: updatedPlayers,
      taskProgress,
      events: newEvents,
      phase: GamePhase.GameOver,
      outcome: 'good_wins',
      winner: 'good',
      winReason: 'Protocol Victory! All critical station tasks have been completed and verified.',
    };
  }

  return {
    ...gameState,
    players: updatedPlayers,
    taskProgress,
    events: newEvents,
  };
}

// ─── Sabotage Actions ────────────────────────────────────────────────
export function triggerSabotageAction(
  gameState: GameState,
  type: SabotageType,
): GameState {
  if (gameState.activeSabotage) return gameState; // already active

  const sabotage = createSabotage(type);
  const newEvents = [
    ...gameState.events,
    {
      id: `evt-${Date.now()}`,
      round: gameState.round,
      type: 'sabotage_triggered' as const,
      message: `⚠️ CRITICAL ALERT: ${sabotage.name} triggered in ${sabotage.requiredRoom.toUpperCase()}!`,
      isPublic: true,
      timestamp: new Date(),
    }
  ];

  return {
    ...gameState,
    activeSabotage: sabotage,
    events: newEvents,
  };
}

export function resolveSabotageAction(gameState: GameState): GameState {
  if (!gameState.activeSabotage) return gameState;

  const resolvedName = gameState.activeSabotage.name;
  const newEvents = [
    ...gameState.events,
    {
      id: `evt-${Date.now()}`,
      round: gameState.round,
      type: 'sabotage_resolved' as const,
      message: `✓ Station systems stabilized. ${resolvedName} defused.`,
      isPublic: true,
      timestamp: new Date(),
    }
  ];

  return {
    ...gameState,
    activeSabotage: null,
    events: newEvents,
  };
}

// ─── Elimination in Room ─────────────────────────────────────────────
export function eliminatePlayerInRoom(
  gameState: GameState,
  assassinId: string,
  targetId: string,
): GameState {
  const assassin = gameState.players.find(p => p.id === assassinId);
  const target = gameState.players.find(p => p.id === targetId);

  if (!assassin || !target || !target.isAlive) return gameState;
  if (assassin.currentRoom !== target.currentRoom) return gameState;

  const updatedPlayers = gameState.players.map(p =>
    p.id === targetId ? { ...p, isAlive: false } : p
  );

  const newBody: DeadBody = {
    victimId: target.id,
    victimName: target.name,
    victimAvatar: target.avatar,
    roomId: target.currentRoom,
    timestamp: Date.now(),
    reported: false,
  };

  return {
    ...gameState,
    players: updatedPlayers,
    deadBodies: [...gameState.deadBodies, newBody],
  };
}

// ─── Emergency Meeting Triggering ────────────────────────────────────
export function reportDeadBodyAction(
  gameState: GameState,
  reporterId: string,
): GameState {
  const reporter = gameState.players.find(p => p.id === reporterId);
  if (!reporter || !reporter.isAlive) return gameState;

  const bodyInRoom = gameState.deadBodies.find(b => b.roomId === reporter.currentRoom && !b.reported);
  if (!bodyInRoom) return gameState;

  // Mark body as reported
  const updatedBodies = gameState.deadBodies.map(b =>
    b.victimId === bodyInRoom.victimId ? { ...b, reported: true } : b
  );

  // Warp all living players to Command Center for the meeting
  const updatedPlayers = gameState.players.map(p =>
    p.isAlive ? { ...p, currentRoom: 'command' as RoomId, hasVoted: false } : p
  );

  // Build dynamic discussion transcript
  const transcript = [
    {
      senderName: reporter.name,
      senderAvatar: reporter.avatar,
      text: `🚨 I found ${bodyInRoom.victimName}'s body in the ${AEGIS_STATION_ROOMS[bodyInRoom.roomId].name}!`,
    },
    {
      senderName: 'Charlie',
      senderAvatar: '🛡️',
      text: `Where was everyone during the incident window? Present your cryptographic beacon alibis!`,
    },
    {
      senderName: 'David',
      senderAvatar: '🧑‍💻',
      text: `I was at the Communications array completing signal calibration. My room beacon is logged.`,
      isEvidence: true,
    },
  ];

  return {
    ...gameState,
    phase: GamePhase.EmergencyMeeting,
    deadBodies: updatedBodies,
    players: updatedPlayers,
    emergencyState: {
      reporterId: reporter.id,
      reporterName: reporter.name,
      reporterAvatar: reporter.avatar,
      reason: 'body',
      roomFound: bodyInRoom.roomId,
      deadBody: bodyInRoom,
      discussionTranscript: transcript,
    },
  };
}

export function callEmergencyButtonAction(
  gameState: GameState,
  callerId: string,
): GameState {
  const caller = gameState.players.find(p => p.id === callerId);
  if (!caller || !caller.isAlive || caller.currentRoom !== 'command') return gameState;

  // Warp all living players to Command Center
  const updatedPlayers = gameState.players.map(p =>
    p.isAlive ? { ...p, currentRoom: 'command' as RoomId, hasVoted: false } : p
  );

  const transcript = [
    {
      senderName: caller.name,
      senderAvatar: caller.avatar,
      text: `🚨 EMERGENCY MEETING called from the Command Console! Suspicious activity detected on the station.`,
    },
    {
      senderName: 'David',
      senderAvatar: '🧑‍💻',
      text: `Let's compare room beacon tokens and review who was wandering without completing tasks.`,
      isEvidence: true,
    },
  ];

  return {
    ...gameState,
    phase: GamePhase.EmergencyMeeting,
    players: updatedPlayers,
    emergencyState: {
      reporterId: caller.id,
      reporterName: caller.name,
      reporterAvatar: caller.avatar,
      reason: 'button',
      discussionTranscript: transcript,
    },
  };
}

// ─── Voting & Ejection ───────────────────────────────────────────────
export function submitShieldedVote(
  gameState: GameState,
  voterId: string,
  targetId: string,
): GameState {
  const voter = gameState.players.find(p => p.id === voterId);
  if (!voter || !voter.isAlive || voter.hasVoted) return gameState;

  const voteHash = `0xVOTE-${Date.now().toString(16)}`;
  const newVote: Vote = {
    voterId,
    targetId,
    voteHash,
    round: gameState.round,
  };

  const updatedPlayers = gameState.players.map(p =>
    p.id === voterId ? { ...p, hasVoted: true } : p
  );

  return {
    ...gameState,
    players: updatedPlayers,
    votes: [...gameState.votes, newVote],
  };
}

export function resolveEmergencyVote(gameState: GameState): GameState {
  const tallies: Record<string, number> = {};
  gameState.players.filter(p => p.isAlive).forEach(p => {
    tallies[p.id] = 0;
  });
  tallies['skip'] = 0;

  gameState.votes
    .filter(v => v.round === gameState.round)
    .forEach(v => {
      tallies[v.targetId] = (tallies[v.targetId] || 0) + 1;
    });

  let highestVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  Object.entries(tallies).forEach(([targetId, count]) => {
    if (targetId === 'skip') return;
    if (count > highestVotes) {
      highestVotes = count;
      eliminatedId = targetId;
      isTie = false;
    } else if (count === highestVotes && count > 0) {
      isTie = true;
    }
  });

  const skipVotes = tallies['skip'] || 0;
  if (skipVotes >= highestVotes) {
    eliminatedId = null; // Skipped
  } else if (isTie) {
    eliminatedId = null; // Tie
  }

  let updatedPlayers = gameState.players;
  if (eliminatedId) {
    updatedPlayers = gameState.players.map(p =>
      p.id === eliminatedId ? { ...p, isAlive: false } : p
    );
  }

  const voteResult: VoteResult = {
    round: gameState.round,
    votes: tallies,
    eliminatedId,
    isTie,
  };

  // Check Win Conditions
  const livingPlayers = updatedPlayers.filter(p => p.isAlive);
  const livingShadow = livingPlayers.filter(p => isEvil(p.role!));
  const livingProtocol = livingPlayers.filter(p => !isEvil(p.role!));

  if (livingShadow.length === 0) {
    return {
      ...gameState,
      phase: GamePhase.GameOver,
      players: updatedPlayers,
      voteResults: [...gameState.voteResults, voteResult],
      outcome: 'good_wins',
      winner: 'good',
      winReason: 'Protocol Victory! All Shadow agents have been exiled from Aegis Station.',
    };
  }

  if (livingProtocol.length <= livingShadow.length) {
    return {
      ...gameState,
      phase: GamePhase.GameOver,
      players: updatedPlayers,
      voteResults: [...gameState.voteResults, voteResult],
      outcome: 'evil_wins',
      winner: 'evil',
      winReason: 'Shadow Victory! The Shadow team has achieved parity or majority control.',
    };
  }

  return {
    ...gameState,
    phase: GamePhase.VoteResult,
    players: updatedPlayers,
    voteResults: [...gameState.voteResults, voteResult],
  };
}

// ─── Transition Helpers ──────────────────────────────────────────────
export function startGame(gameState: GameState): GameState {
  const roles = [...DEFAULT_ROLE_DISTRIBUTION].slice(0, gameState.players.length);
  const updatedPlayers = gameState.players.map((p, index) => {
    const role = roles[index];
    const commitment = generateCommitment(p.secret!, role);
    return {
      ...p,
      role,
      commitment,
    };
  });

  return {
    ...gameState,
    phase: GamePhase.RoleReveal,
    round: Math.max(gameState.round, 1),
    players: updatedPlayers,
  };
}

export function proceedToFreeRoam(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.FreeRoam,
  };
}

export function startVotingFromEmergency(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.Voting,
  };
}

export function nextRound(gameState: GameState): GameState {
  const nextRnd = gameState.round + 1;
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    hasActed: false,
    hasVoted: false,
  }));

  return {
    ...gameState,
    phase: GamePhase.FreeRoam,
    round: nextRnd,
    players: updatedPlayers,
    emergencyState: null,
  };
}

// ─── Legacy Night & Day Adapters (Keeps existing views working) ──────
export function checkWinCondition(gameState: GameState): { winner: 'good' | 'evil' | null; message?: string } {
  const living = gameState.players.filter(p => p.isAlive);
  const evilCount = living.filter(p => isEvil(p.role!)).length;
  const goodCount = living.filter(p => !isEvil(p.role!)).length;

  if (evilCount === 0) {
    return { winner: 'good', message: 'Guardians and Protocol agents prevail!' };
  }
  if (goodCount <= evilCount) {
    return { winner: 'evil', message: 'Assassin and Shadow operatives take control!' };
  }
  return { winner: null };
}

export function getPlayerView(gameState: GameState, playerId: string) {
  const player = gameState.players.find(p => p.id === playerId);
  return {
    player,
    role: player?.role || null,
    publicState: getPublicGameState(gameState),
    investigationResults: new Map<string, { targetId: string; isEvil: boolean }>(),
  };
}

export function getPublicGameState(gameState: GameState) {
  const isOver = gameState.phase === GamePhase.GameOver;
  return {
    gameId: gameState.gameId,
    phase: gameState.phase,
    round: gameState.round,
    players: gameState.players.map(p => {
      const base: any = {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isAlive: p.isAlive,
        commitment: p.commitment,
      };
      if (isOver) {
        base.role = p.role;
      }
      return base;
    }),
    events: gameState.events,
    outcome: gameState.outcome,
    taskProgress: gameState.taskProgress,
  };
}

export function submitNightAction(
  gameState: GameState,
  playerId: string,
  action: ActionType,
  targetId: string | null,
): GameState {
  const actionHash = `0xACT-${Date.now().toString(16)}`;
  const newAction: NightAction = {
    playerId,
    action,
    targetId,
    actionHash,
    round: gameState.round,
  };

  const updatedPlayers = gameState.players.map(p =>
    p.id === playerId ? { ...p, hasActed: true } : p
  );

  return {
    ...gameState,
    players: updatedPlayers,
    nightActions: [...gameState.nightActions, newAction],
  };
}

export function submitVote(gameState: GameState, voterId: string, targetId: string): GameState {
  return submitShieldedVote(gameState, voterId, targetId);
}

export async function assignRoles(gameState: GameState): Promise<GameState> {
  return startGame(gameState);
}

export function processNightActions(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.FreeRoam,
  };
}

export function processVotes(gameState: GameState): GameState {
  return resolveEmergencyVote(gameState);
}

export function allPlayersActed(gameState: GameState): boolean {
  const living = gameState.players.filter(p => p.isAlive);
  return living.every(p => p.hasActed);
}

export function allPlayersVoted(gameState: GameState): boolean {
  const living = gameState.players.filter(p => p.isAlive);
  return living.every(p => p.hasVoted);
}

export function startNightPhase(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.FreeRoam,
  };
}

export function startVotingPhase(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.Voting,
  };
}

export function startDiscussionPhase(gameState: GameState): GameState {
  return {
    ...gameState,
    phase: GamePhase.EmergencyMeeting,
  };
}

export function tallyVotes(gameState: GameState): GameState {
  return resolveEmergencyVote(gameState);
}

