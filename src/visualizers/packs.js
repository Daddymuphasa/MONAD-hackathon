import * as THREE from 'three';

function hex(top, bottom, depth) {
  return new THREE.CylinderGeometry(top, bottom, depth, 6, 1, false);
}

function detailMaterial(color, vertexColors = false) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.32,
    roughness: 0.36,
    flatShading: true,
    vertexColors,
    side: THREE.DoubleSide
  });
}

const circuitRing = new THREE.TorusGeometry(0.265, 0.024, 3, 6);
circuitRing.rotateX(-Math.PI / 2);
const haloRing = new THREE.TorusGeometry(0.255, 0.04, 4, 8);
haloRing.rotateX(-Math.PI / 2);
const copperRing = new THREE.TorusGeometry(0.21, 0.065, 4, 6);
copperRing.rotateX(-Math.PI / 2);

const surfacePacks = [
  {
    id: 'nano-hex',
    name: 'Nano Hex Genesis',
    wave: 'radial',
    shaderMode: 0,
    plateGeometry: hex(0.448, 0.465, 0.16),
    insetGeometry: hex(0.395, 0.395, 0.012),
    plateColor: 0x303436,
    insetColor: 0x1c2022,
    insetOffset: 0.086,
    detailGeometry: null,
    detailOffset: 0,
    lift: 1,
    tilt: 1,
    compression: 1,
    warp: 1,
    reflection: 1,
    socket: 1
  },
  {
    id: 'armor-scales',
    name: 'Armor Scales',
    wave: 'faceted',
    shaderMode: 1,
    plateGeometry: hex(0.425, 0.468, 0.22),
    insetGeometry: hex(0.355, 0.355, 0.012),
    plateColor: 0x303638,
    insetColor: 0x161a1c,
    insetOffset: 0.116,
    detailGeometry: new THREE.BoxGeometry(0.055, 0.018, 0.62),
    detailMaterial: detailMaterial(0x596165),
    detailOffset: 0.134,
    lift: 0.88,
    tilt: 1.28,
    compression: 0.75,
    warp: 1.08,
    reflection: 0.82,
    socket: 0.72
  },
  {
    id: 'obsidian-bloom',
    name: 'Obsidian Bloom',
    wave: 'spiral',
    shaderMode: 2,
    plateGeometry: hex(0.365, 0.468, 0.31),
    insetGeometry: hex(0.27, 0.27, 0.012),
    plateColor: 0x292d2e,
    insetColor: 0x15191a,
    insetOffset: 0.161,
    detailGeometry: hex(0.075, 0.075, 0.02),
    detailMaterial: detailMaterial(0x51595d),
    detailOffset: 0.18,
    lift: 1.38,
    tilt: 0.72,
    compression: 1.1,
    warp: 0.8,
    reflection: 1.12,
    socket: 0.82
  },
  {
    id: 'circuit-matrix',
    name: 'Circuit Matrix',
    wave: 'diamond',
    shaderMode: 3,
    plateGeometry: hex(0.459, 0.466, 0.1),
    insetGeometry: hex(0.315, 0.315, 0.012),
    plateColor: 0x252a2c,
    insetColor: 0x101416,
    insetOffset: 0.056,
    detailGeometry: circuitRing,
    detailMaterial: detailMaterial(0x929a9e),
    detailOffset: 0.072,
    lift: 0.58,
    tilt: 0.42,
    compression: 0.58,
    warp: 1.25,
    reflection: 1.3,
    socket: 1.18
  },
  {
    id: 'electric-nexus',
    name: 'Electric Nexus',
    wave: 'radial',
    shaderMode: 4,
    plateGeometry: hex(0.45, 0.466, 0.13),
    insetGeometry: hex(0.37, 0.37, 0.012),
    plateColor: 0x202527,
    insetColor: 0x111719,
    insetOffset: 0.071,
    detailGeometry: null,
    detailOffset: 0,
    lift: 0.3,
    tilt: 0.3,
    compression: 0.25,
    warp: 0.28,
    reflection: 0.38,
    socket: 0.32,
    electric: true
  },
  {
    id: 'gilded-reactor',
    name: 'Gilded Reactor',
    wave: 'rings',
    shaderMode: 5,
    plateGeometry: hex(0.42, 0.468, 0.22),
    insetGeometry: hex(0.32, 0.32, 0.014),
    plateColor: 0x5c4630,
    insetColor: 0x162b25,
    insetOffset: 0.117,
    detailGeometry: haloRing,
    detailMaterial: detailMaterial(0xd5ad63),
    detailOffset: 0.134,
    lift: 1.1,
    tilt: 0.8,
    compression: 0.7,
    warp: 0.9,
    reflection: 1.25,
    socket: 1.1,
    glowColor: 0xd5ad63
  },
  {
    id: 'emerald-flux',
    name: 'Emerald Flux',
    wave: 'tide',
    shaderMode: 6,
    plateGeometry: hex(0.385, 0.47, 0.27),
    insetGeometry: hex(0.23, 0.23, 0.012),
    plateColor: 0x18483a,
    insetColor: 0x102a25,
    insetOffset: 0.141,
    detailGeometry: new THREE.ConeGeometry(0.17, 0.24, 6),
    detailMaterial: detailMaterial(0x76cfad),
    detailOffset: 0.23,
    lift: 1.3,
    tilt: 0.65,
    compression: 0.9,
    warp: 1.1,
    reflection: 1.15,
    socket: 1.05,
    glowColor: 0x65cfa5
  },
  {
    id: 'halo-relay',
    name: 'Halo Relay',
    wave: 'cross',
    shaderMode: 7,
    plateGeometry: hex(0.45, 0.468, 0.095),
    insetGeometry: hex(0.345, 0.345, 0.012),
    plateColor: 0x283b44,
    insetColor: 0x101e27,
    insetOffset: 0.054,
    detailGeometry: haloRing,
    detailMaterial: detailMaterial(0x7bc7d7),
    detailOffset: 0.072,
    lift: 0.55,
    tilt: 0.4,
    compression: 0.55,
    warp: 1.35,
    reflection: 1.35,
    socket: 1.2,
    glowColor: 0x7bc7d7
  },
  {
    id: 'prism-shards',
    name: 'Prism Shards',
    wave: 'shard',
    shaderMode: 8,
    plateGeometry: new THREE.CylinderGeometry(0.26, 0.465, 0.32, 3),
    insetGeometry: new THREE.CylinderGeometry(0.15, 0.15, 0.012, 3),
    plateColor: 0x4a3150,
    insetColor: 0x211727,
    insetOffset: 0.166,
    detailGeometry: new THREE.TetrahedronGeometry(0.095),
    detailMaterial: detailMaterial(0xb98bbc),
    detailOffset: 0.205,
    lift: 1.45,
    tilt: 1.18,
    compression: 1.1,
    warp: 1.3,
    reflection: 1.18,
    socket: 0.95,
    glowColor: 0xb98bbc
  },
  {
    id: 'copper-pulse',
    name: 'Copper Pulse',
    wave: 'chevron',
    shaderMode: 9,
    plateGeometry: hex(0.41, 0.465, 0.185),
    insetGeometry: hex(0.315, 0.315, 0.012),
    plateColor: 0x513b35,
    insetColor: 0x182a2b,
    insetOffset: 0.099,
    detailGeometry: copperRing,
    detailMaterial: detailMaterial(0xc78368),
    detailOffset: 0.115,
    lift: 0.92,
    tilt: 0.92,
    compression: 0.88,
    warp: 1.12,
    reflection: 1.25,
    socket: 1.08,
    glowColor: 0xc78368
  }
];

const sculpturalPacks = [
  { id: 'resonant-sphere', name: 'Resonant Sphere', sceneMode: 'sphere', wave: 'deform', glowColor: 0xd9ba78 },
  { id: 'orbit-forge', name: 'Orbit Forge', sceneMode: 'orbits', wave: 'orbit', glowColor: 0x85d6cb },
  { id: 'aurora-ribbons', name: 'Aurora Ribbons', sceneMode: 'ribbons', wave: 'ribbon', glowColor: 0x8ecfad },
  { id: 'spectrum-spires', name: 'Spectrum Spires', sceneMode: 'spires', wave: 'columns', glowColor: 0xffb878 },
  { id: 'stellar-drift', name: 'Stellar Drift', sceneMode: 'galaxy', wave: 'spiral', glowColor: 0xc6a6ec },
  { id: 'crystal-bloom', name: 'Crystal Bloom', sceneMode: 'crystals', wave: 'radial', glowColor: 0xf0a5bd },
  { id: 'double-helix', name: 'Double Helix', sceneMode: 'helix', wave: 'helix', glowColor: 0x9adddf },
  { id: 'liquid-mirror', name: 'Liquid Mirror', sceneMode: 'liquid', wave: 'ripple', glowColor: 0xb9d5ed },
  { id: 'pulsar-core', name: 'Pulsar Core', sceneMode: 'pulsar', wave: 'burst', glowColor: 0xffd17f },
  { id: 'wave-tunnel', name: 'Wave Tunnel', sceneMode: 'tunnel', wave: 'depth', glowColor: 0x9cdbbd }
].map((pack, index) => ({
  ...pack,
  shaderMode: 10 + index,
  lift: 1,
  tilt: 1,
  compression: 1,
  warp: 1,
  reflection: 1,
  socket: 1
}));

export const VISUALIZER_PACKS = [...surfacePacks, ...sculpturalPacks];
