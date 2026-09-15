import { useState } from 'react';
import type { WalletState } from '../App';

interface Props {
  wallet: WalletState;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  onWalletApi?: (api: any) => void;
}

/**
 * WalletConnect — Handles 1AM Wallet connection and disconnection
 *
 * When running on Midnight Preprod, this connects to the 1AM Wallet
 * via the DApp Connector API (window.midnight['1am'] / window.midnight.oneAm).
 *
 * If the 1AM Wallet extension is not installed, an error message is displayed
 * to the user prompting them to install it from https://1am.xyz.
 */
export function WalletConnect({ wallet, setWallet, onWalletApi }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Check if the Midnight DApp connector is available (1AM Wallet primary, Lace fallback)
      const midnight = (window as any).midnight;
      const oneAm = midnight?.['1am'] ?? midnight?.oneAm ?? (window as any)['1am'];
      const provider = oneAm ?? midnight?.lace;

      if (provider) {
        // Real 1AM Wallet connection on Midnight Preprod
        const api = await provider.connect('preprod');
        const address = await api.getUnshieldedAddress?.() ?? await api.getAddress?.();

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
        setError(
          '1AM Wallet extension not detected. ' +
          'Please install 1AM Wallet (https://1am.xyz) ' +
          'and switch to the Midnight Preprod network.',
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet connection failed';
      console.error('Wallet connection failed:', err);
      setError(message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onWalletApi?.(null);
    setWallet({
      connected: false,
      address: null,
      networkId: null,
    });
    setError(null);
  };

  if (wallet.connected) {
    return (
      <div className="wallet-bar">
        <span className="badge badge-success">
          <span>●</span> Connected
        </span>
        <span className="wallet-address">{wallet.address}</span>
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
        </div>
      )}
    </div>
  );
}
