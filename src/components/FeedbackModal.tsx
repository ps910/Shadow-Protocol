import React, { useState } from 'react';
import { FeedbackSubmission } from '../data/preprodUsers';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackSubmission) => void;
  playerHandle?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  playerHandle = 'cadet_player',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('Gameplay & Navigation');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = [
    'Gameplay & Navigation',
    'ZK Proof Latency',
    'Mini-Game Difficulty',
    'Station Sabotages',
    '1AM Wallet / UX',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    // Simulate generating ZK feedback receipt
    await new Promise((r) => setTimeout(r, 600));

    const mockNullifier = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newFeedback: FeedbackSubmission = {
      id: 'fb_' + Date.now(),
      userHandle: playerHandle,
      rating,
      category,
      comment,
      timestamp: new Date().toISOString(),
      nullifierHash: mockNullifier,
    };

    onSubmit(newFeedback);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setComment('');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '560px',
          width: '90%',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(124, 92, 252, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 92, 252, 0.2)',
          background: 'linear-gradient(135deg, rgba(16, 18, 35, 0.95), rgba(9, 10, 20, 0.98))',
        }}
      >
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', letterSpacing: '2px' }}>
                  LEVEL 5 • COMMUNITY FEEDBACK
                </div>
                <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.4rem', color: '#fff' }}>
                  Rate Your Experience
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Your feedback is cryptographically bound to your Preprod session receipt. Help refine Shadow Protocol for mainnet.
            </p>

            {/* Star Rating */}
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Overall Satisfaction
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      color: (hoverRating !== null ? star <= hoverRating : star <= rating) ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
                      transition: 'transform 0.15s ease, color 0.15s ease',
                      transform: (hoverRating !== null ? star <= hoverRating : star <= rating) ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Feedback Category
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      border: category === cat ? '1px solid var(--accent-purple)' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: category === cat ? 'rgba(124, 92, 252, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: category === cat ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Detailed Insights & Recommendations
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? What was confusing about Aegis Station or ZK alibis? What should we adjust?"
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Privacy notice banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.75rem',
                color: '#10b981',
                marginBottom: '1.5rem',
              }}
            >
              <span>🔒</span>
              <span>
                <strong>Shielded Telemetry:</strong> Submission generates a single-use ZK nullifier to prevent double-voting without disclosing your role or wallet balance.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.2rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.4rem',
                  background: 'linear-gradient(135deg, #7c5cfc, #00f0ff)',
                  opacity: isSubmitting || !comment.trim() ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Minting ZK Receipt...' : 'Submit Feedback →'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              Feedback Verified & Logged!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your feedback has been committed to the Level 5 Community Playtest ledger with verified ZK nullifier.
            </p>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                marginBottom: '1.5rem',
                wordBreak: 'break-all',
              }}
            >
              ZK-RECEIPT: {rating}★ [{category}] verified
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.5rem' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
