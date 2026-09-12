'use strict';

class HttpNetworkProvider {
  constructor(config) {
    this.networkId = config.networkId || 'preprod';
    this.indexerUrl = config.indexerUrl;
    this.nodeUrl = config.nodeUrl;
  }

  async query(graphqlQuery) {
    const res = await fetch(`${this.indexerUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphqlQuery })
    });
    if (!res.ok) throw new Error(`Network query failed: ${res.statusText}`);
    return res.json();
  }

  async submitTransaction(serializedTx) {
    const res = await fetch(`${this.nodeUrl}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx: serializedTx })
    });
    if (!res.ok) throw new Error(`Transaction submit failed: ${res.statusText}`);
    return res.json();
  }

  async getBlockHeight() {
    const data = await this.query('{ block { height } }');
    return data?.data?.block?.height ?? 0;
  }
}

function createNetworkProvider(config) {
  return new HttpNetworkProvider(config);
}

module.exports = {
  HttpNetworkProvider,
  createNetworkProvider,
  default: createNetworkProvider
};
