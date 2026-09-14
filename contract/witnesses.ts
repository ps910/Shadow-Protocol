/**
 * Witness Providers for Shadow Protocol & ZKGate
 *
 * Witnesses are functions that provide private inputs to Compact circuits.
 * They run LOCALLY on the user's device and NEVER leave the browser.
 *
 * SHADOW PROTOCOL WITNESSES:
 * - playerSecret: The player's 32-byte identity key
 * - playerRole:   The player's assigned role (encoded as bytes)
 * - actionTarget: The player's night action target
 *
 * ZKGATE WITNESSES (preserved for backwards compatibility):
 * - memberSecret: The member's secret key for allowlist verification
 */

import { Role } from '../src/game/roles';

// ─── Local State Types ──────────────────────────────────────────────

/** ZKGate local state (original) */
export interface LocalState {
  /** The member's secret key — stored only in local browser storage */
  secret: Uint8Array;
}

/** Shadow Protocol local state */
export interface GameLocalState {
  /** The player's 32-byte identity secret */
  playerSecret: Uint8Array;
  /** The player's assigned role */
  playerRole: Role;
  /** The current action target (player ID encoded as bytes) */
  actionTarget: string;
  /** Active task secret for verifiable mini-game completion */
  taskSecret?: Uint8Array;
}

// ─── ZKGate Witness Provider (Original) ─────────────────────────────

/**
 * Create a witness provider bound to the user's local state (ZKGate).
 *
 * @param localState - The local private state containing the member's secret
 * @returns Witness functions that the Compact runtime can call during proof generation
 */
export function createWitnessProvider(localState: LocalState) {
  return {
    /**
     * memberSecret witness — called by the proveMembership circuit
     *
     * Returns the member's 32-byte secret key from local state.
     * This value NEVER appears on-chain or in any ZK proof output.
     * The circuit only uses it to compute hashes internally.
     */
    memberSecret: (): Uint8Array => {
      if (!localState.secret || localState.secret.length !== 32) {
        throw new Error(
          'Member secret not found in local state. ' +
          'Please ensure you have registered as a member first.'
        );
      }
      return localState.secret;
    },
  };
}

// ─── Shadow Protocol Witness Provider ────────────────────────────────

/**
 * Create a witness provider for Shadow Protocol game circuits.
 *
 * Provides private witnesses:
 * 1. playerSecret — 32-byte identity key (NEVER on-chain)
 * 2. playerRole   — Encoded role assignment (NEVER on-chain)
 * 3. actionTarget — Action target (NEVER on-chain)
 * 4. taskSecret   — Task authorization witness (NEVER on-chain)
 *
 * @param gameState - The player's local private game state
 */
export function createGameWitnessProvider(gameState: GameLocalState) {
  return {
    /**
     * playerSecret witness — the player's private identity key.
     * Used to derive commitments and nullifiers.
     */
    playerSecret: (): Uint8Array => {
      if (!gameState.playerSecret || gameState.playerSecret.length !== 32) {
        throw new Error(
          'Player secret not found. Please join a game first.'
        );
      }
      return gameState.playerSecret;
    },

    /**
     * playerRole witness — the player's assigned role.
     * Used to validate that the player is authorized to perform an action.
     * Encoded as 32-byte padded string for circuit compatibility.
     */
    playerRole: (): Uint8Array => {
      if (!gameState.playerRole) {
        throw new Error('Player role not assigned yet.');
      }
      return encodeRoleAsBytes(gameState.playerRole);
    },

    /**
     * actionTarget witness — the player's chosen target.
     * Used in night actions without revealing who targeted whom.
     */
    actionTarget: (): Uint8Array => {
      return new TextEncoder().encode(
        gameState.actionTarget.padEnd(32, '\0')
      ).slice(0, 32);
    },

    /**
     * taskSecret witness — the private task preimage.
     * Used to generate task completion nullifiers.
     */
    taskSecret: (): Uint8Array => {
      return gameState.taskSecret || gameState.playerSecret;
    },
  };
}

// ─── Crypto Utility Functions ────────────────────────────────────────

/**
 * Generate a random 32-byte secret for a new member/player.
 * This secret should be stored securely in local browser storage.
 */
export function generateMemberSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Generate a random 32-byte secret for a game player.
 * Alias for generateMemberSecret with game-specific naming.
 */
export function generatePlayerSecret(): Uint8Array {
  return generateMemberSecret();
}

/**
 * Derive a commitment from a secret.
 * The commitment is what gets added to the allowlist/game (public).
 * The secret stays private.
 *
 * NOTE: In the actual contract, this is done by persistentHash.
 * This TypeScript version is for local preview/testing only.
 */
export async function deriveCommitment(secret: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', secret as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a role commitment from a player's secret and role.
 * roleCommitment = SHA-256(secret || roleBytes)
 *
 * This binds the player's identity to their role cryptographically.
 * The commitment goes on-chain; the role stays private.
 */
export async function deriveRoleCommitment(
  secret: Uint8Array,
  role: Role,
): Promise<Uint8Array> {
  const roleBytes = encodeRoleAsBytes(role);
  const combined = new Uint8Array(secret.length + roleBytes.length);
  combined.set(secret);
  combined.set(roleBytes, secret.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive an action hash for a night action.
 * actionHash = SHA-256(secret || action || target || round)
 *
 * The hash commits to the action without revealing its contents.
 */
export async function deriveActionHash(
  secret: Uint8Array,
  action: string,
  target: string,
  round: number,
): Promise<Uint8Array> {
  const payload = new TextEncoder().encode(`${action}:${target}:${round}`);
  const combined = new Uint8Array(secret.length + payload.length);
  combined.set(secret);
  combined.set(payload, secret.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a vote hash for a voting action.
 * voteHash = SHA-256(secret || "vote:" || target || round)
 */
export async function deriveVoteHash(
  secret: Uint8Array,
  target: string,
  round: number,
): Promise<Uint8Array> {
  const payload = new TextEncoder().encode(`vote:${target}:${round}`);
  const combined = new Uint8Array(secret.length + payload.length);
  combined.set(secret);
  combined.set(payload, secret.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a nullifier from a secret.
 * nullifier = SHA-256("nullifier:" || secret)
 *
 * Nullifiers prevent replay attacks while remaining unlinkable
 * to the player's identity.
 */
export async function deriveNullifier(secret: Uint8Array): Promise<Uint8Array> {
  const prefix = new TextEncoder().encode('nullifier:');
  const combined = new Uint8Array(prefix.length + secret.length);
  combined.set(prefix);
  combined.set(secret, prefix.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Encode a Role enum value as a 32-byte padded Uint8Array.
 * Used for circuit witness compatibility.
 */
function encodeRoleAsBytes(role: Role): Uint8Array {
  const bytes = new Uint8Array(32);
  const encoded = new TextEncoder().encode(role);
  bytes.set(encoded.slice(0, 32));
  return bytes;
}
