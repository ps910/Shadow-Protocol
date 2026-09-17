import React, { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '../App';

interface Props {
  wallet: WalletState;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  onWalletApi?: (api: any) => void;
}

/**
 * Safely extracts a string address from whatever structure the wallet returns
 * (handles { unshieldedAddress: string }, { address: string }, or plain string).
 */
export function extractWalletAddress(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, any>;
    if (typeof obj.unshieldedAddress === 'string') return obj.unshieldedAddress;
    if (typeof obj.address === 'string') return obj.address;
    if (typeof obj.shieldedAddress === 'string') return obj.shieldedAddress;
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.length > 5) return val;
    }
  }
  return String(raw);
}

/**
 * WalletConnect — Handles 1AM Wallet connection and disconnection
 *
 * When running on Midnight Preprod, this connects to the 1AM Wallet
 * via the DApp Connector API (window.midnight['1am'] / window.midnight.oneAm).
 */
export function WalletConnect({ wallet, setWallet, onWalletApi }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletMissing, setWalletMissing] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    setWalletMissing(false);

    try {
      // Check if the Midnight DApp connector is available (1AM Wallet primary, Lace fallback)
      const midnight = (window as any).midnight;
      const oneAm = midnight?.['1am'] ?? midnight?.oneAm ?? (window as any)['1am'];
      const provider = oneAm ?? midnight?.lace;

      if (provider) {
        // Real 1AM Wallet connection on Midnight Preprod with 25s timeout
        const connectPromise = provider.connect('preprod');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out. Open 1AM Wallet to approve connection.')), 25000)
        );

        const api = (await Promise.race([connectPromise, timeoutPromise])) as any;

        let rawAddress: any = null;
        try {
          rawAddress = await api.getUnshieldedAddress?.();
        } catch (e) {
          console.warn('getUnshieldedAddress failed, trying getAddress:', e);
        }

        if (!rawAddress) {
          try {
            rawAddress = await api.getAddress?.();
          } catch (e) {
            console.warn('getAddress fallback failed:', e);
          }
        }

        const address = extractWalletAddress(rawAddress);

        if (!address) {
          throw new Error('1AM Wallet connected but returned no address. Ensure 1AM Wallet is configured for Midnight Preprod.');
        }

        // Pass the wallet API handle up for circuit calls
        onWalletApi?.(api);

        setWallet({
          connected: true,
          address,
          networkId: 'preprod',
        });
      } else {
        // 1AM Wallet extension not found — show clear error to user with install link
        setWalletMissing(true);
        setError(
          '1AM Wallet extension not detected. ' +
          'Please install 1AM Wallet and switch to the Midnight Preprod network.',
        );
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      console.error('Wallet connection failed:', err);

      // Detect network mismatch and surface a friendly message
      const isNetworkMismatch =
        /network\s*mismatch/i.test(raw) ||
        /mainnet.*preprod|preprod.*mainnet/i.test(raw);

      if (isNetworkMismatch) {
        setError(
          'Network mismatch. Wallet is on mainnet, requested preprod. ' +
          'Switch networks in 1AM and try again.',
        );
      } else {
        setError(raw);
      }
    } finally {
      setConnecting(false);
    }
  }, [onWalletApi, setWallet]);

  // Listen for global connect requests from game start buttons
  useEffect(() => {
    const handleGlobalTrigger = () => {
      if (!wallet.connected && !connecting) {
        handleConnect();
      }
    };
    window.addEventListener('trigger-1am-connect', handleGlobalTrigger);
    return () => window.removeEventListener('trigger-1am-connect', handleGlobalTrigger);
  }, [wallet.connected, connecting, handleConnect]);

  const handleDisconnect = () => {
    onWalletApi?.(null);
    setWallet({
      connected: false,
      address: null,
      networkId: null,
    });
    setError(null);
    setWalletMissing(false);
  };

  if (wallet.connected) {
    const displayAddress = typeof wallet.address === 'string'
      ? (wallet.address.length > 20
          ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-6)}`
          : wallet.address)
      : 'Connected';

    return (
      <div className="wallet-bar">
        <span className="badge badge-success">
          <span>●</span> 1AM Connected
        </span>
        <span className="wallet-address" title={typeof wallet.address === 'string' ? wallet.address : ''}>
          {displayAddress}
        </span>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleDisconnect}
          id="wallet-disconnect-btn"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      <button
        className="btn btn-primary"
        onClick={handleConnect}
        disabled={connecting}
        id="wallet-connect-btn"
      >
        {connecting ? (
          <>
            <span className="spinner"></span>
            Connecting...
          </>
        ) : (
          <>🔗 Connect 1AM Wallet</>
        )}
      </button>
      {error && (
        <div
          className="wallet-error"
          style={{
            color: 'var(--color-error, #ef4444)',
            fontSize: '0.8125rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.5rem 0.75rem',
            maxWidth: '320px',
            textAlign: 'right',
          }}
          id="wallet-error-message"
        >
          <div>⚠️ {error}</div>
          {walletMissing && (
            <a
              href="https://1am.xyz"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#38bdf8',
                textDecoration: 'underline',
                fontWeight: 600,
                display: 'inline-block',
                marginTop: '0.35rem',
                fontSize: '0.75rem',
              }}
            >
              Get 1AM Wallet (1am.xyz) ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}


