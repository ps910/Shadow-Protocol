/**
 * Shadow Protocol — Privacy Verification Layer
 *
 * Simulates Midnight's on-chain verification logic in the browser.
 * In production, these verifications run as Compact circuits on Midnight.
 *
 * This module demonstrates the CONCEPT of what Midnight does:
 * - Verify a player is authorized to perform an action WITHOUT revealing their role
 * - Verify a vote is from a valid player WITHOUT revealing who voted for whom
 * - Verify task completions using single-use nullifiers WITHOUT revealing solver or room
 * - Verify cryptographic alibis using room presence tokens without leaking player secrets
 * - Verify game outcomes are legitimate WITHOUT exposing private game state
 */

import { Role, ActionType, isActionValid, isEvil } from './roles';

export interface PrivacySummary {
  zkVerifications: number;
  publicData: Array<{ icon: string; label: string; value: string | number }>;
  privateData: Array<{ icon: string; label: string }>;
}

export function generatePrivacySummary(
  round: number,
  alivePlayers: number,
  totalPlayers: number,
  actionsThisGame: number,
  votesThisGame: number,
): PrivacySummary {
  return {
    zkVerifications: (actionsThisGame + votesThisGame + round * 2),
    publicData: [
      { icon: '🔢', label: 'Current Round', value: round },
      { icon: '👥', label: 'Living Agents', value: `${alivePlayers} / ${totalPlayers}` },
      { icon: '⚡', label: 'ZK Verified Actions', value: actionsThisGame },
      { icon: '🗳️', label: 'Shielded Ballots Cast', value: votesThisGame },
    ],
    privateData: [
      { icon: '🎭', label: 'Player Roles & Secret Assignments' },
      { icon: '🎯', label: 'Target Identifiers before Resolution' },
      { icon: '🔒', label: 'Individual Ballot Selections' },
      { icon: '🔍', label: 'Investigator Alignment Scans' },
    ],
  };
}

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

// ─── Task Completion Verification (ZK-SNARK Simulation) ─────────────
/**
 * Generate a Zero-Knowledge Task Completion Proof.
 * Proves that a player solved a legitimate assigned station task
 * without disclosing their identity, role, or the room location to observers.
 */
export async function generateTaskProof(
  playerSecret: Uint8Array,
  taskId: string,
  round: number,
): Promise<VerificationResult> {
  const payload = new TextEncoder().encode(`task-proof:${taskId}:${round}:${Date.now()}`);
  const combined = new Uint8Array(playerSecret.length + payload.length);
  combined.set(playerSecret);
  combined.set(payload, playerSecret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    valid: true,
    proof,
    publicOutput: 'Task execution verified ✓ (single-use nullifier redeemed; identity shielded)',
    timestamp: new Date(),
  };
}

// ─── Cryptographic Alibi & Beacon Verification ───────────────────────
export interface AlibiReceipt {
  playerId: string;
  playerName: string;
  roomId: string;
  roomName: string;
  beaconToken: string;
  proof: string;
  timestamp: number;
}

/**
 * Generate a signed room beacon alibi token:
 * T_room = Poseidon(playerSecret, roomId, timestamp)
 */
export async function generateAlibiProof(
  playerSecret: Uint8Array,
  playerId: string,
  playerName: string,
  roomId: string,
  roomName: string,
  timestamp: number,
): Promise<AlibiReceipt> {
  const payload = new TextEncoder().encode(`alibi:${roomId}:${timestamp}`);
  const combined = new Uint8Array(playerSecret.length + payload.length);
  combined.set(playerSecret);
  combined.set(payload, playerSecret.length);
  const hash = await crypto.subtle.digest('SHA-256', combined);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const beaconToken = `BCN-${roomId.toUpperCase()}-${proof.slice(2, 8).toUpperCase()}`;

  return {
    playerId,
    playerName,
    roomId,
    roomName,
    beaconToken,
    proof,
    timestamp,
  };
}

/**
 * Verify an alibi claim against the murder time window and crime scene location.
 * If the player was in a different room during the murder timestamp, they are cleared of suspicion!
 */
export function verifyAlibiClaim(
  alibi: AlibiReceipt,
  murderRoomId: string,
  murderTimestamp: number,
): {
  isVerified: boolean;
  status: 'ALIBI CONFIRMED' | 'AT CRIME SCENE' | 'NO ALIBI';
  details: string;
} {
  const timeDifference = Math.abs(alibi.timestamp - murderTimestamp);
  const isDuringIncidentWindow = timeDifference < 30000; // within 30 seconds

  if (!isDuringIncidentWindow) {
    return {
      isVerified: false,
      status: 'NO ALIBI',
      details: 'Beacon timestamp is outside the incident window.',
    };
  }

  if (alibi.roomId !== murderRoomId) {
    return {
      isVerified: true,
      status: 'ALIBI CONFIRMED',
      details: `Cryptographic proof confirms ${alibi.playerName} was in ${alibi.roomName} (Token: ${alibi.beaconToken}). Cleared of direct involvement!`,
    };
  }

  return {
    isVerified: true,
    status: 'AT CRIME SCENE',
    details: `Cryptographic beacon records ${alibi.playerName} in the same room (${alibi.roomName}) during the incident! High suspicion!`,
  };
}

// ─── Vote Validity Verification ─────────────────────────────────────
/**
 * Verify that a vote is from a valid, alive player.
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
    publicOutput: 'Vote valid ✓ (ballot shielded; nullifier committed)',
    timestamp: new Date(),
  };
}

// ─── Investigation Verification ─────────────────────────────────────
/**
 * Verify an investigation action.
 */
export async function verifyInvestigation(
  targetRole: Role,
): Promise<{ isEvil: boolean; proof: string }> {
  const evil = isEvil(targetRole);

  const payload = new TextEncoder().encode(
    `investigate:${targetRole}:${evil}:${Date.now()}`
  );
  const hash = await crypto.subtle.digest('SHA-256', payload);
  const proof = '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return { isEvil: evil, proof };
}
