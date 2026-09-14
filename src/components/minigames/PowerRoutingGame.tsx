import { useState } from 'react';

interface PowerRoutingGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface NodePair {
  id: string;
  name: string;
  color: string;
  connected: boolean;
}

export function PowerRoutingGame({ onComplete, onCancel }: PowerRoutingGameProps) {
  const [nodes, setNodes] = useState<NodePair[]>([
    { id: 'alpha', name: 'Alpha (Red)', color: '#ef4444', connected: false },
    { id: 'beta', name: 'Beta (Blue)', color: '#38bdf8', connected: false },
    { id: 'gamma', name: 'Gamma (Yellow)', color: '#f59e0b', connected: false },
    { id: 'delta', name: 'Delta (Green)', color: '#10b981', connected: false },
  ]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node?.connected) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (!selectedLeft) return;
    if (selectedLeft === id) {
      // Successful connection!
      const updated = nodes.map(n => n.id === id ? { ...n, connected: true } : n);
      setNodes(updated);
      setSelectedLeft(null);

      if (updated.every(n => n.connected)) {
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    } else {
      setSelectedLeft(null);
    }
  };

  const allConnected = nodes.every(n => n.connected);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--warning)',
        marginBottom: 'var(--space-sm)',
        letterSpacing: '0.1em'
      }}>
        PRIMARY POWER CONDUIT ROUTING
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-xl)' }}>
        Click a source relay on the left, then connect to its matching terminal on the right:
      </p>

      {/* Grid of nodes */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: '380px',
        margin: '0 auto var(--space-2xl)',
        background: 'rgba(5, 8, 17, 0.8)',
        padding: 'var(--space-xl)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)'
      }}>
        {/* Left Terminals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {nodes.map(n => (
            <button
              key={`left-${n.id}`}
              onClick={() => handleLeftClick(n.id)}
              disabled={n.connected}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: selectedLeft === n.id ? `2px solid ${n.color}` : `1px solid ${n.color}55`,
                background: n.connected ? `${n.color}22` : selectedLeft === n.id ? `${n.color}33` : 'transparent',
                color: n.connected ? 'var(--text-muted)' : 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                cursor: n.connected ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: n.color }} />
              <span>{n.name.split(' ')[0]}</span>
              {n.connected && <span style={{ color: 'var(--protocol)' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Center Conduit Indicator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem'
        }}>
          <span>⚡</span>
          <span>⚡</span>
          <span>⚡</span>
        </div>

        {/* Right Terminals (scrambled order: Delta, Alpha, Gamma, Beta) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {['delta', 'alpha', 'gamma', 'beta'].map(id => {
            const n = nodes.find(node => node.id === id)!;
            return (
              <button
                key={`right-${n.id}`}
                onClick={() => handleRightClick(n.id)}
                disabled={n.connected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${n.color}55`,
                  background: n.connected ? `${n.color}22` : 'transparent',
                  color: n.connected ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  cursor: n.connected ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {n.connected && <span style={{ color: 'var(--protocol)' }}>✓</span>}
                <span>{n.name.split(' ')[0]}</span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: n.color }} />
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel Task
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: allConnected ? 'var(--protocol)' : 'var(--text-muted)' }}>
          {allConnected ? '✓ ALL CIRCUITS ENERGIZED' : `${nodes.filter(n => n.connected).length} / 4 CONDUITS ROUTED`}
        </span>
      </div>
    </div>
  );
}
