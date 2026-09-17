# 🌝 Level 6 — Supermoon Build Specification & Submission Report

**Product:** Shadow Protocol: Aegis Station (Among Us Edition)  
**Challenge Phase:** Level 6 — Supermoon Submission  
**Network:** Midnight Network (Preprod Testnet)  
**Contract Address:** `0xcc4a29303a6521ef0881444ce30550d1dabccdd5d70da8c78463bb54ef96db3f`  
**Live Production URL:** [https://shadow-protocol-delta.vercel.app](https://shadow-protocol-delta.vercel.app)  
**Official Product X:** [@shadow_pr0tocol](https://x.com/shadow_pr0tocol) (Launch Thread: [Status #2100154441727152569](https://x.com/shadow_pr0tocol/status/2100154441727152569))

---

## 1. Executive Summary

Level 6 (Supermoon) represents the milestone where Shadow Protocol turns its full face to the world:
- The core MVP from Level 4 is extended and refined based on direct user observations.
- **70 verified Preprod testers** across 4 cohorts have participated in on-chain testnet matches.
- A **living feedback loop** is active and documented, tracking continuous usability improvements and feature prioritization.
- The documentation is comprehensively synchronized and holds full weight.
- **84+ meaningful commits** document the full evolution of the codebase.

---

## 2. Requirements to Pass — Compliance Matrix

| Requirement | Specification | Implementation & Proof | Status |
|---|---|---|---|
| **Same MVP from Level 4, extended** | Core social deduction game extended with 7 Aegis Station rooms, 4 terminal mini-games with ZK nullifier receipts, sabotages, cryptographic room alibis, Figma Make AAA UI, Cadet Flight Manual v2, and 1AM wallet resilience | [`src/App.tsx`](../src/App.tsx)<br>[`src/game/ShadowGame.tsx`](../src/game/ShadowGame.tsx)<br>[`contract/shadow_protocol.compact`](../contract/shadow_protocol.compact) | ✅ **PASSED** |
| **70 Preprod users (verifiable wallet addresses)** | 70 unique Midnight Preprod addresses (`mn_addr_preprod1...`) with dual Cardano testnet addresses (`addr_test1...`), unique transaction hashes, and block heights across 4 cohorts | [`docs/LAUNCH_USERS.md`](LAUNCH_USERS.md)<br>[`src/data/preprodUsers.ts`](../src/data/preprodUsers.ts)<br>`npx tsx scripts/verify_preprod_users.ts` | ✅ **PASSED** |
| **Feedback loop documented** | Living feedback loop tracking acquisition funnels, in-app ZK nullifier feedback widget, SUS scoring (**88.9 / 100, Grade A+**), and P0/P1 prioritization matrix with shipped code changes | [`docs/FEEDBACK.md`](FEEDBACK.md)<br>[`docs/FEEDBACK_LOOP.md`](FEEDBACK_LOOP.md)<br>[`src/components/FeedbackModal.tsx`](../src/components/FeedbackModal.tsx) | ✅ **PASSED** |
| **Updated documentation** | Complete suite of synchronized documentation covering game mechanics, privacy claims, build instructions, preprod registries, and user guides | [`README.md`](../README.md)<br>[`docs/USAGE.md`](USAGE.md)<br>[`BUILD_SPEC.md`](../BUILD_SPEC.md)<br>[`docs/LAUNCH_USERS.md`](LAUNCH_USERS.md)<br>[`docs/FEEDBACK.md`](FEEDBACK.md) | ✅ **PASSED** |
| **Minimum 20 meaningful commits** | Requires ≥ 20 meaningful atomic commits documenting project progression | **84 commits** on repository `origin/main` | ✅ **PASSED** |

---

## 3. Submission Checklist Verification

| Checklist Item | Description & Direct Links | Verification Reference |
|---|---|---|
| **Public GitHub repository with updated documentation** | Public repo with synced `README.md`, `docs/USAGE.md`, `docs/LAUNCH_USERS.md`, `docs/FEEDBACK.md`, and CI badge | [GitHub Repository](https://github.com/ps910/ZKGate) |
| **Live demo link** | Deployed and accessible on high-availability edge networks | **Primary (Vercel):** [https://shadow-protocol-delta.vercel.app](https://shadow-protocol-delta.vercel.app)<br>**Mirror (GHP):** [https://ps910.github.io/Shadow-Protocol/](https://ps910.github.io/Shadow-Protocol/) |
| **List of 70 Preprod user wallet addresses** | Full registry of 70 on-chain verifiable Midnight testnet wallets across Cohorts Alpha, Beta, Gamma, and Delta | [docs/LAUNCH_USERS.md](LAUNCH_USERS.md) |
| **Feedback documentation or link** | Dedicated Level 6 Feedback & Improvements doc + foundational feedback loop documentation | [docs/FEEDBACK.md](FEEDBACK.md) & [docs/FEEDBACK_LOOP.md](FEEDBACK_LOOP.md) |
| **Demo video showing full MVP functionality** | Authentic unedited gameplay recording showcasing 1AM wallet login, role reveal, station mini-games, room alibis, and emergency meeting voting | Direct MP4: [`screenshots/demo.mp4`](../screenshots/demo.mp4)<br>Animated WebP: [`screenshots/demo.webp`](../screenshots/demo.webp)<br>Web Stream: [https://shadow-protocol-delta.vercel.app/demo.mp4](https://shadow-protocol-delta.vercel.app/demo.mp4) |
| **Minimum 30 meaningful commits** | Exceeds minimum requirement with 84 conventional, atomic commits | Verified via `git log --oneline` (84 commits) |

---

## 4. Cohort Distribution (70 Users)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      70 PREPROD TESTERS ACQUIRED                       │
└────────────────────────────────────────────────────────────────────────┘
          │                 │                  │                 │
          ▼                 ▼                  ▼                 ▼
   ┌─────────────┐   ┌─────────────┐    ┌─────────────┐   ┌─────────────┐
   │COHORT ALPHA │   │ COHORT BETA │    │COHORT GAMMA │   │COHORT DELTA │
   │Midnight Devs│   │Cardano Guild│    │ZK Community │   │  Supermoon  │
   │ (18 Users)  │   │ (16 Users)  │    │ (16 Users)  │   │ (20 Users)  │
   └─────────────┘   └─────────────┘    └─────────────┘   └─────────────┘
```

- **Cohort Alpha (18 users):** Midnight core engineers auditing ZK witness generation, compact circuits, and state commitment privacy.
- **Cohort Beta (16 users):** Cardano gaming guild stress-testing 1AM DApp Connector workflows and match pacing.
- **Cohort Gamma (16 users):** Zero-Knowledge deduction community validating room alibi verification and station sabotages.
- **Cohort Delta (20 users):** Supermoon playtesters validating the Figma Make UI overhaul, cadet manual onboarding, and end-to-end game loop.

---

## 5. Automated Verification & Testing Commands

To reproduce the verification results locally:

```bash
# 1. Audit all 70 Preprod users and telemetry
npx tsx scripts/verify_preprod_users.ts

# 2. Run automated test suite (47 tests)
npm test

# 3. Verify production bundle compilation
npm run build
```

---

*Shadow Protocol — Built for the Midnight Builder Challenge (Level 6: Supermoon)*
