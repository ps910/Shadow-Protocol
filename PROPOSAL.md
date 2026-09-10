# Product Proposal: ZKGate — Private Allowlist Access

**Selected Track**: Privacy-Preserving Access Control & Identity  
**Midnight Network Target**: Preprod  
**Status**: Ready for Submission & Approval  

---

## 1. What is the product idea?

**ZKGate** is a privacy-preserving access control dApp on the Midnight Network. It enables organizations, DAOs, and communities to manage allowlists where members can **prove they belong without revealing who they are**.

The core idea is simple: replace traditional wallet-address-based allowlists with a cryptographic commitment scheme. When a member is added to the allowlist, only a hash of their secret (a "commitment") is stored on-chain. When that member wants to prove they belong, they generate a Zero-Knowledge proof locally on their device — the proof demonstrates that they know a secret matching one of the commitments, but it reveals **absolutely nothing** about which commitment is theirs.

This enables gated access to events, beta programs, governance voting, or premium content where users prove authorization anonymously, with on-chain finality and cryptographic guarantees.

---

## 2. What problem does it solve?

Traditional blockchain allowlists and token-gating solutions force users to connect public wallet addresses, which creates severe privacy problems:

1. **Public Doxxing in Token-Gating**: In Web3 today (Discord roles, NFT mints, DAO voting, exclusive dApps), proving membership requires signing a message with a public wallet address. Observers can trace the user's holdings, previous transactions, and entire balance. This links their financial identity directly to their access request.

2. **Replay & Sybil Vulnerabilities**: Naive off-chain signature schemes risk replay attacks across multiple services without on-chain finality. There is no standardized way to prove a credential was used exactly once.

3. **Regulatory & Compliance Friction**: Organizations cannot securely offer whitelisted access to sensitive resources (investor portals, employee access, beta groups) on public blockchains without breaching privacy regulations like GDPR. Storing wallet addresses on-chain creates a permanent, immutable record linking identity to participation.

4. **Whale Targeting & Phishing**: Early supporters participating in exclusive drops have their whale wallets publicly exposed, making them prime targets for social engineering and phishing attacks.

**ZKGate eliminates all of these** by ensuring that no wallet address, identity, or financial information is ever linked to the allowlist verification.

---

## 3. How does it use Midnight's privacy features?

ZKGate leverages Midnight's unique privacy-first architecture at every layer:

### Compact Smart Contract Language
- **`witness memberSecret(): Bytes<32>`** — The member's secret key is declared as a private witness. Compact guarantees by construction that witness values NEVER leave the user's device and are NEVER included in on-chain state or transaction payloads.
- **`disclose()` Semantics** — Compact's compiler-enforced `disclose()` function is used deliberately: only the allowlist root hash is disclosed during `addMember`, and only a nullifier is tracked during `proveMembership`. Any accidental disclosure of private data fails at compile time.

### Zero-Knowledge Proof Generation
- **`persistentHash<Bytes<32>>([secret])`** — Used to derive the commitment from the member's secret. This is a one-way cryptographic transformation that binds the member to their position in the allowlist without revealing the secret.
- **`transientHash<Bytes<32>>([secret])`** — Used to derive a single-use nullifier that prevents replay attacks. The nullifier is mathematically unlinkable to the commitment, so observers cannot correlate verifications with member registrations.

### Midnight Hybrid Ledger
- **Public State (Ledger)**: Only aggregate statistics are visible — `memberCount`, `verifiedCount`, `allowlistRoot`, and `usedNullifiers`. No individual identity data ever touches the ledger.
- **Private State (Witness)**: The member's secret key exists only in browser memory during proof generation. It is consumed by the local proof server's WASM circuit and never serialized or transmitted.

### On-Chain Verification
- The ZK-SNARK proof is verified natively by the Midnight Preprod sequencer at the protocol level, requiring no custom verifier contracts or expensive on-chain pairing checks (unlike EVM chains).

---

## 4. Who is the target audience?

ZKGate serves four primary audiences:

1. **Private DAO Governance** — Allowlisted voters prove eligibility without exposing how many governance tokens they hold or which vote belongs to them. DAOs can run elections, proposals, and polls where participation is verified but individual choices remain completely secret.

2. **Confidential NFT & Token Whitelists** — Early supporters participate in exclusive drops without having their whale wallets targeted by phishing attacks. Mint access is verified cryptographically without revealing the wallet's balance or transaction history.

3. **Enterprise Whistleblowing & Employee Verification** — Corporate portals verify that a claimant is an active employee without knowing their individual employee ID. This enables secure, anonymous reporting channels with on-chain proof of employment status.

4. **Accredited Investor Portals** — Compliance with KYC/AML allowlists where individual investor identities remain strictly confidential. Investors can prove their accredited status without revealing their name, address, or financial details to the platform.

5. **Beta Access & Closed Programs** — Software companies, game studios, and protocol teams can gate access to beta programs where the list of participants is verifiable but the identity of each participant remains private.

---

## 5. Technical Architecture

- **Smart Contract (`contract/allowlist.compact`)**:
  - `ledger`: State maps for commitments, registered nullifiers, and member counter.
  - `witness`: Local private secret and salt.
  - `circuits`: `addMember` (admin) and `proveMembership` (user).
- **TypeScript Runtime & Client SDK (`@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-network-provider`)**:
  - Browser-side proof generation using Midnight Proof Server.
  - Lace Wallet connector integration for Midnight Preprod.
- **Frontend DApp (`React 18`, `TypeScript`, `Vite`)**:
  - Dark luxury theme with responsive mobile/desktop UI.
  - Real-time proof generation status and on-chain verification display.

---

## 6. Privacy Model & Trust Assumptions

| Dimension | Public to Observers & Ledger | Kept Private in Local Witness |
| :--- | :--- | :--- |
| **Identity** | None (no address or name revealed) | User secret key & salt |
| **Membership Proof** | Cryptographic ZK proof validity | Which specific commitment belongs to prover |
| **Allowlist State** | Total count & public commitment hashes | Plaintext identity or contact of members |
| **Replay Prevention** | Single-use nullifiers per proof event | Unlinkable to prover's identity or other proofs |

---

## 7. Development Roadmap

- **Phase 1 (Completed)**:
  - Toolchain setup (Compact, Docker, Midnight Proof Server, Node 22).
  - Compact contract written, verified, and test suite written (9 passing tests).
  - Deployment configuration and deployment to Midnight Preprod.
  - React DApp with Lace wallet connector and real SDK integration.
- **Phase 2 (Next Cycle)**:
  - Merkle tree commitment accumulation for scaling to $100,000+$ members.
  - Multi-tenant allowlists with role-based access control.
  - Integration with Midnight Testnet/Mainnet releases.

---

## 8. Team & Submission Details

- **Project Name**: ZKGate (Private Allowlist Access)
- **Repository**: [ps910/NEW-MOON-PROJECT-](https://github.com/ps910/NEW-MOON-PROJECT-)
- **Live Demo**: [https://ps910.github.io/ZKGate/](https://ps910.github.io/ZKGate/)
- **Target Network**: Midnight Preprod (`https://indexer.preprod.midnight.network`)
