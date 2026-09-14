/**
 * Shadow Protocol — Privacy Verification Layer
 *
 * Simulates Midnight's on-chain verification logic in the browser.
 * In production, these verifications run as Compact circuits on Midnight.
 *
 * This module demonstrates the CONCEPT of what Midnight does:
 * - Verify a player is authorized to perform an action WITHOUT revealing their role
 * - Verify a vote is from a valid player WITHOUT revealing who voted for whom
 * - Verify game outcomes are legitimate WITHOUT exposing private game state
 *
 * PRIVACY ARCHITECTURE:
 * ┌──────────────────────────────────────────┐
 * │            SHADOW PROTOCOL               │
 * │                  │                        │
 * │     PUBLIC STATE    │    PRIVATE STATE    │
 * │     • Round number  │    • Player role    │
 * │     • Alive/dead    │    • Night actions  │
 * │     • Vote counts   │    • Vote targets   │
 * │     • Game outcome  │    • Secrets         │
 * │     • Events        │    • Investigations  │
 * │          │                    │            │
 * │          └─────────┬──────────┘            │
 * │                    │                       │
 * │           VERIFICATION LAYER              │
 * │         (Midnight ZK Circuits)             │
 * │                    │                       │
 * │          Valid action ✓                    │
 * │          Game state update                 │
 * └──────────────────────────────────────────┘
 */

import { Role, ActionType, isActionValid, isEvil } from './roles';

// ─── Verification Results ────────────────────────────────────────────
export interface VerificationResult {
  valid: boolean;
  proof: string;         // Simulated proof hash
  publicOutput: string;  // What the verifier learns (not the private data)
  timestamp: Date;
}

// ─── Action Authorization Verification ──────────────────────────────
/**
 * Verify that a player is authorized to perform an action.
 *
 * IN PRODUCTION (Midnight):
 * - The player's role is a private witness
 * - The circuit checks: isActionValid(witness.role, action)
 * - The output is: YES/NO (valid or not)
 * - The verifier NEVER learns the role
 *
 * This function simulates that process.
 */
export async function verifyActionAuthorization(
  playerSecret: Uint8Array,
  role: Role,
  action: ActionType,
): Promise<VerificationResult> {
  const valid = isActionValid(role, action);

  // Generate a simulated proof hash
  const proofPayload = new TextEncoder().encode(
    `action-proof:${action}:${valid}:${Date.now()}`
  );
  const combined = new Uint8Array(playerSecret.length + proofPayload.length);
  combined.set(playerSecret);
  combined.set(proofPayload, playerSecret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    valid,
    proof,
    publicOutput: valid
      ? 'Action authorized ✓ (role verified without disclosure)'
      : 'Action denied ✗ (unauthorized for this role)',
    timestamp: new Date(),
  };
}

// ─── Vote Validity Verification ─────────────────────────────────────
/**
 * Verify that a vote is from a valid, alive player.
 *
 * IN PRODUCTION (Midnight):
 * - The voter's identity is a private witness
 * - The circuit checks: isAlive(voter) && !hasVoted(voter)
 * - The output is: valid vote count increment
 * - The verifier NEVER learns who voted for whom
 */
export async function verifyVoteValidity(
  voterSecret: Uint8Array,
  targetId: string,
  round: number,
): Promise<VerificationResult> {
  const proofPayload = new TextEncoder().encode(
    `vote-proof:${targetId}:${round}:${Date.now()}`
  );
  const combined = new Uint8Array(voterSecret.length + proofPayload.length);
  combined.set(voterSecret);
  combined.set(proofPayload, voterSecret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    valid: true,
    proof,
    publicOutput: 'Vote recorded ✓ (voter identity protected)',
    timestamp: new Date(),
  };
}

// ─── Win Condition Verification ─────────────────────────────────────
/**
 * Verify the game outcome is legitimate.
 *
 * IN PRODUCTION (Midnight):
 * - All player roles are private witnesses
 * - The circuit counts alive evil vs alive good
 * - The output is: winner (good/evil) + verified ✓
 * - Individual roles are never disclosed until game over
 */
export async function verifyWinCondition(
  players: Array<{ secret: Uint8Array; role: Role; isAlive: boolean }>,
): Promise<VerificationResult> {
  const aliveEvil = players.filter(p => p.isAlive && isEvil(p.role)).length;
  const aliveGood = players.filter(p => p.isAlive && !isEvil(p.role)).length;

  let winner: 'good' | 'evil' | 'ongoing';
  if (aliveEvil === 0) winner = 'good';
  else if (aliveEvil >= aliveGood) winner = 'evil';
  else winner = 'ongoing';

  // Generate proof from all player data
  const allSecrets = players.flatMap(p => Array.from(p.secret));
  const payload = new TextEncoder().encode(`win-check:${winner}:${Date.now()}`);
  const combined = new Uint8Array(allSecrets.length + payload.length);
  combined.set(new Uint8Array(allSecrets));
  combined.set(payload, allSecrets.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    valid: true,
    proof,
    publicOutput: winner === 'ongoing'
      ? 'Game continues — no win condition met'
      : `Game over — ${winner === 'good' ? 'Guardians & Civilians' : 'Assassin'} win ✓ (verified)`,
    timestamp: new Date(),
  };
}

// ─── Privacy Summary ─────────────────────────────────────────────────
/**
 * Generate a summary of what is public vs private in the current game state.
 * Used by the Privacy Dashboard component.
 */
export interface PrivacySummary {
  publicData: Array<{ label: string; value: string; icon: string }>;
  privateData: Array<{ label: string; description: string; icon: string }>;
  proofCount: number;
  zkVerifications: number;
}

export function generatePrivacySummary(
  round: number,
  alivePlayers: number,
  totalPlayers: number,
  actionsSubmitted: number,
  votesSubmitted: number,
): PrivacySummary {
  return {
    publicData: [
      { label: 'Round Number', value: `${round}`, icon: '🔢' },
      { label: 'Alive Players', value: `${alivePlayers}/${totalPlayers}`, icon: '👥' },
      { label: 'Actions Submitted', value: `${actionsSubmitted}`, icon: '📋' },
      { label: 'Votes Cast', value: `${votesSubmitted}`, icon: '🗳️' },
    ],
    privateData: [
      { label: 'Player Roles', description: 'Each player\'s role is known only to themselves', icon: '🎭' },
      { label: 'Night Actions', description: 'Who targeted whom is never revealed', icon: '🌙' },
      { label: 'Vote Targets', description: 'Individual votes are private — only totals are shown', icon: '🔒' },
      { label: 'Investigation Results', description: 'Only the Investigator sees their findings', icon: '🔎' },
      { label: 'Player Secrets', description: '32-byte cryptographic secrets never leave the device', icon: '🔑' },
    ],
    proofCount: actionsSubmitted + votesSubmitted,
    zkVerifications: actionsSubmitted + votesSubmitted,
  };
}
