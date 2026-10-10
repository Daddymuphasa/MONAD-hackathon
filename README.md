# Papageddon Monad

Papageddon is a browser music visualizer for the Monad hackathon. Its current demo turns bass impacts into physical motion across a branded nanotech display.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL ending in `/monad/`. Run `npm test` for audio onset checks or `npm run build` for a production bundle.

## Current demo

- Select a local audio file, then play, pause, and seek. The file stays in the browser; Web Audio analyses the playing element without an upload service.
- Use the microphone as an alternate input.
- Switch live between ten render packs. Auto mode rotates through them at varied intervals, favoring bass hits and avoiding recent repeats. Manual selection and arrow keys take control without restarting the audio source.
- A standalone Papagedon mark sits over the visualizer. The borderless right-edge controls stay hidden until hover or keyboard focus, then appear as a restrained dark-glass sheet with small green and gold accents.
- Bass onsets trigger short-lived mechanical shockwaves. Electric Nexus uses the same onset signal to send charge through connected nodes and sparks.
- Click the display to preview an impact without audio.

## Monad status

`PapagedonVisualMemory` is an OpenZeppelin ERC-721 contract that stores a bounded declarative visual recipe, user-approved taste profile, content hash, renderer version, and metadata URI for each NFT. It compiles and passes the local deployment, mint, read, and update smoke test.

The Visual Memory contract is deployed on Monad Testnet at `0xD0793d7B3897A992ccc8f7188F5F2eE3AA21a590`. Its owner is the deployment wallet, its mint price is `0.2` testnet MON, and the deployment was verified through the Monad JSON-RPC endpoint. Testnet MON does not have a dependable USD price, so this represents the requested $0.20-equivalent demo price rather than a live conversion. AI generation and IPFS publishing remain separate services described in [the custom-pack architecture](docs/CUSTOM_PACK_ARCHITECTURE.md).

The live mint flow builds a self-contained ERC-721 metadata URI plus a hashed, on-chain visual recipe and taste profile from the selected pack, renderer parameters, sensitivity, mode, and style brief. After wallet connection, the user explicitly confirms the `0.2` testnet MON transaction and the UI reports the minted token ID and transaction hash.

```sh
npm run contract:compile
npm run contract:test
npm run contract:export
```
