# How to Play Shadow Protocol

## What You Need

1. **A modern web browser** (Chrome, Firefox, Edge, or Brave)
2. **Lace wallet** browser extension — [Install here](https://www.lace.io/)
   - Switch Lace to **Midnight Preprod** network
   - Fund your wallet at the [Preprod faucet](https://faucet.preprod.midnight.network)
3. **The Shadow Protocol app** — running locally or at the live demo URL

## Step-by-Step Guide

### 1. Open the Game 🎮

Navigate to the Shadow Protocol app. You'll see the **Game Lobby** with 6 player agents ready for assignment.

### 2. Connect Your Wallet 🔗

Click **"Connect Lace Wallet"** in the top-right corner. Approve the connection in your Lace extension. Your Midnight Preprod address will appear.

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

### 5. Night Phase 🌙

During the night, each player performs a secret action based on their role:

| Role          | Night Action                              |
|--------------|-------------------------------------------|
| 🗡️ Assassin   | Choose a player to eliminate              |
| 🛡️ Guardian   | Choose a player to protect from attack    |
| 🔎 Investigator| Choose a player to investigate            |
| 👤 Civilian   | Hide and hope for the best                |

Select your target (if applicable) and submit. A **zero-knowledge proof** verifies your action is valid for your role without revealing the role itself.

### 6. Day Phase ☀️

When dawn breaks, the night results are announced:
- *"Someone was targeted for elimination but a guardian intervened"* (protected)
- *"Player X was found eliminated this morning"* (killed)
- *"The night passed peacefully"* (no attack)

The **Investigator** also privately sees their investigation result (🚨 SUSPICIOUS or ✅ CLEAR).

### 7. Voting Phase 🗳️

All surviving players cast a **private vote** to eliminate a suspect:
1. Select the player you want to vote against
2. Click **"Cast Private Vote"**
3. Your vote is encrypted — only the aggregate totals are revealed

The player with the most votes is eliminated. Their role is revealed upon elimination.

### 8. Next Round 🔄

The game cycles: Night → Day → Voting → Night → Day → ...

### 9. Game Over 🏆

The game ends when:
- **Guardians win** 🛡️: The Assassin is eliminated through voting
- **Assassin wins** 🗡️: The Assassin survives until evil equals or outnumbers good

A full **role reveal** shows everyone's identity, and a **Privacy Report** summarizes what Midnight kept private.

## What Gets Proved (and What Stays Private)

### ✅ What gets proved on-chain:
- Player actions are valid (the right role performed the right action)
- Votes are from real, alive players
- Each player acted/voted only once per round
- The game outcome is legitimate

### 🔒 What stays private:
- **Your role** — no one knows if you're the Assassin
- **Your night action** — no one knows who you targeted
- **Your vote** — no one knows who you voted to eliminate
- **Investigation results** — only the Investigator sees their findings

## Troubleshooting

### "Lace wallet not detected"
- Ensure the Lace extension is installed and enabled
- Refresh the page after installing
- Check that Lace is set to **Midnight Preprod** network

### "Action not valid for role"
- Each role can only perform specific actions (see Night Phase table above)
- You cannot target yourself with assassination
- You cannot target dead players

### "Already acted this round"
- Each player can only act once per night phase and vote once per voting phase
- Wait for the next round to act again

### Game feels stuck?
- Switch between player tabs (top of screen) to submit actions for all players
- In the MVP, you control all 6 players via the tab switcher
- All alive players must act before the night resolves
