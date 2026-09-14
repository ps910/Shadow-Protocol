# 🕵️ Shadow Protocol

![Shadow Protocol — CI Pipeline](https://github.com/ps910/ZKGate/actions/workflows/ci.yml/badge.svg)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Shadow%20Protocol-success?style=flat&logo=github)](https://ps910.github.io/ZKGate/)
[![Build Spec](https://img.shields.io/badge/Spec-Level%204%20Build%20Spec-8b5cf6?style=flat)](BUILD_SPEC.md)
[![Network](https://img.shields.io/badge/Network-Midnight%20Preprod-7c5cfc?style=flat)](https://indexer.preprod.midnight.network)
[![Tests](https://img.shields.io/badge/Tests-25%20Passing-10b981?style=flat)](#run-tests)
[![Proposal](https://img.shields.io/badge/Product-Proposal%20Document-blue)](PROPOSAL.md)

> **A privacy-first multiplayer social deduction game on Midnight Network — where hidden roles, secret actions, and private votes are cryptographically verified without revealing the hidden information behind them.**

## 🎮 Live Demo

**👉 [https://ps910.github.io/ZKGate/](https://ps910.github.io/ZKGate/)**

## Contract Address

| Network  | Address                                                            |
|----------|--------------------------------------------------------------------|
| Preprod  | `0xcc4a29303a6521ef0881444ce30550d1dabccdd5d70da8c78463bb54ef96db3f` |

> The contract supports both the original ZKGate allowlist and the new Shadow Protocol game circuits.

## What This Product Does

Shadow Protocol is a **6-player hidden-role strategy game** where:

1. **Each player receives a secret role** (Assassin, Guardian, Investigator, or Civilian) — assigned using cryptographic randomness and stored as a private witness that never appears on-chain.

2. **Night phase**: Players perform role-specific actions in secret. The Assassin targets a player for elimination, the Guardian protects someone, and the Investigator uncovers allegiances. Midnight verifies each action is legitimate for the player's role **without revealing the role itself**.

3. **Day phase**: The results of the night are announced publicly ("someone was attacked"), but the actors remain anonymous. Players discuss and debate.

4. **Voting phase**: Each player casts a private vote. Only the aggregate vote counts are revealed — individual votes stay hidden. The player with the most votes is eliminated.

5. **Game ends** when either the Assassin is eliminated (good wins) or the Assassin gains numerical majority (evil wins).

### Why Midnight?

**If the game's hidden information were publicly visible, the game would break.** On a transparent blockchain, anyone could see who the Assassin is, making the game unplayable. Midnight's private state and zero-knowledge proofs are what make the game possible — **privacy isn't an add-on, privacy IS the gameplay mechanic.**

## Privacy Model

### What is PUBLIC (on-chain, anyone can see):
- Game phase (Lobby, Night, Day, Voting, Game Over)
- Round number
- Player count and alive/dead status
- Vote totals (aggregate counts only)
- Game outcome (who won)
- Event log (public announcements)

### What is PRIVATE (private witness, never on-chain):
- Player role assignments (Assassin, Guardian, Investigator, Civilian)
- Night action targets (who the Assassin attacked, who the Guardian protected)
- Individual vote choices (who voted for whom)
- Investigation results (only the Investigator sees their findings)
- Player secret keys (32-byte cryptographic secrets)

### What the user PROVES without revealing:
- "I am authorized to perform this action" (without revealing my role)
- "I have cast a valid vote" (without revealing my vote target)
- "The game outcome is legitimate" (without exposing individual roles)

## Privacy Claim

> **An on-chain observer** can see: 6 players joined, night actions were submitted, 3 votes were cast for Player X, and the good team won.
>
> **An on-chain observer CANNOT see**: who is the Assassin, who the Guardian protected, who the Investigator investigated, or which individual cast which vote.

## Tech Stack

- **Network**: Midnight Network (Preprod)
- **Contract Language**: Compact (compiles to ZK circuits)
- **Frontend**: React 18 + TypeScript + Vite
- **Wallet**: Lace (Midnight DApp Connector API)
- **Styling**: Custom CSS with glassmorphism, micro-animations
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions → GitHub Pages
- **Crypto**: Web Crypto API (SHA-256 commitments, nullifiers)

## Prerequisites

- **Node.js v22** or later
- **Lace wallet** browser extension (configured for Midnight Preprod)
- **Docker** (for proof server)
- **Compact compiler** (`npm install -g @midnight-ntwrk/compact-compiler`)

## Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/ps910/ZKGate.git
cd ZKGate

# 2. Install dependencies
npm install

# 3. Compile the Compact contract
npm run compile

# 4. Start the proof server (separate terminal)
docker run -p 6300:6300 midnightnetwork/proof-server

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Run Tests

```bash
# Run all tests (25 tests covering game logic, privacy, and UI)
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

| Suite                          | Tests | Description                                           |
|-------------------------------|-------|-------------------------------------------------------|
| Player Identity & Commitments | 4     | Secret generation, deterministic commitments          |
| Role Privacy                  | 4     | Role-commitment binding, action validation, teams     |
| Night Action Privacy          | 3     | Action hashes, target uniqueness, nullifier tracking  |
| Vote Privacy                  | 2     | Per-round uniqueness, vote-action unlinkability       |
| Game Engine                   | 4     | Initialization, role distribution, win conditions     |
| Public vs Private State       | 3     | State separation, player views, game-over reveal      |
| App Component                 | 5     | Branding, players, UI elements, privacy indicator     |

## CI/CD

The CI pipeline runs automatically on every push to `main` and on pull requests:

1. **Checkout** repository
2. **Install** Node.js 22 and Compact compiler
3. **Install** npm dependencies
4. **Compile** Compact contract
5. **Type check** TypeScript
6. **Run tests** (25 tests)
7. **Build** production bundle
8. **Deploy** to GitHub Pages

## Usage Guide

See [docs/USAGE.md](docs/USAGE.md) for a step-by-step guide on how to play Shadow Protocol.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                     │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  React UI   │──│ Game Engine  │──│ Privacy Layer │  │
│  │  Components │  │ (gameEngine) │  │ (verifier)    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│         │                 │                  │           │
│         └────────┬────────┘                  │           │
│                  │                           │           │
│  ┌───────────────┴───────────────────────────┴──────┐   │
│  │              WITNESS PROVIDERS                   │   │
│  │   playerSecret() · playerRole() · actionTarget() │   │
│  │         (PRIVATE — never transmitted)             │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                  ZK Proof Generation                     │
│                          │                               │
└──────────────────────────┼───────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   MIDNIGHT  │
                    │   PREPROD   │
                    │  (On-Chain) │
                    └─────────────┘
```

## License

MIT

---

*Built for the Midnight Builder Challenge — Level 4 (Waxing Gibbous)*
*"If the hidden information were public, the game breaks."*
