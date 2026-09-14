import { describe, it, expect } from 'vitest';
import {
  generatePlayerSecret,
  deriveCommitment,
  deriveRoleCommitment,
  deriveActionHash,
  deriveVoteHash,
  deriveNullifier,
} from '../../contract/witnesses';
import { Role, ActionType, isActionValid, isEvil, isGood, getAllowedActions } from '../game/roles';
import {
  initializeGame,
  assignRoles,
  submitNightAction,
  processNightActions,
  submitVote,
  processVotes,
  checkWinCondition,
  getPublicGameState,
  getPlayerView,
  GamePhase,
} from '../game/gameEngine';

// ─── Contract & Crypto Tests ─────────────────────────────────────────

describe('Shadow Protocol — Player Identity & Commitments', () => {
  it('generates a valid 32-byte player secret', () => {
    const secret = generatePlayerSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBe(32);

    // Two secrets must be different (crypto randomness)
    const secret2 = generatePlayerSecret();
    expect(secret).not.toEqual(secret2);
  });

  it('derives a deterministic commitment from a secret', async () => {
    const secret = new Uint8Array(32).fill(42);
    const commitment1 = await deriveCommitment(secret);
    const commitment2 = await deriveCommitment(secret);

    expect(commitment1).toBeInstanceOf(Uint8Array);
    expect(commitment1.length).toBe(32);
    expect(commitment1).toEqual(commitment2);
  });

  it('produces different commitments for different secrets', async () => {
    const secret1 = new Uint8Array(32).fill(1);
    const secret2 = new Uint8Array(32).fill(2);

    const commitment1 = await deriveCommitment(secret1);
    const commitment2 = await deriveCommitment(secret2);
    expect(commitment1).not.toEqual(commitment2);
  });

  it('commitment differs from the original secret (one-way)', async () => {
    const secret = new Uint8Array(32).fill(99);
    const commitment = await deriveCommitment(secret);
    expect(commitment).not.toEqual(secret);
  });
});

describe('Shadow Protocol — Role Privacy', () => {
  it('derives role commitments that bind player to role', async () => {
    const secret = new Uint8Array(32).fill(50);

    const assassinCommitment = await deriveRoleCommitment(secret, Role.Assassin);
    const guardianCommitment = await deriveRoleCommitment(secret, Role.Guardian);

    // Same secret + different roles → different commitments
    expect(assassinCommitment).not.toEqual(guardianCommitment);
  });

  it('cannot derive the role from the commitment (one-way hash)', async () => {
    const secret = new Uint8Array(32).fill(77);
    const commitment = await deriveRoleCommitment(secret, Role.Assassin);

    // The commitment should not contain the role string
    const roleBytes = new TextEncoder().encode(Role.Assassin);
    const commitmentHex = Array.from(commitment).map(b => b.toString(16)).join('');
    const roleHex = Array.from(roleBytes).map(b => b.toString(16)).join('');
    expect(commitmentHex).not.toContain(roleHex);
  });

  it('validates correct actions for each role', () => {
    expect(isActionValid(Role.Assassin, ActionType.Assassinate)).toBe(true);
    expect(isActionValid(Role.Assassin, ActionType.Protect)).toBe(false);
    expect(isActionValid(Role.Guardian, ActionType.Protect)).toBe(true);
    expect(isActionValid(Role.Guardian, ActionType.Assassinate)).toBe(false);
    expect(isActionValid(Role.Investigator, ActionType.Investigate)).toBe(true);
    expect(isActionValid(Role.Civilian, ActionType.Hide)).toBe(true);
    expect(isActionValid(Role.Civilian, ActionType.Assassinate)).toBe(false);
  });

  it('correctly identifies team allegiance', () => {
    expect(isEvil(Role.Assassin)).toBe(true);
    expect(isEvil(Role.Guardian)).toBe(false);
    expect(isEvil(Role.Investigator)).toBe(false);
    expect(isEvil(Role.Civilian)).toBe(false);
    expect(isGood(Role.Guardian)).toBe(true);
  });
});

describe('Shadow Protocol — Night Action Privacy', () => {
  it('generates unique action hashes for different actions', async () => {
    const secret = new Uint8Array(32).fill(33);

    const hash1 = await deriveActionHash(secret, 'ASSASSINATE', 'player-1', 1);
    const hash2 = await deriveActionHash(secret, 'PROTECT', 'player-1', 1);

    expect(hash1).not.toEqual(hash2);
  });

  it('generates unique action hashes for different targets', async () => {
    const secret = new Uint8Array(32).fill(33);

    const hash1 = await deriveActionHash(secret, 'ASSASSINATE', 'player-1', 1);
    const hash2 = await deriveActionHash(secret, 'ASSASSINATE', 'player-2', 1);

    expect(hash1).not.toEqual(hash2);
  });

  it('prevents double-actions using nullifier tracking', async () => {
    const usedNullifiers = new Set<string>();

    const tryAction = async (secret: Uint8Array): Promise<boolean> => {
      const nullifier = await deriveNullifier(secret);
      const nullHex = Array.from(nullifier).map(b => b.toString(16).padStart(2, '0')).join('');
      if (usedNullifiers.has(nullHex)) return false;
      usedNullifiers.add(nullHex);
      return true;
    };

    const secret = new Uint8Array(32).fill(55);

    // First action should succeed
    expect(await tryAction(secret)).toBe(true);

    // Same secret = same nullifier = blocked
    expect(await tryAction(secret)).toBe(false);

    // Different player's secret works
    const otherSecret = new Uint8Array(32).fill(66);
    expect(await tryAction(otherSecret)).toBe(true);
  });
});

describe('Shadow Protocol — Vote Privacy', () => {
  it('generates unique vote hashes per round', async () => {
    const secret = new Uint8Array(32).fill(44);

    const vote1 = await deriveVoteHash(secret, 'player-2', 1);
    const vote2 = await deriveVoteHash(secret, 'player-2', 2);

    expect(vote1).not.toEqual(vote2);
  });

  it('vote hash differs from action hash (unlinkable)', async () => {
    const secret = new Uint8Array(32).fill(44);

    const voteHash = await deriveVoteHash(secret, 'player-2', 1);
    const actionHash = await deriveActionHash(secret, 'ASSASSINATE', 'player-2', 1);

    expect(voteHash).not.toEqual(actionHash);
  });
});

// ─── Game Engine Tests ──────────────────────────────────────────────

describe('Shadow Protocol — Game Engine', () => {
  it('initializes a 6-player game correctly', () => {
    const state = initializeGame(6);

    expect(state.players.length).toBe(6);
    expect(state.phase).toBe(GamePhase.Lobby);
    expect(state.round).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.events.length).toBeGreaterThan(0);

    // All players should be alive with secrets
    state.players.forEach(p => {
      expect(p.isAlive).toBe(true);
      expect(p.secret).toBeInstanceOf(Uint8Array);
      expect(p.secret!.length).toBe(32);
      expect(p.role).toBeNull(); // Not assigned yet
    });
  });

  it('assigns roles with correct distribution', async () => {
    const state = initializeGame(6);
    const assigned = await assignRoles(state);

    expect(assigned.phase).toBe(GamePhase.RoleReveal);
    expect(assigned.round).toBe(1);

    // Every player should have a role
    assigned.players.forEach(p => {
      expect(p.role).not.toBeNull();
      expect(p.commitment).toBeTruthy();
    });

    // Check role distribution: 1 assassin, 1 guardian, 1 investigator, 3 civilians
    const roles = assigned.players.map(p => p.role);
    expect(roles.filter(r => r === Role.Assassin).length).toBe(1);
    expect(roles.filter(r => r === Role.Guardian).length).toBe(1);
    expect(roles.filter(r => r === Role.Investigator).length).toBe(1);
    expect(roles.filter(r => r === Role.Civilian).length).toBe(3);
  });

  it('detects win condition when assassin is eliminated', () => {
    const state = initializeGame(6);
    // Simulate: all players alive, assassin at index 0
    state.players[0].role = Role.Assassin;
    state.players[1].role = Role.Guardian;
    state.players[2].role = Role.Investigator;
    state.players[3].role = Role.Civilian;
    state.players[4].role = Role.Civilian;
    state.players[5].role = Role.Civilian;

    // Kill the assassin
    state.players[0].isAlive = false;

    const result = checkWinCondition(state);
    expect(result.winner).toBe('good');
    expect(result.message).toContain('Guardians');
  });

  it('detects win condition when evil reaches majority', () => {
    const state = initializeGame(6);
    state.players[0].role = Role.Assassin;
    state.players[1].role = Role.Guardian;
    state.players[2].role = Role.Investigator;
    state.players[3].role = Role.Civilian;
    state.players[4].role = Role.Civilian;
    state.players[5].role = Role.Civilian;

    // Kill enough good players (4 dead, 1 evil + 1 good alive)
    state.players[1].isAlive = false;
    state.players[2].isAlive = false;
    state.players[3].isAlive = false;
    state.players[4].isAlive = false;

    const result = checkWinCondition(state);
    expect(result.winner).toBe('evil');
    expect(result.message).toContain('Assassin');
  });
});

describe('Shadow Protocol — Public vs Private State', () => {
  it('public game state does NOT expose player roles', async () => {
    const state = initializeGame(6);
    const assigned = await assignRoles(state);

    const publicState = getPublicGameState(assigned);

    // Public state should NOT contain role information
    publicState.players.forEach(p => {
      expect(p).not.toHaveProperty('secret');
      expect((p as any).role).toBeUndefined();
    });
  });

  it('player view shows only own role and investigation results', async () => {
    const state = initializeGame(6);
    const assigned = await assignRoles(state);

    const player0View = getPlayerView(assigned, 'player-0');
    const player1View = getPlayerView(assigned, 'player-1');

    // Each player should see their own role
    expect(player0View.role).toBe(assigned.players[0].role);
    expect(player1View.role).toBe(assigned.players[1].role);

    // Player views should not contain other players' roles
    expect(player0View.publicState.players[1]).not.toHaveProperty('role');
  });

  it('game over state DOES expose all roles (full reveal)', async () => {
    const state = initializeGame(6);
    const assigned = await assignRoles(state);
    const gameOver = { ...assigned, phase: GamePhase.GameOver };

    const publicState = getPublicGameState(gameOver);

    // At game over, roles are revealed
    publicState.players.forEach(p => {
      expect(p.role).toBeDefined();
    });
  });
});
