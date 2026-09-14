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
| GameLobby         | Pre-game lobby, player list, rules         |
| RoleReveal        | Secret role assignment animation           |
| NightPhase        | Night action panel (role-specific)         |
| DayPhase          | Night report + discussion                  |
| VotingPhase       | Private vote submission + result tally     |
| GameOver          | Victory screen + full role reveal          |
| PrivacyDashboard  | Real-time public vs private comparison     |
| PlayerCard        | Reusable player avatar card                |
| WalletConnect     | Lace wallet connection                     |

### Game Engine (src/game/)
| Module              | Purpose                                  |
|--------------------|------------------------------------------|
| roles.ts           | Role definitions, action validation      |
| gameEngine.ts      | Game state machine, all transitions      |
| privacyVerifier.ts | Privacy verification simulation          |

## Build Commands

```bash
npm install          # Install dependencies
npm run compile      # Compile Compact contract
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run 20+ tests
npm run deploy       # Deploy contract to Preprod
```

## Test Coverage

- 20+ tests across 7 test suites
- Tests cover: crypto primitives, role validation, game logic, win conditions, state separation, UI rendering
- All tests run in CI on every push

## Deployment

1. Compile contract: `npm run compile`
2. Start proof server: `docker run -p 6300:6300 midnightnetwork/proof-server`
3. Deploy: `npm run deploy -- --network preprod`
4. Fund wallet at faucet when prompted
5. Update `VITE_CONTRACT_ADDRESS` in `.env` or `config.ts`
