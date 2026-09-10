import { useState } from 'react';
import type { WalletState } from '../App';

interface Props {
  wallet: WalletState;
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>;
  onWalletApi?: (api: any) => void;
}

/**
 * WalletConnect — Handles Lace wallet connection and disconnection
 *
 * When running on Midnight Preprod, this connects to the Lace wallet
 * via the DApp Connector API (window.midnight.lace).
 *
 * If the Lace extension is not installed, an error message is displayed
 * to the user prompting them to install it — no silent fallback.
 */
export function WalletConnect({ wallet, setWallet, onWalletApi }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Check if the Midnight DApp connector is available (Lace extension)
      const midnight = (window as any).midnight;

      if (midnight?.lace) {
        // Real Lace wallet connection on Midnight Preprod
        const api = await midnight.lace.connect('preprod');
        const address = await api.getUnshieldedAddress?.() ?? await api.getAddress?.();

        if (!address) {
          throw new Error('Lace wallet connected but returned no address. Ensure Lace is configured for Midnight Preprod.');
        }

        // Pass the wallet API handle up for circuit calls
        onWalletApi?.(api);

        setWallet({
          connected: true,
          address,
          networkId: 'preprod',
        });
      } else {
        // Lace extension not found — show clear error to user
        setError(
          'Midnight Lace wallet extension not detected. ' +
          'Please install the Lace wallet (midnight.network/wallet) ' +
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
          <>🔗 Connect Lace Wallet</>
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
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
