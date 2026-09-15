# How to Play Shadow Protocol

## What You Need

1. **A modern web browser** (Chrome, Firefox, Edge, or Brave)
2. **1AM Wallet** browser extension — [Install at 1am.xyz](https://1am.xyz)
   - Switch 1AM Wallet to **Midnight Preprod** network
   - Fund your wallet at the [Preprod faucet](https://faucet.preprod.midnight.network)
3. **The Shadow Protocol app** — running locally or at the live demo URL

## Step-by-Step Guide

### 1. Open the Game 🎮

Navigate to the Shadow Protocol app. You'll see the **Game Lobby** with 6 player agents ready for assignment.

### 2. Connect Your Wallet 🔗

Click **"Connect 1AM Wallet"** in the top-right corner. Approve the connection in your 1AM Wallet extension. Your Midnight Preprod address will appear.

### 3. Start the Game 🎭

Click **"Begin Shadow Protocol"**. The game will:
- Cryptographically assign a **secret role** to each player
- Generate a **commitment** (hash of secret + role) that goes on-chain
- Show **only your role** to you — no one else can see it

### 4. View Your Role 🕵️

You'll see a dramatic role reveal card showing:
- Your role (🗡️ Assassin, 🛡️ Guardian, 🔎 Investigator, or 👤 Civilian)
- Your team (Shadow Agent or Protector)
- Your objective and abilities

> 🤫 **Don't share your role!** The game only works if roles stay private.

### 5. Free-Roam Map & Terminal Tasks 🚀

Once roles are revealed, crew members enter **Aegis Station**:
- **Move between compartments**: Click connected rooms (Command, Central Hub, Reactor, Lab, Engineering, Security, Comms)
- **Launch terminal mini-games**: When standing in rooms with terminals, open the mini-game interface:
  - Hex Calibration (Reactor)
  - Power Conduit Routing (Engineering)
  - Carrier Signal Tuning (Communications)
  - Coolant Synthesis (Research Lab)
- Completing a task mints a single-use ZK nullifier that increments global station readiness on Midnight without revealing who solved it.

### 6. Sabotages & Casualties 🚨

- **Shadow Sabotages**: The Shadow team can trigger a **Reactor Meltdown** (45s countdown) or **Communications Blackout**. Crew members must rush to the designated terminals to avert disaster.
- **Casualty Reports**: Discovering a dead body or pressing the Command Deck emergency button summons all players to an Emergency Meeting.

### 7. Emergency Assembly, Alibis & Shielded Voting 🗳️

During the emergency assembly:
1. **Debate the incident**: Review procedural transcripts and casualty location.
2. **Furnish room beacon alibis**: Players can generate and verify a zero-knowledge room beacon ($T_{\text{room}} = \text{Poseidon}(s_i, \text{RoomId}, t)$) proving their location during the murder timestamp without revealing their secret key or role.
3. **Cast shielded ballot**: Every player casts a sealed vote. Only the aggregate totals are decrypted on Midnight. Ties result in no ejection, while ejections declassify the suspect's dossier.

### 8. Cadet Flight Manual & Community Feedback 📖

- **Flight Manual**: Click **"📖 Flight Manual"** in the navigation header anytime to view a 4-step interactive onboarding tutorial.
- **Give Feedback**: Click **"✍️ Give Feedback"** in the header to submit ratings, bug reports, and UX suggestions with cryptographic nullifiers.
- **Preprod Directory**: Scroll to the **Preprod Directory** section to inspect all 50 verified testers, transaction hashes, and live community telemetry.

## What Gets Proved (and What Stays Private)

### ✅ What gets proved on-chain:
- Player actions and task completions are legitimate (valid ZK nullifiers)
- Room beacons prove physical presence in a compartment without exposing secrets
- Votes are cast by real, alive players with no duplicate voting
- Final station victory state is mathematically enforced

### 🔒 What stays private:
- **Your role** — no one knows if you're the Assassin or Spy
- **Your room trajectory** — private until selectively revealed via an alibi proof
- **Your vote** — only aggregate tally totals are decrypted
- **Investigator pings** — only the investigator learns allegiance findings

## Troubleshooting

### "1AM Wallet not detected"
- Ensure the 1AM Wallet extension is installed and enabled (visit https://1am.xyz)
- Refresh the page after installing
- Check that 1AM Wallet is set to **Midnight Preprod** network

### "Action not valid for role"
- Each role can only perform specific actions
- You cannot target yourself with assassination
- You cannot target dead players

### "Already acted this round"
- Each player can only act once per round
- Wait for the next round or emergency meeting to act again

### Feedback submission confirmation
- When submitting feedback, a local ZK receipt is generated and appended to community telemetry.

