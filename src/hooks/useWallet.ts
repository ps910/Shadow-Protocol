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
 * Custom hook for 1AM Wallet / Midnight Wallet integration
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
      const midnight = (window as unknown as {
        midnight?: {
          '1am'?: { connect: (netId: string) => Promise<any> };
          oneAm?: { connect: (netId: string) => Promise<any> };
          lace?: { connect: (netId: string) => Promise<any> };
        };
        '1am'?: { connect: (netId: string) => Promise<any> };
      })?.midnight;

      const oneAm = midnight?.['1am'] ?? midnight?.oneAm ?? (window as any)['1am'];
      const provider = oneAm ?? midnight?.lace;

      if (provider) {
        // Official 1AM Wallet DApp connector API
        const api = await provider.connect(NETWORK_CONFIG.networkId);
        let rawAddress: any = null;
        try {
          rawAddress = await api.getUnshieldedAddress?.();
        } catch {
          rawAddress = await api.getAddress?.();
        }
        if (!rawAddress) {
          rawAddress = await api.getAddress?.();
        }

        let address = '';
        if (typeof rawAddress === 'string') {
          address = rawAddress;
        } else if (rawAddress && typeof rawAddress === 'object') {
          address = rawAddress.unshieldedAddress || rawAddress.address || rawAddress.shieldedAddress || '';
        }

        setWallet({
          connected: true,
          address: address || '0x...1am-connected',
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
            '1AM Wallet extension not detected. Please install 1AM Wallet (https://1am.xyz) and connect to Midnight Preprod.',
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
