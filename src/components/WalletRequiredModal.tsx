interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletRequiredModal({ isOpen, onClose, onConnect }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        className="modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#0d111d',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.15)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          1AM Wallet Required to Play
        </h2>
        <p
          style={{
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.925rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
        >
          Shadow Protocol relies on Midnight Network's private state witnesses and client-side zero-knowledge proofs.
          <br /><br />
          <strong>You cannot play without connecting your 1AM Wallet.</strong> Please connect your 1AM Wallet on the Midnight Preprod network to start or join a match.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onConnect();
            }}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            🔗 Connect 1AM Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
