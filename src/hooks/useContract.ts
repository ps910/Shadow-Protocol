import { useState, useCallback } from 'react';
import { NETWORK_CONFIG } from '../config';
import {
  createProviderConfig,
  callAddMember,
  callProveMembership,
  fetchContractState,
  type CircuitCallResult,
} from '../midnightProvider';
import { deriveCommitment, generateMemberSecret } from '../../contract/witnesses';

export interface ContractState {
  deployed: boolean;
  address: string;
  memberCount: number;
  verifiedCount: number;
  allowlistName: string;
}

export interface VerificationLog {
  id: string;
  nullifier: string;
  txHash: string | null;
  timestamp: Date;
  type: 'add_member' | 'prove_membership';
}

/**
 * Custom hook for interacting with the ZKGate Allowlist Compact contract
 * on Midnight Preprod via the Midnight.js SDK.
 *
 * All circuit calls are submitted as real on-chain transactions through
 * the Lace wallet DApp connector. Proof generation runs locally in the
 * browser proof server — the member's secret NEVER leaves the client.
 */
export function useContract() {
  const [contract, setContract] = useState<ContractState>({
    deployed: true,
    address: NETWORK_CONFIG.contractAddress,
    memberCount: 0,
    verifiedCount: 0,
    allowlistName: 'ZKGate Beta Access',
  });

  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [proofStatus, setProofStatus] = useState<'idle' | 'generating' | 'verified' | 'failed'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Refresh contract state from the Midnight Preprod indexer.
   */
  const refreshState = useCallback(async () => {
    try {
      const config = createProviderConfig();
      const state = await fetchContractState(config);
      setContract((prev) => ({
        ...prev,
        memberCount: state.memberCount,
        verifiedCount: state.verifiedCount,
        allowlistName: state.allowlistName || prev.allowlistName,
      }));
    } catch (err) {
      console.error('Failed to fetch contract state from indexer:', err);
    }
  }, []);

  /**
   * Add a member to the allowlist by submitting an addMember(commitment)
   * circuit call to the Midnight Preprod sequencer.
   *
   * Flow:
   * 1. Generate or accept a 32-byte member secret
   * 2. Derive the SHA-256 commitment
   * 3. Submit the commitment on-chain via Lace wallet
   * 4. Log the transaction result
   *
   * @param walletApi - Connected Lace wallet API handle
   * @param customCommitmentHex - Optional pre-computed commitment hex
   */
  const addMember = useCallback(async (walletApi: any, customCommitmentHex?: string) => {
    setLastError(null);

    let commitmentBytes: Uint8Array;
    let commitmentHex: string;

    if (customCommitmentHex && customCommitmentHex.startsWith('0x')) {
      // Use provided commitment
      const hex = customCommitmentHex.slice(2);
      commitmentBytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      commitmentHex = customCommitmentHex;
    } else {
      // Generate a new secret and derive commitment
      const secret = generateMemberSecret();
      commitmentBytes = await deriveCommitment(secret);
      commitmentHex = '0x' + Array.from(commitmentBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    const config = createProviderConfig();
    const result: CircuitCallResult = await callAddMember(walletApi, config, commitmentBytes);

    if (result.success) {
      setContract((prev) => ({
        ...prev,
        memberCount: prev.memberCount + 1,
      }));

      const newLog: VerificationLog = {
        id: crypto.randomUUID(),
        nullifier: commitmentHex,
        txHash: result.txHash,
        timestamp: new Date(),
        type: 'add_member',
      };

      setLogs((prev) => [newLog, ...prev]);

      // Refresh state from indexer after a short delay for sequencer confirmation
      setTimeout(() => refreshState(), 3000);
    } else {
      setLastError(result.error || 'Failed to add member on-chain');
      throw new Error(result.error || 'addMember circuit call failed');
    }

    return commitmentHex;
  }, [refreshState]);

  /**
   * Generate a ZK proof of membership and submit it on-chain.
   *
   * This is the core privacy operation:
   * 1. Load the member's secret from local browser storage
   * 2. The local proof server runs the Compact proveMembership() circuit
   * 3. The circuit computes commitment = persistentHash(secret) and
   *    nullifier = transientHash(secret) inside the ZK proof
   * 4. The proof + nullifier are submitted to Midnight Preprod
   * 5. The sequencer verifies the proof on-chain
   *
   * PRIVACY: The secret NEVER leaves the browser. The on-chain verifier
   * learns only that "someone on the list proved membership" — it
   * CANNOT determine which member did so.
   *
   * @param walletApi - Connected Lace wallet API handle
   */
  const proveMembership = useCallback(async (walletApi: any): Promise<boolean> => {
    setProofStatus('generating');
    setLastError(null);

    try {
      // Load member secret from local storage (stays on device)
      const storedSecret = localStorage.getItem('zkgate_member_secret');
      let memberSecret: Uint8Array;

      if (storedSecret) {
        const hex = storedSecret.startsWith('0x') ? storedSecret.slice(2) : storedSecret;
        memberSecret = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      } else {
        // Generate and store a new secret for first-time members
        memberSecret = generateMemberSecret();
        const hex = Array.from(memberSecret).map((b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('zkgate_member_secret', '0x' + hex);
      }

      // Submit the proveMembership circuit call to Midnight Preprod.
      // The proof server generates the ZK-SNARK locally using the secret
      // as a private witness, then Lace signs and broadcasts the transaction.
      const config = createProviderConfig();
      const result: CircuitCallResult = await callProveMembership(walletApi, config, memberSecret);

      if (result.success) {
        setContract((prev) => ({
          ...prev,
          verifiedCount: prev.verifiedCount + 1,
        }));

        const newLog: VerificationLog = {
          id: crypto.randomUUID(),
          nullifier: result.nullifier || result.txHash || 'unknown',
          txHash: result.txHash,
          timestamp: new Date(),
          type: 'prove_membership',
        };

        setLogs((prev) => [newLog, ...prev]);
        setProofStatus('verified');

        // Refresh state from indexer after sequencer confirmation
        setTimeout(() => refreshState(), 3000);
        setTimeout(() => setProofStatus('idle'), 6000);
        return true;
      } else {
        setLastError(result.error || 'Proof verification failed on-chain');
        setProofStatus('failed');
        setTimeout(() => setProofStatus('idle'), 6000);
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown proof generation error';
      console.error('Failed to generate ZK proof:', error);
      setLastError(message);
      setProofStatus('failed');
      setTimeout(() => setProofStatus('idle'), 6000);
      return false;
    }
  }, [refreshState]);

  return {
    contract,
    logs,
    proofStatus,
    lastError,
    addMember,
    proveMembership,
    refreshState,
  };
}
