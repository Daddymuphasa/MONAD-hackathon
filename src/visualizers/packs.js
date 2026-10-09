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

export const VISUALIZER_PACKS = [
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
  }
];
