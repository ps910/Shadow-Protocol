# Product Proposal — Shadow Protocol

## What is the product, and who uses it?

**Shadow Protocol** is a privacy-first multiplayer social deduction game built on Midnight Network.

**Target Users:**
- **Blockchain gamers** looking for games where privacy is more than a buzzword — it's the core mechanic
- **Social deduction fans** (Among Us, Mafia, Werewolf players) who want a verifiable, cheat-proof experience
- **Midnight ecosystem builders** who want to see how Midnight's private state enables entirely new categories of applications
- **Web3 enthusiasts** interested in practical zero-knowledge proof applications beyond finance

**The Problem:** On transparent blockchains, social deduction games are impossible — the hidden information that makes the game fun is visible to everyone. Shadow Protocol demonstrates that Midnight's privacy model enables an entirely new category of applications: games where the rules can be verified without revealing the secrets.

## Why Midnight specifically?

**Midnight is not optional for this product. It is essential.**

On a transparent blockchain like Ethereum or Solana:
- Everyone can see who the Assassin is → game is unplayable
- Everyone can see who voted for whom → strategic voting is impossible
- Everyone can see night actions → deception and investigation are meaningless

**Midnight enables:**
1. **Private role assignment** — roles are stored as private witnesses, never appearing on-chain
2. **Verifiable actions** — a player can prove "I am authorized to assassinate" without revealing "I am the Assassin"
3. **Private voting** — individual votes are commitments; only aggregate totals are disclosed
4. **Fair game outcomes** — the game result is verifiable without exposing individual roles

No other blockchain can do this. Privacy IS the gameplay mechanic.

## Data Model

| Data Point              | Type            | Disclosed To    |
|------------------------|-----------------|-----------------|
| Game phase             | Public ledger   | Everyone        |
| Round number           | Public ledger   | Everyone        |
| Player count           | Public ledger   | Everyone        |
| Alive/dead status      | Public ledger   | Everyone        |
| Vote totals            | Public ledger   | Everyone        |
| Game outcome           | Public ledger   | Everyone        |
| Player role            | Private witness | Player only     |
| Night action target    | Private witness | No one          |
| Individual vote        | Private witness | No one          |
| Investigation result   | Private witness | Investigator    |
| Player secret key      | Private witness | No one          |
| Role commitment        | Public ledger   | Everyone (hash) |
| Action nullifier       | Public ledger   | Everyone (hash) |

## Mainnet Feasibility

**YES — this is feasible to reach Mainnet by Level 6.**

The core game logic runs client-side with Midnight verifying commitments and nullifiers. The contract is lightweight (commitments + maps), and proof generation for the simple circuits (join, action, vote) is fast.

**Mainnet path:**
1. **Level 4** (current): Single-browser simulation proving the privacy mechanics
2. **Level 5**: Add WebSocket-based real-time multiplayer with 6+ beta testers
3. **Level 6**: Deploy to Mainnet with matchmaking, leaderboards, and tournament mode
