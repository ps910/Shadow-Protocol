import { useState } from 'react';

interface ChemicalMixingGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Reagent {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const REAGENTS: Reagent[] = [
  { id: 'reagent-1', name: 'Cobalt-60', color: '#38bdf8', icon: '🧪' },
  { id: 'reagent-2', name: 'Xenon-135', color: '#a855f7', icon: '⚗️' },
  { id: 'reagent-3', name: 'Tritium', color: '#10b981', icon: '🧪' },
  { id: 'reagent-4', name: 'Heavy Water', color: '#f59e0b', icon: '🧴' },
];

export function ChemicalMixingGame({ onComplete, onCancel }: ChemicalMixingGameProps) {
  const targetOrder = ['reagent-1', 'reagent-3', 'reagent-2', 'reagent-4'];
  const [addedReagents, setAddedReagents] = useState<string[]>([]);
  const [errorFlash, setErrorFlash] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReagentClick = (id: string) => {
    if (isSuccess || addedReagents.includes(id)) return;

    const nextIndex = addedReagents.length;
    if (targetOrder[nextIndex] === id) {
      const nextAdded = [...addedReagents, id];
      setAddedReagents(nextAdded);
      if (nextAdded.length === targetOrder.length) {
        setIsSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 600);
      }
    } else {
      setErrorFlash(true);
      setTimeout(() => {
        setAddedReagents([]);
        setErrorFlash(false);
      }, 400);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: '#a855f7',
        marginBottom: 'var(--space-sm)',
        letterSpacing: '0.1em'
      }}>
        COOLANT REAGENT SYNTHESIS
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
        Synthesize coolant by adding reagents in stoichiometric balance:
      </p>

      {/* Recipe Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xl)',
        background: 'rgba(5, 8, 17, 0.8)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        border: errorFlash ? '1px solid var(--shadow)' : '1px solid var(--border)'
      }}>
        {targetOrder.map((id, idx) => {
          const reagent = REAGENTS.find(r => r.id === id)!;
          const isAdded = idx < addedReagents.length;
          return (
            <div
              key={id}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: isAdded ? `${reagent.color}22` : 'rgba(255, 255, 255, 0.03)',
                border: isAdded ? `1px solid ${reagent.color}` : '1px solid var(--border)',
                color: isAdded ? reagent.color : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{reagent.icon}</span>
              <span>{reagent.name.split('-')[0]}</span>
              {isAdded && <span style={{ color: 'var(--protocol)' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Interactive Flask / Vials */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', maxWidth: '340px', margin: '0 auto var(--space-xl)' }}>
        {REAGENTS.map(r => {
          const isUsed = addedReagents.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => handleReagentClick(r.id)}
              disabled={isUsed || isSuccess}
              className="btn btn-secondary"
              style={{
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                border: `1px solid ${r.color}55`,
                background: isUsed ? `${r.color}22` : 'transparent',
                opacity: isUsed ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: '1.75rem' }}>{r.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: r.color }}>{r.name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel Task
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isSuccess ? 'var(--protocol)' : 'var(--text-muted)' }}>
          {isSuccess ? '✓ SYNTHESIS COMPLETE' : `${addedReagents.length} / 4 REAGENTS ADDED`}
        </span>
      </div>
    </div>
  );
}
