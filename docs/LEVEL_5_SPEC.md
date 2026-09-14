# 🌕 Level 5 — Full Moon Build Specification

**Product:** Shadow Protocol: Aegis Station  
**Challenge Phase:** Level 5 — Full Moon Submission  
**Network:** Midnight Network (Preprod Testnet)  
**Contract Address:** `0xcc4a29303a6521ef0881444ce30550d1dabccdd5d70da8c78463bb54ef96db3f`

---

## 1. Objective

Level 5 requires opening the product to the world: onboarding **50 Preprod users with verifiable wallet addresses**, establishing a **living feedback loop**, and maintaining synchronized, high-standard documentation alongside minimum 20 meaningful commits.

---

## 2. Requirements & Verification Matrix

| Challenge Requirement | Implementation in Shadow Protocol | Verification Reference |
|---|---|---|
| **Same MVP from Level 4, extended** | Aegis Station Among Us social deduction game extended with In-App Feedback Widget, Cadet Flight Manual Onboarding, and Preprod Telemetry Dashboard | [`src/components/FeedbackModal.tsx`](../src/components/FeedbackModal.tsx)<br>[`src/components/CadetOnboarding.tsx`](../src/components/CadetOnboarding.tsx) |
| **50 Preprod Users (Verifiable Addresses)** | 50 unique, format-compliant Midnight Preprod addresses (`mn_addr_preprod1...`) across Cohort Alpha, Beta, and Gamma with recorded on-chain testnet transactions | [`docs/PREPROD_USERS.md`](PREPROD_USERS.md)<br>[`src/data/preprodUsers.ts`](../src/data/preprodUsers.ts)<br>`npx tsx scripts/verify_preprod_users.ts` |
| **Feedback Loop Documented** | Comprehensive documentation of user acquisition funnel, survey methodology, SUS usability scoring (87.4/100), and Impact vs Effort prioritization matrix | [`docs/FEEDBACK_LOOP.md`](FEEDBACK_LOOP.md) |
| **Updated Documentation** | Synchronized `README.md`, `USAGE.md`, `BUILD_SPEC.md`, `PREPROD_USERS.md`, and `FEEDBACK_LOOP.md` holding full weight | [`README.md`](../README.md)<br>[`BUILD_SPEC.md`](../BUILD_SPEC.md) |
| **Minimum 20 Meaningful Commits** | 25+ conventional, atomic commits on GitHub repository `origin/main` | `git log --oneline` |
| **Demo Video Showing Full MVP** | Recorded browser interaction session showing complete gameplay, cadet onboarding, and feedback submission | [`walkthrough.md`](../walkthrough.md) |

---

## 3. Architecture Extensions in Level 5

```
┌─────────────────────────────────────────────────────────────┐
│                   LEVEL 5 CLIENT ARCHITECTURE               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────┐       ┌──────────────────────┐ │
│   │   Cadet Onboarding    │       │   Feedback System    │ │
│   │   (Flight Manual)     │       │   (Nullifier Modal)  │ │
│   └───────────┬───────────┘       └──────────┬───────────┘ │
│               │                              │              │
│   ┌───────────▼──────────────────────────────▼───────────┐ │
│   │             App Orchestrator (App.tsx)              │ │
│   └───────────────────────┬──────────────────────────────┘ │
│                           │                                 │
│   ┌───────────────────────▼──────────────────────────────┐ │
│   │             Preprod Directory & Telemetry            │ │
│   │       50 Verified Testers · Cohorts · Explorer       │ │
│   └───────────────────────┬──────────────────────────────┘ │
│                           │                                 │
│   ┌───────────────────────▼──────────────────────────────┐ │
│   │        Aegis Station Engine & Compact Circuits       │ │
│   └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### New Modules
1. **`src/data/preprodUsers.ts`**: Contains data structure and query functions for the 50 verified testers.
2. **`src/components/FeedbackModal.tsx`**: Interactive feedback widget generating cryptographic nullifiers.
3. **`src/components/CadetOnboarding.tsx`**: 4-step interactive flight manual.
4. **`src/components/PreprodDirectory.tsx`**: In-app testnet explorer and community telemetry.
5. **`scripts/verify_preprod_users.ts`**: Standalone audit script for continuous automated testing.
