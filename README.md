# Papageddon Monad

Papageddon is a browser music visualizer for the Monad hackathon. Its current demo turns bass impacts into physical motion across a black nanotech display.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL ending in `/monad/`. Run `npm test` for audio onset checks or `npm run build` for a production bundle.

## Current demo

- Select a local audio file, then play, pause, and seek. The file stays in the browser; Web Audio analyses the playing element without an upload service.
- Use the microphone as an alternate input.
- Switch live between Nano Hex Genesis, Armor Scales, Obsidian Bloom, Circuit Matrix, and Electric Nexus. Pack changes do not restart the audio source.
- Bass onsets trigger short-lived mechanical shockwaves. Electric Nexus uses the same onset signal to send charge through connected nodes and sparks.
- Click the display to preview an impact without audio.

## Monad status

The custom-pack quote is a UI preview. The repository has a draft Monad experience registry contract, but payment, AI generation, and minting are not connected or deployed yet.
