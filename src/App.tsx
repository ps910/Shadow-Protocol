import { useState, useRef, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { AllowlistManager } from './components/AllowlistManager';
import { MembershipProver } from './components/MembershipProver';
import { StatsDisplay } from './components/StatsDisplay';
import { AccessLog } from './components/AccessLog';
import { PrivacyModel } from './components/PrivacyModel';
import { NETWORK_CONFIG } from './config';
import {
  createProviderConfig,
  callAddMember,
  callProveMembership,
  fetchContractState,
} from './midnightProvider';
import { deriveCommitment, generateMemberSecret } from '../contract/witnesses';

export interface WalletState {
  connected: boolean;
  address: string | null;
  networkId: string | null;
}

export interface ContractState {
  deployed: boolean;
  address: string | null;
  memberCount: number;
  verifiedCount: number;
  allowlistName: string;
}

export interface LogEntry {
  id: string;
  nullifier: string;
  txHash?: string | null;
  timestamp: Date;
  type: 'add_member' | 'prove_membership';
}

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    networkId: null,
  });

  const [contract, setContract] = useState<ContractState>({
    deployed: true,
    address: NETWORK_CONFIG.contractAddress,
    memberCount: 0,
    verifiedCount: 0,
    allowlistName: 'ZKGate Beta Access',
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [proofStatus, setProofStatus] = useState<'idle' | 'generating' | 'verified' | 'failed'>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  // Wallet API reference for circuit calls
  const walletApiRef = useRef<any>(null);

  const handleWalletApi = (api: any) => {
    walletApiRef.current = api;
  };

  // Attempt to fetch on-chain state from the Midnight Preprod indexer
  useEffect(() => {
    const fetchState = async () => {
      try {
        const config = createProviderConfig();
        const state = await fetchContractState(config);
        setContract((prev) => ({
          ...prev,
          memberCount: state.memberCount,
          verifiedCount: state.verifiedCount,
          allowlistName: state.allowlistName || prev.allowlistName,
        }));
      } catch {
        // Indexer may be unreachable in development; contract state will
        // update after successful circuit calls
      }
    };
    fetchState();
  }, []);

  const addLogEntry = (type: LogEntry['type'], nullifier: string, txHash?: string | null) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      nullifier,
      txHash,
      timestamp: new Date(),
      type,
    }, ...prev]);
  };

  /**
   * Add a member to the allowlist via the addMember circuit call.
   * Submits the commitment as an on-chain transaction through Lace.
   */
  const handleAddMember = async () => {
    setTxError(null);

    if (!walletApiRef.current) {
      setTxError('Wallet not connected. Please connect Lace wallet first.');
      return;
    }

    try {
      // Generate a new member secret and derive commitment
      const secret = generateMemberSecret();
      const commitmentBytes = await deriveCommitment(secret);
      const commitmentHex = '0x' + Array.from(commitmentBytes)
        .map(b => b.toString(16).padStart(2, '0')).join('');

      // Submit circuit call to Midnight Preprod via Lace
      const config = createProviderConfig();
      const result = await callAddMember(walletApiRef.current, config, commitmentBytes);

      if (result.success) {
        setContract(prev => ({
          ...prev,
          memberCount: prev.memberCount + 1,
        }));
        addLogEntry('add_member', commitmentHex, result.txHash);
      } else {
        setTxError(result.error || 'Failed to submit addMember transaction');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'addMember transaction failed';
      setTxError(message);
    }
  };

  /**
   * Generate a ZK proof of membership and submit it on-chain.
   *
   * The proof server generates the ZK-SNARK locally using the member's
   * secret as a private witness. The secret NEVER leaves the browser.
   * Only the proof and nullifier go on-chain.
   */
  const handleProveMembership = async () => {
    setProofStatus('generating');
    setTxError(null);

    if (!walletApiRef.current) {
      setTxError('Wallet not connected. Please connect Lace wallet first.');
      setProofStatus('failed');
      setTimeout(() => setProofStatus('idle'), 5000);
      return;
    }

    try {
      // Load or generate member secret from local storage
      let memberSecret: Uint8Array;
      const storedSecret = localStorage.getItem('zkgate_member_secret');

      if (storedSecret) {
        const hex = storedSecret.startsWith('0x') ? storedSecret.slice(2) : storedSecret;
        memberSecret = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
      } else {
        memberSecret = generateMemberSecret();
        const hex = Array.from(memberSecret).map((b) => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('zkgate_member_secret', '0x' + hex);
      }

      // Submit the proveMembership circuit call to Midnight Preprod.
      // The proof server generates the ZK-SNARK locally, then Lace
      // signs and broadcasts the transaction to the sequencer.
      const config = createProviderConfig();
      const result = await callProveMembership(walletApiRef.current, config, memberSecret);

      if (result.success) {
        setContract(prev => ({
          ...prev,
          verifiedCount: prev.verifiedCount + 1,
        }));
        addLogEntry('prove_membership', result.nullifier || result.txHash || 'verified', result.txHash);
        setProofStatus('verified');
      } else {
        setTxError(result.error || 'Proof verification failed on Midnight Preprod');
        setProofStatus('failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Proof generation failed';
      setTxError(message);
      setProofStatus('failed');
    }

    // Reset status after delay
    setTimeout(() => setProofStatus('idle'), 5000);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">🛡️</div>
          <div>
            <div className="app-logo-text">ZKGate</div>
            <div className="app-logo-subtitle">Private Allowlist on Midnight</div>
          </div>
        </div>
        <WalletConnect wallet={wallet} setWallet={setWallet} onWalletApi={handleWalletApi} />
      </header>

      {/* Hero */}
      <section className="hero animate-fade-in">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Midnight Network · Preprod
        </div>
        <h1>Private Allowlist Access</h1>
        <p className="hero-subtitle">
          Prove you belong — without revealing who you are.
          Zero-knowledge proofs ensure your membership stays private.
        </p>
        <div className="privacy-indicator" style={{ display: 'inline-flex' }}>
          <span className="privacy-shield">🔒</span>
          ZK-Protected · No Identity Disclosure
        </div>
      </section>

      {/* Transaction Error Banner */}
      {txError && (
        <section className="section" style={{ padding: '0 var(--space-lg)' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md) var(--space-lg)',
            color: 'var(--color-error, #ef4444)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}>
            <span>⚠️</span>
            <span>{txError}</span>
            <button
              onClick={() => setTxError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="section animate-slide-up animate-delay-1">
        <StatsDisplay contract={contract} />
      </section>

      {/* Main Grid */}
      <section className="section grid grid-2 animate-slide-up animate-delay-2">
        <AllowlistManager
          wallet={wallet}
          contract={contract}
          onAddMember={handleAddMember}
        />
        <MembershipProver
          wallet={wallet}
          proofStatus={proofStatus}
          onProveMembership={handleProveMembership}
        />
      </section>

      {/* Access Log */}
      <section className="section animate-slide-up animate-delay-3">
        <AccessLog logs={logs} />
      </section>

      {/* Privacy Model */}
      <section className="section animate-slide-up animate-delay-4">
        <PrivacyModel />
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noopener">
            Midnight Network
          </a>{' '}
          · Zero-Knowledge Privacy ·{' '}
          Contract: <code>{contract.address}</code>
        </p>
      </footer>
    </div>
  );
}
