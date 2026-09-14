/**
 * Shadow Protocol — Core Game Engine
 *
 * Manages the complete game lifecycle:
 * Lobby → Role Assignment → Night Phase → Day Phase → Voting → Resolution
 *
 * PRIVACY MODEL:
 * - PUBLIC: Round number, alive/dead status, game outcome, vote counts, events
 * - PRIVATE: Player roles, night actions, investigation results, vote targets
 *
 * The game engine processes all state transitions while keeping sensitive
 * information compartmentalized. Each player only sees their own private data.
 */

import {
  Role,
  ActionType,
  ROLE_METADATA,
  DEFAULT_ROLE_DISTRIBUTION,
  isActionValid,
  isEvil,
} from './roles';

// ─── Game Phase Enum ─────────────────────────────────────────────────
export enum GamePhase {
  Lobby = 'LOBBY',
  RoleReveal = 'ROLE_REVEAL',
  Night = 'NIGHT',
  DayReport = 'DAY_REPORT',
  Discussion = 'DISCUSSION',
  Voting = 'VOTING',
  VoteResult = 'VOTE_RESULT',
  GameOver = 'GAME_OVER',
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
}

// ─── Night Action ────────────────────────────────────────────────────
export interface NightAction {
  playerId: string;
  action: ActionType;
  targetId: string | null;
  actionHash: string;        // Commitment of the action (public)
  round: number;
}

// ─── Vote ────────────────────────────────────────────────────────────
export interface Vote {
  voterId: string;
  targetId: string;
  voteHash: string;          // Commitment of the vote (public)
  round: number;
}

// ─── Night Report ────────────────────────────────────────────────────
export interface NightReport {
  round: number;
  events: GameEvent[];
  investigationResults: Map<string, { targetId: string; isEvil: boolean }>; // PRIVATE per investigator
}

// ─── Game Event (Public) ─────────────────────────────────────────────
export interface GameEvent {
  id: string;
  round: number;
  type: 'attack_survived' | 'attack_killed' | 'no_attack' | 'player_eliminated' | 'game_start' | 'phase_change' | 'vote_result';
  message: string;
  isPublic: boolean;
  timestamp: Date;
}

// ─── Vote Result ─────────────────────────────────────────────────────
export interface VoteResult {
  round: number;
  votes: Record<string, number>;  // targetId → count (PUBLIC)
  eliminatedId: string | null;
  isTie: boolean;
}

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
  nightReports: NightReport[];
  voteResults: VoteResult[];
  winner: 'good' | 'evil' | null;
  winMessage: string | null;
  currentPlayerId: string | null;  // Which player view is active
  investigationLog: Map<string, Array<{ targetId: string; isEvil: boolean; round: number }>>;
}

// ─── Player Avatars ──────────────────────────────────────────────────
const PLAYER_AVATARS = ['🦊', '🐺', '🦉', '🐱', '🦅', '🐻'];
const PLAYER_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank'];

// ─── Game Engine Functions ───────────────────────────────────────────

/**
 * Initialize a new game with the given number of players.
 */
export function initializeGame(playerCount: number = 6): GameState {
  const gameId = generateGameId();
  const players: Player[] = [];

  for (let i = 0; i < playerCount; i++) {
    const secret = generatePlayerSecret();
    players.push({
      id: `player-${i}`,
      name: PLAYER_NAMES[i] || `Player ${i + 1}`,
      avatar: PLAYER_AVATARS[i] || '👤',
      role: null,
      isAlive: true,
      commitment: '',
      secret,
      hasActed: false,
      hasVoted: false,
    });
  }

  return {
    gameId,
    phase: GamePhase.Lobby,
    round: 0,
    maxRounds: 5,
    players,
    nightActions: [],
    votes: [],
    events: [{
      id: crypto.randomUUID(),
      round: 0,
      type: 'game_start',
      message: `Shadow Protocol initialized. ${playerCount} agents assembled.`,
      isPublic: true,
      timestamp: new Date(),
    }],
    nightReports: [],
    voteResults: [],
    winner: null,
    winMessage: null,
    currentPlayerId: players[0]?.id || null,
    investigationLog: new Map(),
  };
}

/**
 * Assign roles to all players using cryptographic randomness.
 * Returns the game state with roles assigned and commitments generated.
 *
 * PRIVACY: Roles are stored in local state only.
 * The commitment (hash of secret+role) goes on-chain.
 */
export async function assignRoles(state: GameState): Promise<GameState> {
  const roles = shuffleArray([...DEFAULT_ROLE_DISTRIBUTION]);

  // Ensure we have enough roles
  while (roles.length < state.players.length) {
    roles.push(Role.Civilian);
  }

  const updatedPlayers = await Promise.all(
    state.players.map(async (player, index) => {
      const role = roles[index];
      const commitment = await deriveRoleCommitment(player.secret!, role);
      return {
        ...player,
        role,
        commitment,
      };
    })
  );

  return {
    ...state,
    players: updatedPlayers,
    phase: GamePhase.RoleReveal,
    round: 1,
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        round: 1,
        type: 'phase_change' as const,
        message: 'Roles have been secretly assigned. Each agent knows only their own identity.',
        isPublic: true,
        timestamp: new Date(),
      },
    ],
  };
}

/**
 * Transition from role reveal to the first night phase.
 */
export function startNightPhase(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.Night,
    nightActions: [],
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        round: state.round,
        type: 'phase_change',
        message: `Night ${state.round} falls. The shadows come alive...`,
        isPublic: true,
        timestamp: new Date(),
      },
    ],
    players: state.players.map(p => ({ ...p, hasActed: false })),
  };
}

/**
 * Submit a night action for a player.
 * Validates that the action is legal for the player's role.
 *
 * PRIVACY: The action type and target are kept private.
 * Only the action hash (commitment) is recorded publicly.
 */
export async function submitNightAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  targetId: string | null,
): Promise<GameState> {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');
  if (!player.isAlive) throw new Error('Dead players cannot act');
  if (!player.role) throw new Error('Player has no role assigned');
  if (player.hasActed) throw new Error('Player has already acted this round');

  // Validate action is legal for this role
  if (!isActionValid(player.role, action)) {
    throw new Error(`Action ${action} is not valid for role ${player.role}`);
  }

  // Validate target
  if (action !== ActionType.Hide && action !== ActionType.Skip) {
    if (!targetId) throw new Error('Action requires a target');
    const target = state.players.find(p => p.id === targetId);
    if (!target) throw new Error('Target not found');
    if (!target.isAlive) throw new Error('Cannot target a dead player');
    if (targetId === playerId && action === ActionType.Assassinate) {
      throw new Error('Cannot assassinate yourself');
    }
  }

  // Generate action hash (commitment)
  const actionHash = await deriveActionHash(
    player.secret!,
    action,
    targetId || '',
    state.round,
  );

  const nightAction: NightAction = {
    playerId,
    action,
    targetId,
    actionHash,
    round: state.round,
  };

  return {
    ...state,
    nightActions: [...state.nightActions, nightAction],
    players: state.players.map(p =>
      p.id === playerId ? { ...p, hasActed: true } : p
    ),
  };
}

/**
 * Check if all alive players have submitted their night actions.
 */
export function allPlayersActed(state: GameState): boolean {
  return state.players
    .filter(p => p.isAlive)
    .every(p => p.hasActed);
}

/**
 * Process all night actions and generate the night report.
 * Returns the updated game state with results.
 *
 * PRIVACY:
 * - PUBLIC: "A player was attacked" / "A player was protected"
 * - PRIVATE: Who attacked, who protected, investigation results
 */
export function processNightActions(state: GameState): GameState {
  const roundActions = state.nightActions.filter(a => a.round === state.round);
  const events: GameEvent[] = [];
  const investigationResults = new Map<string, { targetId: string; isEvil: boolean }>();

  // Find assassination target
  const assassinateAction = roundActions.find(a => a.action === ActionType.Assassinate);

  // Find protection target
  const protectAction = roundActions.find(a => a.action === ActionType.Protect);

  // Find investigation target
  const investigateAction = roundActions.find(a => a.action === ActionType.Investigate);

  let updatedPlayers = [...state.players];

  // Process assassination
  if (assassinateAction && assassinateAction.targetId) {
    const targetId = assassinateAction.targetId;
    const isProtected = protectAction?.targetId === targetId;

    if (isProtected) {
      events.push({
        id: crypto.randomUUID(),
        round: state.round,
        type: 'attack_survived',
        message: 'Someone was targeted for elimination last night, but a mysterious guardian intervened. The target survived.',
        isPublic: true,
        timestamp: new Date(),
      });
    } else {
      // Player is eliminated
      updatedPlayers = updatedPlayers.map(p =>
        p.id === targetId ? { ...p, isAlive: false } : p
      );
      const victim = state.players.find(p => p.id === targetId);
      events.push({
        id: crypto.randomUUID(),
        round: state.round,
        type: 'attack_killed',
        message: `${victim?.name || 'A player'} was found eliminated this morning. Their role was: ${ROLE_METADATA[victim?.role || Role.Civilian].emoji} ${ROLE_METADATA[victim?.role || Role.Civilian].name}`,
        isPublic: true,
        timestamp: new Date(),
      });
    }
  } else {
    events.push({
      id: crypto.randomUUID(),
      round: state.round,
      type: 'no_attack',
      message: 'The night passed peacefully. No one was attacked.',
      isPublic: true,
      timestamp: new Date(),
    });
  }

  // Process investigation (PRIVATE result — only the investigator sees this)
  if (investigateAction && investigateAction.targetId) {
    const target = state.players.find(p => p.id === investigateAction.targetId);
    if (target && target.role) {
      investigationResults.set(investigateAction.playerId, {
        targetId: investigateAction.targetId,
        isEvil: isEvil(target.role),
      });
    }
  }

  // Update investigation log
  const newInvestigationLog = new Map(state.investigationLog);
  investigationResults.forEach((result, investigatorId) => {
    const existing = newInvestigationLog.get(investigatorId) || [];
    existing.push({ ...result, round: state.round });
    newInvestigationLog.set(investigatorId, existing);
  });

  const nightReport: NightReport = {
    round: state.round,
    events,
    investigationResults,
  };

  // Check win condition after night
  const winCheck = checkWinCondition({ ...state, players: updatedPlayers });

  return {
    ...state,
    players: updatedPlayers,
    phase: winCheck.winner ? GamePhase.GameOver : GamePhase.DayReport,
    events: [...state.events, ...events],
    nightReports: [...state.nightReports, nightReport],
    investigationLog: newInvestigationLog,
    winner: winCheck.winner,
    winMessage: winCheck.message,
  };
}

/**
 * Transition to discussion phase.
 */
export function startDiscussionPhase(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.Discussion,
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        round: state.round,
        type: 'phase_change',
        message: `Day ${state.round} begins. Players discuss and debate who they suspect.`,
        isPublic: true,
        timestamp: new Date(),
      },
    ],
  };
}

/**
 * Transition to voting phase.
 */
export function startVotingPhase(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.Voting,
    votes: state.votes.filter(v => v.round !== state.round), // Clear current round votes
    players: state.players.map(p => ({ ...p, hasVoted: false })),
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        round: state.round,
        type: 'phase_change',
        message: 'Voting has begun. Each player casts a private vote to eliminate a suspect.',
        isPublic: true,
        timestamp: new Date(),
      },
    ],
  };
}

/**
 * Submit a vote for a player.
 *
 * PRIVACY: Individual votes are private.
 * Only the aggregate result is revealed.
 */
export async function submitVote(
  state: GameState,
  voterId: string,
  targetId: string,
): Promise<GameState> {
  const voter = state.players.find(p => p.id === voterId);
  if (!voter) throw new Error('Voter not found');
  if (!voter.isAlive) throw new Error('Dead players cannot vote');
  if (voter.hasVoted) throw new Error('Player has already voted this round');
  if (voterId === targetId) throw new Error('Cannot vote for yourself');

  const target = state.players.find(p => p.id === targetId);
  if (!target) throw new Error('Target not found');
  if (!target.isAlive) throw new Error('Cannot vote for a dead player');

  // Generate vote hash (commitment)
  const voteHash = await deriveVoteHash(voter.secret!, targetId, state.round);

  const vote: Vote = {
    voterId,
    targetId,
    voteHash,
    round: state.round,
  };

  return {
    ...state,
    votes: [...state.votes, vote],
    players: state.players.map(p =>
      p.id === voterId ? { ...p, hasVoted: true } : p
    ),
  };
}

/**
 * Check if all alive players have voted.
 */
export function allPlayersVoted(state: GameState): boolean {
  return state.players
    .filter(p => p.isAlive)
    .every(p => p.hasVoted);
}

/**
 * Process votes and determine elimination.
 *
 * PRIVACY:
 * - PUBLIC: Vote counts per target, who is eliminated
 * - PRIVATE: Which player voted for whom
 */
export function processVotes(state: GameState): GameState {
  const roundVotes = state.votes.filter(v => v.round === state.round);

  // Tally votes
  const tally: Record<string, number> = {};
  roundVotes.forEach(vote => {
    tally[vote.targetId] = (tally[vote.targetId] || 0) + 1;
  });

  // Find highest vote count
  const maxVotes = Math.max(...Object.values(tally), 0);
  const topTargets = Object.entries(tally).filter(([, count]) => count === maxVotes);
  const isTie = topTargets.length > 1;

  let eliminatedId: string | null = null;
  const events: GameEvent[] = [];

  if (isTie || maxVotes === 0) {
    events.push({
      id: crypto.randomUUID(),
      round: state.round,
      type: 'vote_result',
      message: 'The vote ended in a tie. No one was eliminated.',
      isPublic: true,
      timestamp: new Date(),
    });
  } else {
    eliminatedId = topTargets[0][0];
    const eliminated = state.players.find(p => p.id === eliminatedId);
    events.push({
      id: crypto.randomUUID(),
      round: state.round,
      type: 'player_eliminated',
      message: `The town has voted. ${eliminated?.name || 'A player'} has been eliminated. Their role was: ${ROLE_METADATA[eliminated?.role || Role.Civilian].emoji} ${ROLE_METADATA[eliminated?.role || Role.Civilian].name}`,
      isPublic: true,
      timestamp: new Date(),
    });
  }

  const voteResult: VoteResult = {
    round: state.round,
    votes: tally,
    eliminatedId,
    isTie,
  };

  let updatedPlayers = state.players;
  if (eliminatedId) {
    updatedPlayers = updatedPlayers.map(p =>
      p.id === eliminatedId ? { ...p, isAlive: false } : p
    );
  }

  // Check win condition after voting
  const winCheck = checkWinCondition({ ...state, players: updatedPlayers });

  return {
    ...state,
    players: updatedPlayers,
    phase: winCheck.winner ? GamePhase.GameOver : GamePhase.VoteResult,
    events: [...state.events, ...events],
    voteResults: [...state.voteResults, voteResult],
    winner: winCheck.winner,
    winMessage: winCheck.message,
  };
}

/**
 * Start the next round (night phase).
 */
export function nextRound(state: GameState): GameState {
  const newRound = state.round + 1;

  if (newRound > state.maxRounds) {
    // Max rounds exceeded — good team wins by default
    return {
      ...state,
      phase: GamePhase.GameOver,
      winner: 'good',
      winMessage: 'Time has run out! The Guardians and Civilians win by surviving.',
    };
  }

  return {
    ...state,
    round: newRound,
    phase: GamePhase.Night,
    nightActions: state.nightActions, // Keep history
    players: state.players.map(p => ({ ...p, hasActed: false, hasVoted: false })),
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        round: newRound,
        type: 'phase_change',
        message: `Night ${newRound} falls. The shadows come alive once more...`,
        isPublic: true,
        timestamp: new Date(),
      },
    ],
  };
}

// ─── Win Condition ───────────────────────────────────────────────────
/**
 * Check if the game has reached a win condition.
 *
 * Evil wins if: Assassin is alive and alive evil >= alive good
 * Good wins if: All evil players are eliminated
 */
export function checkWinCondition(state: GameState): { winner: 'good' | 'evil' | null; message: string | null } {
  const alivePlayers = state.players.filter(p => p.isAlive);
  const aliveEvil = alivePlayers.filter(p => p.role && isEvil(p.role));
  const aliveGood = alivePlayers.filter(p => p.role && !isEvil(p.role));

  // Evil eliminated
  if (aliveEvil.length === 0) {
    return {
      winner: 'good',
      message: '🛡️ The Assassin has been unmasked! Guardians and Civilians win!',
    };
  }

  // Evil majority (or equal)
  if (aliveEvil.length >= aliveGood.length) {
    return {
      winner: 'evil',
      message: '🗡️ The Assassin has seized control! The shadows consume all...',
    };
  }

  return { winner: null, message: null };
}

// ─── Public Game State ───────────────────────────────────────────────
/**
 * Get the public game state — information visible to ALL players.
 * Strips all private data (roles, secrets, action details).
 */
export interface PublicGameState {
  gameId: string;
  phase: GamePhase;
  round: number;
  players: Array<{
    id: string;
    name: string;
    avatar: string;
    isAlive: boolean;
    hasActed: boolean;
    hasVoted: boolean;
    // Role is NOT included unless game is over
    role?: Role;
  }>;
  events: GameEvent[];
  voteResults: VoteResult[];
  winner: 'good' | 'evil' | null;
  winMessage: string | null;
}

export function getPublicGameState(state: GameState): PublicGameState {
  return {
    gameId: state.gameId,
    phase: state.phase,
    round: state.round,
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isAlive: p.isAlive,
      hasActed: p.hasActed,
      hasVoted: p.hasVoted,
      // Only reveal roles when game is over
      ...(state.phase === GamePhase.GameOver ? { role: p.role || undefined } : {}),
    })),
    events: state.events.filter(e => e.isPublic),
    voteResults: state.voteResults,
    winner: state.winner,
    winMessage: state.winMessage,
  };
}

/**
 * Get a player's private view of the game.
 * Includes their role, investigation results, etc.
 */
export interface PlayerView {
  playerId: string;
  role: Role | null;
  roleMeta: typeof ROLE_METADATA[Role] | null;
  investigationResults: Array<{ targetId: string; isEvil: boolean; round: number }>;
  publicState: PublicGameState;
}

export function getPlayerView(state: GameState, playerId: string): PlayerView {
  const player = state.players.find(p => p.id === playerId);
  const publicState = getPublicGameState(state);

  return {
    playerId,
    role: player?.role || null,
    roleMeta: player?.role ? ROLE_METADATA[player.role] : null,
    investigationResults: state.investigationLog.get(playerId) || [],
    publicState,
  };
}

// ─── Utility Functions ──────────────────────────────────────────────

function generateGameId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generatePlayerSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Cryptographically shuffle an array using Fisher-Yates with crypto.getRandomValues.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomValues = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomValues);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Derive a commitment from a player's secret and role.
 * commitment = SHA-256(secret || role)
 */
async function deriveRoleCommitment(secret: Uint8Array, role: Role): Promise<string> {
  const roleBytes = new TextEncoder().encode(role);
  const combined = new Uint8Array(secret.length + roleBytes.length);
  combined.set(secret);
  combined.set(roleBytes, secret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive an action hash from components.
 * actionHash = SHA-256(secret || action || target || round)
 */
async function deriveActionHash(
  secret: Uint8Array,
  action: ActionType,
  targetId: string,
  round: number,
): Promise<string> {
  const payload = new TextEncoder().encode(`${action}:${targetId}:${round}`);
  const combined = new Uint8Array(secret.length + payload.length);
  combined.set(secret);
  combined.set(payload, secret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive a vote hash from components.
 * voteHash = SHA-256(secret || "vote:" || targetId || round)
 */
async function deriveVoteHash(
  secret: Uint8Array,
  targetId: string,
  round: number,
): Promise<string> {
  const payload = new TextEncoder().encode(`vote:${targetId}:${round}`);
  const combined = new Uint8Array(secret.length + payload.length);
  combined.set(secret);
  combined.set(payload, secret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  return '0x' + Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Re-export utility functions for testing
export {
  generatePlayerSecret as _generatePlayerSecret,
  deriveRoleCommitment as _deriveRoleCommitment,
  deriveActionHash as _deriveActionHash,
  deriveVoteHash as _deriveVoteHash,
  shuffleArray as _shuffleArray,
};
