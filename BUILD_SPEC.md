# Shadow Protocol — Build Specification

## Overview

Shadow Protocol is a privacy-first multiplayer social deduction game built on Midnight Network.
This document describes the implementation architecture and build requirements.

## Contract: `shadow_protocol.compact`

### Privacy Architecture
```
PUBLIC LEDGER STATE:
├── gamePhase          Uint<8>          Current game phase
├── roundNumber        Counter          Round counter
├── playerCount        Counter          Total players
├── playerCommitments  Map<Field, Bool> Player commitment hashes
├── aliveStatus        Map<Field, Bool> Alive/dead tracking
├── usedActionNullifiers Map<Field, Bool> Double-action prevention
├── usedVoteNullifiers Map<Field, Bool> Double-vote prevention
├── voteTally          Map<Field, U64>  Vote counts
├── gameOutcome        Uint<8>          Final result
└── gameName           Opaque<string>   Game title

PRIVATE WITNESSES:
├── playerSecret()     Bytes<32>        Player identity key
├── playerRole()       Bytes<32>        Role assignment
└── actionTarget()     Bytes<32>        Night action target
```

### Circuits
| Circuit            | Purpose                                    | Privacy Guarantee                              |
|-------------------|--------------------------------------------|------------------------------------------------|
| joinGame          | Register player with commitment            | Secret stays local                             |
| submitNightAction | Submit encrypted night action              | Role and target stay private                   |
| submitVote        | Submit encrypted vote                      | Vote target stays private                      |
| updateGamePhase   | Transition game phase                      | Phase is public (deliberate disclosure)        |
| setGameOutcome    | Record final result                        | Outcome is public                              |
| advanceRound      | Increment round counter                    | Round is public                                |

## Frontend Architecture

### Components
| Component          | Purpose                                    |
|-------------------|--------------------------------------------|
| App.tsx           | Game flow orchestrator                     |
| AegisStationView  | 2D spatial station map & room navigation   |
| MiniGameModal     | Terminal mini-games with ZK nullifier receipts |
| EmergencyMeeting  | Casualty alerts, room alibis, debate logs  |
| CadetOnboarding   | Level 5: 4-step interactive Flight Manual  |
| FeedbackModal     | Level 5: Community feedback widget with ZK nullifiers |
| PreprodDirectory  | Level 5: 50 Preprod user explorer & telemetry |
| GameLobby         | Pre-game lobby, player list, rules         |
| RoleReveal        | Secret role assignment animation           |
| VotingPhase       | Shielded vote submission + result tally    |
| GameOver          | Victory screen + full role reveal          |
| PrivacyDashboard  | Real-time public vs private comparison     |
| PlayerCard        | Reusable player avatar card                |
| WalletConnect     | 1AM Wallet connection                     |

### Game Engine (src/game/)
| Module              | Purpose                                  |
|--------------------|------------------------------------------|
| roles.ts           | Role definitions, action validation      |
| stationMap.ts      | Aegis Station 7 rooms, room beacon hashes|
| tasks.ts           | Mini-games & single-use task nullifiers  |
| sabotage.ts        | Reactor meltdown & comms blackout timers |
| gameEngine.ts      | Game state machine, all transitions      |
| privacyVerifier.ts | Privacy verification simulation          |

## Build Commands

```bash
npm install          # Install dependencies
npm run compile      # Compile Compact contract
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run automated tests
npx tsx scripts/verify_preprod_users.ts # Run 50-user Preprod audit
```

## Test Coverage

- 40+ tests across multiple test suites
- Tests cover: Aegis Station mechanics, mini-games, sabotages, room alibis, crypto primitives, role validation, 50 preprod users, feedback loop, UI rendering
- All tests run in CI on every push

## Deployment

1. Compile contract: `npm run compile`
2. Start proof server: `docker run -p 6300:6300 midnightnetwork/proof-server`
3. Deploy: `npm run deploy -- --network preprod`
4. Fund wallet at faucet when prompted
5. Update `VITE_CONTRACT_ADDRESS` in `.env` or `config.ts`

