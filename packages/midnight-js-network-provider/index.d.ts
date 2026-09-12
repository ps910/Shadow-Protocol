/**
 * Type declarations for @midnight-ntwrk/midnight-js-network-provider
 */

export interface NetworkProviderConfig {
  networkId: string;
  indexerUrl: string;
  nodeUrl: string;
}

export interface NetworkProvider {
  readonly networkId: string;
  readonly indexerUrl: string;
  readonly nodeUrl: string;
  query(graphqlQuery: string): Promise<any>;
  submitTransaction(serializedTx: string): Promise<{ txHash: string }>;
  getBlockHeight(): Promise<number>;
}

export declare class HttpNetworkProvider implements NetworkProvider {
  readonly networkId: string;
  readonly indexerUrl: string;
  readonly nodeUrl: string;
  constructor(config: NetworkProviderConfig);
  query(graphqlQuery: string): Promise<any>;
  submitTransaction(serializedTx: string): Promise<{ txHash: string }>;
  getBlockHeight(): Promise<number>;
}

export declare function createNetworkProvider(config: NetworkProviderConfig): NetworkProvider;
export default createNetworkProvider;
