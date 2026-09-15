/**
 * Midnight Network Provider — Centralized SDK Integration
 *
 * This module wires the Midnight.js SDK for on-chain contract interaction
 * on Midnight Preprod. It uses:
 *
 * - @midnight-ntwrk/midnight-js-network-provider  — network transport layer
 * - @midnight-ntwrk/midnight-js-contracts          — contract call interface
 * - @midnight-ntwrk/compact-runtime                — compiled circuit runtime
 * - 1AM Wallet / DApp Connector API                — Midnight native wallet connector
 *
 * All proof generation runs locally in the browser via the proof server.
 * Private witness data (memberSecret) NEVER leaves the client.
 */

import { NETWORK_CONFIG } from './config';
import {
  createNetworkProvider,
  type NetworkProvider,
  type NetworkProviderConfig,
} from '@midnight-ntwrk/midnight-js-network-provider';
import type { ConnectedAPI, WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MidnightProviderConfig extends NetworkProviderConfig {
  networkId: string;
  indexerUrl: string;
  nodeUrl: string;
  proofServerUrl: string;
  contractAddress: string;
}

export interface CircuitCallResult {
  success: boolean;
  txHash: string | null;
  nullifier: string | null;
  error: string | null;
}

export interface DeployedContractState {
  memberCount: number;
  verifiedCount: number;
  allowlistRoot: string;
  allowlistName: string;
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

/**
 * Build the provider configuration from environment / defaults.
 */
export function createProviderConfig(): MidnightProviderConfig {
  return {
    networkId: NETWORK_CONFIG.networkId,
    indexerUrl: NETWORK_CONFIG.indexerUrl,
    nodeUrl: NETWORK_CONFIG.nodeUrl,
    proofServerUrl: NETWORK_CONFIG.proofServerUrl,
    contractAddress: NETWORK_CONFIG.contractAddress,
  };
}

/**
 * Instantiate the Midnight.js network provider client for Preprod.
 */
export function getNetworkProvider(config: MidnightProviderConfig): NetworkProvider {
  return createNetworkProvider({
    networkId: config.networkId,
    indexerUrl: config.indexerUrl,
    nodeUrl: config.nodeUrl,
  });
}

// ---------------------------------------------------------------------------
// Contract State Query
// ---------------------------------------------------------------------------

/**
 * Fetch the current on-chain contract state from the Midnight Preprod indexer.
 *
 * Queries the indexer GraphQL endpoint for the deployed contract's public
 * ledger state (memberCount, verifiedCount, allowlistRoot, allowlistName)
 * using the Midnight.js NetworkProvider.
 */
export async function fetchContractState(
  config: MidnightProviderConfig,
): Promise<DeployedContractState> {
  const query = `{
    contract(address: "${config.contractAddress}") {
      state {
        memberCount
        verifiedCount
        allowlistRoot
        allowlistName
      }
    }
  }`;

  const networkProvider = getNetworkProvider(config);
  const json = await networkProvider.query(query);
  const state = json?.data?.contract?.state;

  if (!state) {
    throw new Error(
      'Contract state not found on indexer. Is the contract deployed to Preprod?',
    );
  }

  return {
    memberCount: Number(state.memberCount ?? 0),
    verifiedCount: Number(state.verifiedCount ?? 0),
    allowlistRoot: state.allowlistRoot ?? '',
    allowlistName: state.allowlistName ?? '',
  };
}

// ---------------------------------------------------------------------------
// Circuit Call: addMember
// ---------------------------------------------------------------------------

/**
 * Submit an `addMember(commitment)` circuit call to the Midnight Preprod
 * sequencer via the 1AM Wallet DApp connector.
 *
 * Flow:
 * 1. Build the circuit transaction payload with the commitment.
 * 2. Request the 1AM Wallet to sign and broadcast the transaction.
 * 3. Wait for the sequencer to confirm the transaction.
 * 4. Return the transaction hash confirming the on-chain state update.
 *
 * @param walletApi  - The connected 1AM Wallet API handle
 * @param config     - Midnight provider configuration
 * @param commitment - The 32-byte SHA-256 commitment of the member's secret
 */
export async function callAddMember(
  walletApi: any,
  config: MidnightProviderConfig,
  commitment: Uint8Array,
): Promise<CircuitCallResult> {
  try {
    // Build the circuit call transaction targeting the deployed contract
    const txPayload = {
      contractAddress: config.contractAddress,
      circuit: 'addMember',
      arguments: [commitment],
      proofServerUrl: config.proofServerUrl,
    };

    // Submit the proof-bearing transaction through 1AM Wallet
    const txResult = await walletApi.submitTransaction(txPayload);

    return {
      success: true,
      txHash: txResult?.transactionHash ?? null,
      nullifier: null,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      txHash: null,
      nullifier: null,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Circuit Call: proveMembership
// ---------------------------------------------------------------------------

/**
 * Submit a `proveMembership()` circuit call to the Midnight Preprod sequencer.
 *
 * This is the core ZK proof flow:
 * 1. The witness provider supplies the member's secret from local storage.
 * 2. The Compact circuit runs in the local proof server (WASM), computing:
 *    - commitment = persistentHash(secret)
 *    - nullifier  = transientHash(secret)
 * 3. The circuit asserts the nullifier hasn't been used before.
 * 4. The ZK proof + nullifier are packaged into a transaction.
 * 5. The transaction is signed by 1AM Wallet and broadcast to Preprod.
 * 6. The sequencer verifies the proof on-chain and updates verifiedCount.
 *
 * PRIVACY: The member's secret NEVER leaves the browser. Only the proof
 * and nullifier are transmitted. The verifier learns "someone on the list
 * proved membership" but cannot determine WHO.
 *
 * @param walletApi     - The connected 1AM Wallet API handle
 * @param config        - Midnight provider configuration
 * @param memberSecret  - The member's 32-byte secret (stays local)
 */
export async function callProveMembership(
  walletApi: any,
  config: MidnightProviderConfig,
  memberSecret: Uint8Array,
): Promise<CircuitCallResult> {
  try {
    // Build the circuit call transaction.
    // The memberSecret is passed as a private witness input — it is used
    // by the local proof server to generate the ZK proof but is NEVER
    // included in the transaction payload that goes on-chain.
    const txPayload = {
      contractAddress: config.contractAddress,
      circuit: 'proveMembership',
      witnesses: {
        memberSecret: () => memberSecret,
      },
      proofServerUrl: config.proofServerUrl,
    };

    // Submit the proof-bearing transaction through 1AM Wallet.
    // The proof server generates the ZK-SNARK locally, then 1AM Wallet signs
    // and broadcasts the transaction to the Midnight Preprod sequencer.
    const txResult = await walletApi.submitTransaction(txPayload);

    // Extract the nullifier from the on-chain transaction result.
    // The nullifier is a public output of the circuit — it prevents
    // replay attacks while remaining unlinkable to the member's identity.
    const nullifierHex = txResult?.nullifier
      ? '0x' + Array.from(new Uint8Array(txResult.nullifier))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      : txResult?.transactionHash ?? null;

    return {
      success: true,
      txHash: txResult?.transactionHash ?? null,
      nullifier: nullifierHex,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      txHash: null,
      nullifier: null,
      error: message,
    };
  }
}
