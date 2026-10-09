# Papageddon Build Notes

## Core Idea

Papageddon is not just an audio visualizer. It is a real-time visual identity layer for music.

The app should feel like Shazam for visuals: it listens, activates automatically, and turns the sound around the user into a live visual system.

## Visual Target

The visual style should avoid basic equalizer bars or plain WebGL demos. The target is:

- Nanotech sci-fi.
- Hexagonal surface motion.
- Crysis-like nanosuit ripple behavior.
- High-definition glow and surface detail.
- Low-FPS tolerant animation that still feels smooth.
- Device-aware rendering quality.

## Monad Role

Monad should be in the value path, not only the final mint.

For the hackathon version, use Monad testnet tokens for:

- Paying to generate a personalized AI visual pack.
- Unlocking premium visual modules.
- Saving or minting a listening experience.
- Registering reusable visual packs.

## Porting Plan

When the working Celo hackathon repo is available:

1. Inspect its app structure, build system, audio engine, wallet flow, and contract integration.
2. Copy only the parts that already work and fit Papageddon.
3. Replace Celo-specific wallet, network, and contract logic with Monad testnet equivalents.
4. Upgrade the visualizer layer into modular nanotech packs.
5. Add a clear testnet payment flow for custom pack generation.

