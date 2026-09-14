/**
 * Network configuration for Shadow Protocol on Midnight Network
 * (Preprod / Preview / Local)
 *
 * The contract address will be updated after deploying shadow_protocol.compact.
 * The existing ZKGate contract address is preserved for reference.
 */
export const NETWORK_CONFIG = {
  networkId: (import.meta.env.VITE_MIDNIGHT_NETWORK as string) || 'preprod',
  indexerUrl:
    (import.meta.env.VITE_MIDNIGHT_INDEXER_URL as string) ||
    'https://indexer.preprod.midnight.network',
  nodeUrl:
    (import.meta.env.VITE_MIDNIGHT_NODE_URL as string) ||
    'https://rpc.preprod.midnight.network',
  proofServerUrl:
    (import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL as string) ||
    'http://localhost:6300',
  contractAddress:
    (import.meta.env.VITE_CONTRACT_ADDRESS as string) ||
    '0xcc4a29303a6521ef0881444ce30550d1dabccdd5d70da8c78463bb54ef96db3f',
};

/**
 * Game configuration defaults
 */
export const GAME_CONFIG = {
  /** Default number of players in a game */
  defaultPlayerCount: 6,
  /** Maximum number of rounds before good team wins by default */
  maxRounds: 5,
  /** Game title */
  title: 'Shadow Protocol',
  /** Game subtitle */
  subtitle: 'Privacy-First Social Deduction',
};

/**
 * Previous ZKGate contract address (preserved for reference)
 */
export const LEGACY_CONTRACT = {
  address: '0xcc4a29303a6521ef0881444ce30550d1dabccdd5d70da8c78463bb54ef96db3f',
  name: 'ZKGate Private Allowlist',
};
