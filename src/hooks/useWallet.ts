import { useState, useCallback } from 'react';
import { NETWORK_CONFIG } from '../config';

export interface WalletState {
  connected: boolean;
  address: string | null;
  networkId: string | null;
  balance?: string;
  error?: string | null;
}

/**
 * Custom hook for Lace / Midnight Wallet integration
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    networkId: null,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setWallet((prev) => ({ ...prev, error: null }));

    try {
      const midnight = (window as unknown as { midnight?: { lace?: { connect: (netId: string) => Promise<any> } } })?.midnight;

      if (midnight?.lace) {
        // Official Lace wallet DApp connector API
        const api = await midnight.lace.connect(NETWORK_CONFIG.networkId);
        const address = await api.getUnshieldedAddress?.() || await api.getAddress?.();

        setWallet({
          connected: true,
          address: address || '0x...lace-connected',
          networkId: NETWORK_CONFIG.networkId,
          error: null,
        });
      } else {
        // Missing wallet: Display explicit error to user — no silent fallback
        setWallet((prev) => ({
          ...prev,
          connected: false,
          address: null,
          networkId: null,
          error:
            'Midnight Lace wallet extension not detected. Please install the Midnight Lace wallet extension and connect to Midnight Preprod.',
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wallet connection failed';
      console.error('Wallet connection error:', err);
      setWallet((prev) => ({ ...prev, error: message }));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      networkId: null,
      error: null,
    });
  }, []);

  return {
    wallet,
    isConnecting,
    connect,
    disconnect,
  };
}
