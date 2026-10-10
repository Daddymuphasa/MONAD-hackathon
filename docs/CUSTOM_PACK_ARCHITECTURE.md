# Paid visual packs and wallet memory

This is the proposed Monad Testnet path, not a description of a deployed feature. The current UI only previews a quote. No wallet payment, AI generation, NFT mint, or profile restore is connected yet.

## Experience flow

1. The user connects an EVM wallet to Monad Testnet (chain ID 10143). Connecting reads the account and collection state; it does not charge them. The app asks for a nonce signature before reading any private saved preferences.
2. The user supplies a style brief: palette, brand references, desired motion, genre, and preferred packs. Audio features are analyzed locally. The raw track, microphone stream, and listening history are not sent to the chain.
3. A server issues a short-lived quote bound to the wallet, chain ID, style-brief hash, price, and nonce. The user approves a testnet MON transaction to a paid request contract. The server fulfills only after it verifies the contract event and transaction outcome, not after trusting a browser-submitted hash.
4. The generator produces a validated visual **recipe**: geometry family, colors, shader parameters, motion curves, and audio mappings within a versioned renderer schema. It does not generate executable JavaScript or arbitrary GLSL for the browser. Generation happens once per pack or revision; rendering and audio reaction still happen locally every frame.
5. Store the public recipe and NFT metadata at a stable content-addressed URI (for example IPFS), pin it, and mint an ERC-721 Pack NFT to the paying wallet. The contract records the request, ownership, recipe hash/URI, and version. The backend can retry fulfillment idempotently if generation fails, with a defined refund or credit policy.
6. For the user's evolving taste, keep a small public profile snapshot (palette, pack IDs, motion preferences, schema version) anchored on-chain by hash and URI. Emit a versioned update event only when the user explicitly saves a meaningful change. Keep any private preferences in encrypted off-chain storage, accessible after a fresh wallet signature. Never write raw prompts, listening logs, song names, or brand-private assets to public chain storage.
7. On reconnect, verify the active chain and current NFT ownership, fetch the recipe and latest profile snapshot, verify their hashes, then hydrate the renderer. The wallet and NFT establish ownership; the NFT does not somehow infer taste on its own. The taste data is the validated metadata/profile the user chose to save.

## Ownership decision

A personal memory NFT should not silently reveal private preferences to a buyer. For the first release, make the identity token non-transferable, or keep private memory wallet-bound and reset access when a transferable pack NFT changes owner. Pack ownership and personal identity can be separate tokens.

## Contract and service boundaries

- **Paid request contract:** exact price/quote verification, replay protection, request and fulfillment events, and a refund path. Do not use the current draft registry as a payment gate; it accepts any `msg.value`.
- **Pack NFT:** standard ERC-721 ownership with a stable metadata URI and versioned recipe hash. Use audited OpenZeppelin components and tests.
- **Profile registry:** token ID, version, content hash, and URI/event history only. No per-beat writes; those would add cost and expose listening behavior.
- **Generation service:** verifies payment, creates constrained recipes, pins assets, and requests mint/fulfillment. Its signing and mint authority must be limited and auditable.
- **Browser runtime:** reads the NFT/profile on connect, validates recipe schema, and maps live audio features to the recipe locally.

## Milestones

1. Define and validate the recipe JSON schema. Let users save and reload a custom local preset before adding payment.
2. Add read-only wallet connection and restore a test NFT recipe on Monad Testnet.
3. Implement and test paid requests, fulfillment, minting, ownership changes, and failure/refund handling on testnet.
4. Add consented profile snapshots and encrypted private memory; test reconnect and cross-device restore.

## References

- [Monad Testnet network information](https://docs.monad.xyz/developer-essentials/testnet)
- [Monad NFT guide](https://docs.monad.xyz/guides/build-with-nfts)
- [OpenZeppelin ERC-721 guide](https://docs.openzeppelin.com/contracts/5.x/erc721)
