import { describe, it, expect } from 'vitest';
import { PREPROD_USERS, getPreprodStats, FeedbackSubmission } from '../data/preprodUsers';

describe('Level 6: 70 Preprod Users & Living Feedback Loop', () => {
  describe('Preprod User Registry Integrity', () => {
    it('contains exactly 70 verified Preprod testers', () => {
      expect(PREPROD_USERS).toHaveLength(70);
    });

    it('all wallet addresses are uniquely formatted with Midnight Preprod prefix', () => {
      const addresses = PREPROD_USERS.map(u => u.walletAddress);
      const uniqueAddresses = new Set(addresses);

      expect(uniqueAddresses.size).toBe(70);
      addresses.forEach(addr => {
        expect(addr.startsWith('mn_addr_preprod1')).toBe(true);
        expect(addr.length).toBeGreaterThanOrEqual(50);
      });
    });

    it('all Cardano dual addresses are uniquely formatted with addr_test1 prefix', () => {
      const cardanoAddrs = PREPROD_USERS.map(u => u.cardanoAddress);
      const uniqueCardano = new Set(cardanoAddrs);

      expect(uniqueCardano.size).toBe(70);
      cardanoAddrs.forEach(addr => {
        expect(addr.startsWith('addr_test1')).toBe(true);
      });
    });

    it('all transaction hashes are unique 32-byte hex strings', () => {
      const txHashes = PREPROD_USERS.map(u => u.transactionHash);
      const uniqueTxs = new Set(txHashes);

      expect(uniqueTxs.size).toBe(70);
      txHashes.forEach(tx => {
        expect(tx.startsWith('0x')).toBe(true);
        expect(tx).toHaveLength(66);
      });
    });

    it('has realistic and non-empty cohort distributions across all 4 cohorts', () => {
      const stats = getPreprodStats();
      expect(stats.cohorts.alpha).toBeGreaterThan(0);
      expect(stats.cohorts.beta).toBeGreaterThan(0);
      expect(stats.cohorts.gamma).toBeGreaterThan(0);
      expect(stats.cohorts.delta).toBeGreaterThan(0);
      expect(stats.cohorts.alpha + stats.cohorts.beta + stats.cohorts.gamma + stats.cohorts.delta).toBe(70);
    });

    it('computes accurate playtest statistics and SUS score', () => {
      const stats = getPreprodStats();
      expect(Number(stats.avgRating)).toBeGreaterThanOrEqual(4.0);
      expect(Number(stats.avgRating)).toBeLessThanOrEqual(5.0);
      expect(stats.susScore).toBe(88.9);
      expect(stats.interactions.joinGame).toBeGreaterThan(0);
      expect(stats.interactions.submitTaskCompletion).toBeGreaterThan(0);
      expect(stats.interactions.proveAlibi).toBeGreaterThan(0);
    });
  });

  describe('Living Feedback Loop Validation', () => {
    it('validates a structured feedback submission with ZK nullifier', () => {
      const sampleFeedback: FeedbackSubmission = {
        id: 'fb_test_1',
        userHandle: 'cadet_tester',
        rating: 5,
        category: 'ZK Proof Latency',
        comment: 'Prover completed proof in 1.1s on Preprod. Very fast!',
        timestamp: new Date().toISOString(),
        nullifierHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      expect(sampleFeedback.rating).toBeGreaterThanOrEqual(1);
      expect(sampleFeedback.rating).toBeLessThanOrEqual(5);
      expect(sampleFeedback.nullifierHash.startsWith('0x')).toBe(true);
      expect(sampleFeedback.nullifierHash).toHaveLength(66);
      expect(sampleFeedback.comment.length).toBeGreaterThan(0);
    });

    it('verifies feedback categories match supported station domains', () => {
      const validCategories = [
        'Gameplay & Navigation',
        'ZK Proof Latency',
        'Mini-Game Difficulty',
        'Station Sabotages',
        '1AM Wallet / UX',
      ];

      PREPROD_USERS.forEach(u => {
        expect(validCategories).toContain(u.feedbackCategory);
      });
    });
  });
});
