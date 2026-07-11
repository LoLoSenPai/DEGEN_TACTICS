# Future Solana Integration

## Current status

The Degen Tactics vertical slice has **no Solana runtime**. Guest mode is the only playable identity mode. Connect Wallet, global/daily leaderboards, and Mint Season Badge are labeled placeholders; no wallet package, RPC request, signature, transaction, program, or asset mint is included.

That separation is intentional. The deterministic game engine must remain a pure local package and the campaign must continue to work without a wallet, network, account, or asset.

## Product boundary

Solana may later provide:

- Optional wallet-backed identity.
- A signed login that links a wallet to a server profile.
- Verified daily-challenge and seasonal score attribution.
- An optional compressed completion/season badge with no gameplay power.

Solana must never provide:

- Wagering or real-SOL betting.
- A fungible token, token sale, tokenomics, staking, yield, or speculative reward system.
- Play-to-earn or financial rewards for score, rank, wins, or time played.
- Paid random rewards, pay-to-win units, mission access, or leaderboard boosts.
- A wallet requirement for campaign play.

No fungible currency, utility, governance, or reward token will be created for this product. The only contemplated onchain asset is the optional, non-financial cosmetic badge described below.

## Identity abstraction

The UI and persistence layer depend on a provider-neutral identity shape:

```ts
export type PlayerIdentity = {
  guestId: string;
  walletAddress?: string;
  displayName: string;
};
```

- `guestId` is generated locally and remains the offline profile key.
- `walletAddress` is absent until the player explicitly connects and, for authenticated server actions, signs in.
- `displayName` is never derived unsafely from untrusted onchain metadata.
- Connecting a wallet changes available identity actions; it does not replace the local guest profile or alter game rules.

Keep wallet objects, RPC response types, and chain-specific address types behind adapters. The game store should receive normalized identity/session state, never a wallet provider instance.

## Proposed module boundary

When integration begins, isolate it from `src/lib/game`:

```text
src/lib/solana/
  client.ts             one configured client; explicit cluster/RPC/WS
  wallet-adapter.ts     Wallet Standard connection normalization
  auth-client.ts        challenge/session API calls
  badge-client.ts       explicit badge eligibility/mint workflow
src/components/identity/
  WalletButton.tsx      small client-only leaf
  SignInPanel.tsx
  BadgeMintPanel.tsx
```

Use one application-level Solana client and keep hook usage in small client components. At implementation time, prefer Wallet Standard-first discovery with the current supported framework-kit (`@solana/client` / `@solana/react-hooks`) and Kit types at RPC/transaction boundaries. Recheck the official packages and APIs when that milestone begins; do not add compatibility libraries until a real dependency requires them.

Cluster, HTTP RPC, and WebSocket endpoints must be explicit environment configuration. Localnet or devnet is the default for development and QA. Mainnet is never selected implicitly.

## Phase 1 — Optional wallet connection

Connection proves that a wallet extension/app exposes an account; it is not authentication.

Flow:

1. The player chooses **Connect Wallet** from the guest profile.
2. A Wallet Standard connector presents discovered wallets.
3. On approval, normalize the selected public address and display a shortened form.
4. Preserve `guestId`, local best scores, and guest display name.
5. Offer **Sign in to sync** as a separate, explicit action.
6. Disconnect clears wallet/session state but leaves offline guest progress intact.

Handle unavailable wallets, rejected connection, account change, network change, reconnect, and disconnect without blocking campaign play. Never request, generate, log, transmit, or store a seed phrase, private key, or keypair file.

## Phase 2 — Sign in with a wallet message

Wallet connection alone must not authorize leaderboard writes or profile access. Use a server-issued, single-use challenge.

### Challenge

The client requests a challenge bound to:

- Expected domain and URI.
- Wallet address.
- Random high-entropy nonce and challenge/request ID.
- Human-readable purpose statement (“Sign in to Degen Tactics”).
- Issued-at and short expiration times.
- Intended cluster/network and application version where relevant.

### Verification

1. Show the exact human-readable message before requesting a signature.
2. The wallet signs the message; this is not a transaction and must not request funds or broad permissions.
3. Send the message, signature, address, and challenge ID to the server.
4. The server reloads the original challenge, verifies domain/address/message equality, expiration, signature, and nonce state, then consumes the nonce atomically.
5. On success, issue a short-lived server session using a Secure, HttpOnly, SameSite cookie. Do not store an authentication bearer token in LocalStorage.

Reject replayed, modified, expired, wrong-domain, wrong-address, and already-consumed challenges. Rate-limit challenge creation and verification. Require fresh authorization for sensitive account-link or future mint operations.

### Guest-to-wallet linking

Linking is a deliberate merge, never an automatic overwrite:

- Present which guest and wallet profiles will be combined.
- Keep the highest verified score per mission/day; never accept a local score as verified simply because it is higher.
- Preserve local campaign progress on merge failure.
- Make server association changes idempotent and auditable.
- Provide unlink/sign-out behavior without deleting the local guest profile.

## Phase 3 — Server-authoritative daily leaderboard

The public leaderboard needs a backend even though the local campaign does not.

### Versioned challenge input

For each UTC challenge day, the service publishes an immutable payload containing:

- `challengeId` and date.
- Mission/engine rules version.
- Authored configuration or deterministic seed.
- Content/configuration hash.
- Open/close timestamps and scoring version.

The client initializes the pure engine from that payload and records the player's legal command stream. The wall clock must not influence rules unless an explicit timed mode is later designed.

### Verified submission

1. Submit authenticated wallet/profile ID, challenge ID, engine version, initial configuration hash, command stream, and claimed outcome.
2. Apply idempotency keys, payload limits, replay protection, per-profile/address/IP rate limits, and abuse monitoring.
3. The server replays commands with the matching deterministic engine version.
4. Reject illegal commands, mismatched plans/configuration, impossible outcomes, stale challenge windows, and claimed totals that differ from server scoring.
5. Store the server-calculated score and stable tie-break data; never order by the browser's claimed score.

The service needs retention, moderation, display-name, privacy, and deletion policies before launch. If it is unavailable, the campaign and local best scores continue to work; daily submission reports a clear retryable state.

## Phase 4 — Optional compressed badge

A completion or season badge is a cosmetic proof of achievement, not a reward instrument. Compressed NFT tooling and providers should be selected against current official documentation when implementation begins.

### Eligibility and mint flow

1. The server verifies an eligible result from its own replayed leaderboard record.
2. It creates an idempotent authorization keyed by season/badge/profile/wallet so the same achievement cannot be unintentionally minted repeatedly.
3. The player explicitly selects **Mint Season Badge**. The UI shows the badge, recipient address, cluster, collection/issuer, fee payer, expected fees, and that the asset has no gameplay or financial utility.
4. Build the exact mint transaction through an isolated adapter, validate all program/account addresses, and simulate it.
5. Show the simulation result and complete transaction summary before requesting wallet approval.
6. The wallet signs; the app tracks sent, confirmed, and finalized/error states rather than treating a returned signature as success.
7. Store the resulting asset ID against the server profile and present an explorer link for the configured cluster.

Use an issuer-controlled verified collection and versioned, durable metadata. Do not claim scarcity, floor price, return, or future utility. Do not integrate a marketplace. Badge ownership never unlocks units, missions, score multipliers, leaderboard eligibility, or stronger rules. Declining or being unable to mint has no gameplay consequence.

A sponsored fee payer may be considered for accessibility, but it requires strict eligibility, rate limiting, idempotency, transaction allowlisting, spend caps, and monitoring. Otherwise, disclose the player's expected network cost before signature. Never silently switch cluster or fee payer.

## Transaction and data safety

Any future transaction flow must satisfy all of the following:

- Explicit player initiation and approval for every transaction.
- Human-readable summary of action, recipient, fee payer, cluster, programs, and expected cost before signing.
- Simulation and validation before signature; actionable handling of rejection, blockhash expiry, dropped transactions, insufficient fees, and program errors.
- Confirmation tracking appropriate to the action; a transaction signature alone is not completion.
- No private key or seed phrase handling by the application or support workflow.
- Onchain accounts, metadata, RPC responses, names, memos, and logs are untrusted input. Validate owners, expected program IDs, data sizes/discriminators, addresses, and display-safe strings before use.
- Permit only the instructions/programs required by the badge flow. Do not accept arbitrary transaction payloads from metadata or a remote client.
- Content Security Policy and endpoint allowlists are updated deliberately when wallet/RPC hosts are introduced.
- Secrets, issuer authority, and server signing material stay server-side in managed secret storage with rotation and audit controls.

If an onchain program is ever proposed, it requires a separate threat model, owner/signer/writable/PDA/CPI validation, checked arithmetic, local validator tests, external security review, and upgrade-authority policy. The current roadmap does not require a custom program.

## Privacy and observability

- Clearly disclose that wallet addresses and onchain badge ownership are public.
- Store only data required for account, score verification, moderation, and support.
- Do not correlate guest identifiers with wallet addresses before explicit linking consent.
- Never log signatures, full auth messages, session cookies, private key material, or unrestricted RPC payloads.
- Use structured events for connection failure, challenge failure reason, replay rejection category, transaction simulation, confirmation, and idempotency conflict without recording sensitive contents.
- Define retention and deletion behavior before enabling synced profiles.

## Rollout gates

Each phase can ship independently and must preserve guest play.

| Phase | Required gate |
| --- | --- |
| Wallet connection | Wallet/account-change tests; failure leaves campaign usable |
| Signed login | Nonce replay/domain/address/expiry tests; secure-cookie and merge review |
| Daily leaderboard | Cross-version deterministic replay tests; anti-abuse and outage behavior |
| Compressed badge | Devnet end-to-end simulation/mint/confirmation tests; idempotency, fee, metadata, and security review |

No phase advances merely to make the game appear “more Web3.” It advances only when it gives players optional identity, trustworthy competition, or a clearly understood cosmetic keepsake without compromising the tactics game.
