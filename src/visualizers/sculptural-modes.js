import * as THREE from 'three';

const object = new THREE.Object3D();
const color = new THREE.Color();
const TAU = Math.PI * 2;

function level(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function litMaterial(hex, metalness = 0.35, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    metalness,
    roughness,
    emissive: hex,
    emissiveIntensity: 0.08,
    side: THREE.DoubleSide
  });
}

function makeStars() {
  const count = 440;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const seed = i * 17.271;
    positions[i * 3] = Math.sin(seed * 1.3) * 9;
    positions[i * 3 + 1] = Math.sin(seed * 2.7) * 6;
    positions[i * 3 + 2] = -7 - (i % 8) * 0.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xaac2b9,
    size: 0.018,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  }));
}

function sphereMode() {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(2.2, 72, 48);
  const base = new Float32Array(geometry.attributes.position.array);
  const sphere = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
    color: 0xd4bc83,
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    flatShading: false,
    emissive: 0x5d3f1e,
    emissiveIntensity: 0.12
  }));
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(3.08, 0.018, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0x95d5b8, transparent: true, opacity: 0.62 })
  );
  orbit.rotation.x = 1.05;
  group.add(sphere, orbit);

  return {
    group,
    camera: [0, 0, 11.5],
    update(signals, time, delta) {
      const bass = level(signals.bass);
      const mid = level(signals.mid);
      const treble = level(signals.treble);
      const beat = level(signals.beat);
      const attribute = geometry.attributes.position;
      for (let i = 0; i < attribute.count; i += 1) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const z = base[i * 3 + 2];
        const directionX = x / 2.2;
        const directionY = y / 2.2;
        const directionZ = z / 2.2;
        const low = Math.sin(directionX * 5.4 + time * 2.4) * Math.cos(directionY * 4.2 - time * 1.3);
        const middle = Math.sin(directionY * 11 + directionZ * 7 - time * 3.8);
        const high = Math.sin((directionX + directionY + directionZ) * 21 + time * 6.2);
        const displacement = low * (0.018 + bass * 0.44 + beat * 0.13) +
          middle * (0.009 + mid * 0.18) + high * (0.004 + treble * 0.09);
        const radius = 1 + Math.max(-0.2, Math.min(0.28, displacement));
        attribute.setXYZ(i, x * radius, y * radius, z * radius);
      }
      attribute.needsUpdate = true;
      geometry.computeVertexNormals();
      sphere.rotation.y += delta * (0.12 + mid * 0.32);
      sphere.rotation.x = Math.sin(time * 0.22) * 0.15;
      sphere.material.emissiveIntensity = 0.12 + bass * 0.34 + beat * 0.2;
      orbit.rotation.z += delta * (0.12 + treble * 0.7);
      orbit.material.opacity = 0.38 + beat * 0.4;
    }
  };
}

function orbitMode() {
  const group = new THREE.Group();
  const rings = [0x80d4c1, 0xe0c27c, 0x91bfe2, 0xf4a57d].map((hex, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.15 + i * 0.48, 0.065 - i * 0.009, 10, 128),
      litMaterial(hex, 0.42, 0.24)
    );
    ring.rotation.set(0.3 + i * 0.45, i * 0.58, i * 0.24);
    group.add(ring);
    return ring;
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 3), litMaterial(0xe8d5a5, 0.62, 0.18));
  group.add(core);
  return {
    group,
    camera: [0, 0, 12.8],
    update(signals, time, delta) {
      const bands = [signals.bass, signals.mid, signals.treble, signals.energy];
      rings.forEach((ring, i) => {
        ring.rotation.x += delta * (0.07 + i * 0.025 + level(bands[i]) * 0.28) * (i % 2 ? -1 : 1);
        ring.rotation.y += delta * (0.12 + level(bands[i]) * 0.35);
        ring.scale.setScalar(1 + level(bands[i]) * 0.08 + level(signals.beat) * 0.04);
        ring.material.emissiveIntensity = 0.1 + level(bands[i]) * 0.42;
      });
      core.rotation.y = time * 0.19;
      core.rotation.x = time * 0.1;
      core.scale.setScalar(1 + level(signals.bass) * 0.24);
    }
  };
}

function ribbonMode() {
  const group = new THREE.Group();
  const ribbons = [];
  const shades = [0x77cbaa, 0x86c8d7, 0xe4c987, 0xb39bd8, 0x61a5a0, 0xe0a5a5];
  for (let j = 0; j < shades.length; j += 1) {
    const count = 96;
    const positions = new Float32Array(count * 2 * 3);
    const indices = [];
    for (let i = 0; i < count - 1; i += 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: shades[j],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    }));
    group.add(mesh);
    ribbons.push({ geometry, mesh, index: j, count });
  }
  return {
    group,
    camera: [0, 0, 11],
    update(signals, time) {
      const bass = level(signals.bass);
      const mid = level(signals.mid);
      const treble = level(signals.treble);
      ribbons.forEach(({ geometry, mesh, index, count }) => {
        const position = geometry.attributes.position;
        for (let i = 0; i < count; i += 1) {
          const u = i / (count - 1);
          const x = (u - 0.5) * 11.2;
          const envelope = Math.sin(u * Math.PI);
          const y = (index - 2.5) * 0.54 +
            Math.sin(u * (8 + index * 0.8) + time * (0.7 + index * 0.13)) * envelope * (0.3 + mid * 1.15) +
            Math.sin(u * 24 - time * 2.8 + index) * envelope * treble * 0.19;
          const z = (index - 2.5) * 0.36 + Math.sin(u * 9 - time + index) * bass * 0.52;
          const width = (0.16 + bass * 0.28 + level(signals.beat) * 0.1) * envelope;
          position.setXYZ(i * 2, x, y - width, z);
          position.setXYZ(i * 2 + 1, x, y + width, z);
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
        mesh.material.opacity = 0.58 + level(signals.energy) * 0.28;
      });
    }
  };
}

function spireMode() {
  const group = new THREE.Group();
  const count = 108;
  const geometry = new THREE.CylinderGeometry(0.075, 0.13, 1, 6);
  const material = litMaterial(0xffffff, 0.55, 0.26);
  const spires = new THREE.InstancedMesh(geometry, material, count);
  spires.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  spires.frustumCulled = false;
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 4.9, 96),
    new THREE.MeshBasicMaterial({ color: 0x33544f, side: THREE.DoubleSide, transparent: true, opacity: 0.34 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.62;
  group.add(floor, spires);
  return {
    group,
    camera: [0, 6.6, 14.5],
    mobileFraming: 1.08,
    update(signals, time) {
      const bands = [level(signals.bass), level(signals.mid), level(signals.treble)];
      for (let i = 0; i < count; i += 1) {
        const lane = Math.floor(i / 36);
        const angle = (i % 36) / 36 * TAU;
        const radius = 1.45 + lane * 1.35;
        const band = bands[lane];
        const wave = (Math.sin(angle * (4 + lane * 2) - time * 2.6) + 1) * 0.5;
        const height = 0.28 + band * (1.6 + wave * 2.4) + wave * 0.32 + level(signals.beat) * (lane === 0 ? 0.85 : 0.25);
        object.position.set(Math.cos(angle) * radius, -1.6 + height * 0.5, Math.sin(angle) * radius);
        object.rotation.set(0, -angle, 0);
        object.scale.set(1, height, 1);
        object.updateMatrix();
        spires.setMatrixAt(i, object.matrix);
        color.setHex([0xe1b775, 0x77c7ae, 0x9fb9e1][lane]).multiplyScalar(0.42 + band * 0.62 + wave * 0.16);
        spires.setColorAt(i, color);
      }
      spires.instanceMatrix.needsUpdate = true;
      spires.instanceColor.needsUpdate = true;
      group.rotation.y = Math.sin(time * 0.12) * 0.1;
    }
  };
}

function galaxyMode() {
  const group = new THREE.Group();
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const arm = i % 4;
    const fraction = (Math.floor(i / 4) + 0.5) / (count / 4);
    const radius = 0.18 + Math.sqrt(fraction) * 4.9;
    const jitter = Math.sin(i * 67.17) * 0.22 * fraction;
    const angle = arm * TAU / 4 + radius * 0.78 + jitter;
    positions[i * 3] = Math.cos(angle) * radius + Math.sin(i * 1.31) * 0.16;
    positions[i * 3 + 1] = Math.sin(angle) * radius + Math.cos(i * 1.77) * 0.16;
    positions[i * 3 + 2] = Math.sin(i * 2.97) * 0.65 * fraction;
    color.setHex([0xc5a4df, 0x8fc8ce, 0xe6c78d, 0xe8a7b0][arm]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.055,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  group.add(stars);
  return {
    group,
    camera: [0, 0, 13.5],
    update(signals, time, delta) {
      stars.rotation.z += delta * (0.04 + level(signals.mid) * 0.32);
      stars.rotation.x = Math.sin(time * 0.24) * (0.16 + level(signals.treble) * 0.2);
      stars.scale.setScalar(1 + level(signals.bass) * 0.16 + level(signals.beat) * 0.06);
      stars.material.size = 0.045 + level(signals.treble) * 0.085;
      stars.material.opacity = 0.64 + level(signals.energy) * 0.32;
    }
  };
}

function crystalMode() {
  const group = new THREE.Group();
  const count = 164;
  const crystals = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.36, 0),
    litMaterial(0xffffff, 0.36, 0.19),
    count
  );
  crystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crystals.frustumCulled = false;
  group.add(crystals);
  return {
    group,
    camera: [0, 0, 12],
    mobileFraming: 1.18,
    update(signals, time, delta) {
      const bass = level(signals.bass);
      const mid = level(signals.mid);
      const treble = level(signals.treble);
      for (let i = 0; i < count; i += 1) {
        const shell = Math.floor(i / 41);
        const angle = (i % 41) / 41 * TAU + shell * 0.31;
        const radius = 0.9 + shell * 0.9 + (shell % 2 ? 0.08 : 0);
        const bloom = 1 + bass * 0.28 + level(signals.beat) * 0.12;
        object.position.set(
          Math.cos(angle) * radius * bloom,
          Math.sin(angle) * radius * bloom,
          Math.sin(angle * 4 + time * 0.8) * (0.25 + mid * 0.9) + shell * 0.13
        );
        object.rotation.set(time * 0.13 + shell, angle, time * 0.2 + angle);
        const scale = 0.45 + (shell === 0 ? bass : shell === 3 ? treble : mid) * 0.9 +
          (Math.sin(time * 1.8 + angle * 6) + 1) * 0.12;
        object.scale.set(scale * 0.72, scale * (1.3 + shell * 0.14), scale * 0.72);
        object.updateMatrix();
        crystals.setMatrixAt(i, object.matrix);
        color.setHex([0xf0adbc, 0xc6b0ee, 0x8ecac6, 0xf2d090][shell]);
        crystals.setColorAt(i, color);
      }
      crystals.instanceMatrix.needsUpdate = true;
      crystals.instanceColor.needsUpdate = true;
      group.rotation.z += delta * 0.06;
    }
  };
}

function helixMode() {
  const group = new THREE.Group();
  const count = 240;
  const beads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    count
  );
  beads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beads.frustumCulled = false;
  const strands = [0, 1].map((strand) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(120 * 3), 3));
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: strand ? 0xeacb8b : 0x8bd3d4,
      transparent: true,
      opacity: 0.55
    }));
    group.add(line);
    return geometry;
  });
  group.add(beads);
  return {
    group,
    camera: [0, 0, 13],
    update(signals, time) {
      const bass = level(signals.bass);
      const mid = level(signals.mid);
      for (let strand = 0; strand < 2; strand += 1) {
        const position = strands[strand].attributes.position;
        for (let i = 0; i < 120; i += 1) {
          const progress = i / 119;
          const angle = progress * Math.PI * 7 + time * (0.35 + mid * 0.25) + strand * Math.PI;
          const radius = 1.3 + bass * 0.48 + Math.sin(progress * 25 - time * 2) * level(signals.treble) * 0.16;
          const x = Math.cos(angle) * radius;
          const y = (progress - 0.5) * 7.4;
          const z = Math.sin(angle) * radius;
          position.setXYZ(i, x, y, z);
          object.position.set(x, y, z);
          object.rotation.set(0, 0, 0);
          object.scale.setScalar(0.7 + (strand ? mid : bass) * 1.3 + level(signals.beat) * 0.25);
          object.updateMatrix();
          const index = strand * 120 + i;
          beads.setMatrixAt(index, object.matrix);
          color.setHex(strand ? 0xeacb8b : 0x8bd3d4);
          beads.setColorAt(index, color);
        }
        position.needsUpdate = true;
      }
      beads.instanceMatrix.needsUpdate = true;
      beads.instanceColor.needsUpdate = true;
    }
  };
}

function liquidMode() {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(10.5, 10.5, 72, 72);
  geometry.rotateX(-Math.PI / 2);
  const base = new Float32Array(geometry.attributes.position.array);
  const surface = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
    color: 0x9bbac5,
    metalness: 0.72,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
    emissive: 0x1c5157,
    emissiveIntensity: 0.2
  }));
  const grid = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: 0xc5e9e1,
    wireframe: true,
    transparent: true,
    opacity: 0.13,
    depthWrite: false
  }));
  grid.scale.setScalar(1.003);
  group.add(surface, grid);
  return {
    group,
    camera: [0, 5.6, 10.2],
    update(signals, time) {
      const position = geometry.attributes.position;
      const bass = level(signals.bass);
      const mid = level(signals.mid);
      const treble = level(signals.treble);
      for (let i = 0; i < position.count; i += 1) {
        const x = base[i * 3];
        const z = base[i * 3 + 2];
        const radius = Math.hypot(x, z);
        const broad = Math.sin(radius * 2.2 - time * 2.1) * (0.12 + bass * 0.45);
        const crossing = Math.sin(x * 2.6 + time * 1.6) * Math.cos(z * 2.2 - time) * (0.06 + mid * 0.22);
        const detail = Math.sin((x + z) * 6 - time * 4) * treble * 0.05;
        position.setY(i, broad + crossing + detail);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      surface.material.emissiveIntensity = 0.12 + level(signals.beat) * 0.42;
      grid.material.opacity = 0.11 + level(signals.energy) * 0.16;
    }
  };
}

function pulsarMode() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 2), new THREE.MeshStandardMaterial({
    color: 0xffd397,
    metalness: 0.15,
    roughness: 0.25,
    emissive: 0xb56324,
    emissiveIntensity: 1.1,
    flatShading: true
  }));
  const rays = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 1, 0.055),
    new THREE.MeshBasicMaterial({ color: 0xf6c281, transparent: true, opacity: 0.72 }),
    64
  );
  rays.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rays.frustumCulled = false;
  const rings = [1.9, 2.7, 3.6].map((radius, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018 + i * 0.004, 8, 128),
      new THREE.MeshBasicMaterial({ color: i === 1 ? 0x8fc9c3 : 0xe9be83, transparent: true, opacity: 0.5 })
    );
    group.add(ring);
    return ring;
  });
  group.add(core, rays);
  return {
    group,
    camera: [0, 0, 11.8],
    update(signals, time) {
      const bass = level(signals.bass);
      const beat = level(signals.beat);
      const treble = level(signals.treble);
      core.scale.setScalar(1 + bass * 0.25 + beat * 0.19);
      core.rotation.set(time * 0.12, time * 0.23, 0);
      core.material.emissiveIntensity = 0.72 + bass * 1.25 + beat * 0.8;
      rings.forEach((ring, i) => {
        ring.scale.setScalar(1 + beat * (0.05 + i * 0.045));
        ring.rotation.x = Math.sin(time * 0.2 + i) * 0.2;
        ring.rotation.z = time * (i % 2 ? -0.055 : 0.07);
      });
      for (let i = 0; i < 64; i += 1) {
        const angle = i / 64 * TAU;
        const strength = 0.55 + Math.sin(angle * 9 - time * 2.2) * 0.24 + treble * 1.15 + beat * 0.65;
        object.position.set(Math.cos(angle) * (2.25 + strength * 0.42), Math.sin(angle) * (2.25 + strength * 0.42), 0);
        object.rotation.set(0, 0, angle - Math.PI / 2);
        object.scale.set(1, strength, 1);
        object.updateMatrix();
        rays.setMatrixAt(i, object.matrix);
      }
      rays.instanceMatrix.needsUpdate = true;
    }
  };
}

function tunnelMode() {
  const group = new THREE.Group();
  const rings = Array.from({ length: 24 }, (_, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.025 + (i % 4) * 0.006, 8, 96),
      new THREE.MeshBasicMaterial({
        color: [0x91d5b6, 0xd9bd7e, 0x8bbbd2, 0xb9a1d5][i % 4],
        transparent: true,
        opacity: 0.35 + (i % 4) * 0.07
      })
    );
    group.add(ring);
    return ring;
  });
  return {
    group,
    camera: [0, 0, 10.5],
    lookAt: [0, 0, -5],
    update(signals, time) {
      const bass = level(signals.bass);
      const beat = level(signals.beat);
      const treble = level(signals.treble);
      rings.forEach((ring, i) => {
        const travel = (time * (0.85 + bass * 1.7) + i * 1.35) % 32;
        ring.position.z = -26 + travel;
        ring.position.x = Math.sin(i * 0.32 + time * 0.3) * 0.14;
        ring.position.y = Math.cos(i * 0.38 + time * 0.26) * 0.14;
        ring.rotation.z = time * 0.08 + i * 0.11;
        ring.scale.setScalar(1 + beat * 0.08 + treble * 0.08);
        ring.material.opacity = Math.min(0.84, 0.2 + travel / 32 * 0.5 + beat * 0.15);
      });
    }
  };
}

const builders = {
  sphere: sphereMode,
  orbits: orbitMode,
  ribbons: ribbonMode,
  spires: spireMode,
  galaxy: galaxyMode,
  crystals: crystalMode,
  helix: helixMode,
  liquid: liquidMode,
  pulsar: pulsarMode,
  tunnel: tunnelMode
};

export function createSculpturalModes(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07100f);
  scene.add(makeStars());
  scene.add(new THREE.AmbientLight(0xc4d7d0, 1.4));
  const key = new THREE.PointLight(0xe7c894, 62, 28);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0x81cbb8, 44, 30);
  rim.position.set(4, -2, -2);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const cache = new Map();
  let active = null;
  let aspect = 1;

  function resize(width, height) {
    aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  function setMode(mode, accent) {
    if (active) active.group.visible = false;
    if (!mode) {
      active = null;
      return;
    }
    if (!cache.has(mode)) {
      const created = builders[mode]();
      scene.add(created.group);
      cache.set(mode, created);
    }
    active = cache.get(mode);
    active.group.visible = true;
    key.color.setHex(accent ?? 0xe7c894);
    rim.color.setHex(mode === 'sphere' ? 0x8ed9bc : 0x91b8d1);
  }

  function render(signals, time, delta) {
    if (!active) return;
    const framing = aspect < 0.9 ? (active.mobileFraming ?? 1.15) : 1;
    camera.position.set(...active.camera.map((axis) => axis * framing));
    camera.lookAt(...(active.lookAt ?? [0, 0, 0]));
    active.update(signals, time, delta);
    key.intensity = 45 + level(signals.bass) * 35;
    rim.intensity = 32 + level(signals.treble) * 28;
    renderer.render(scene, camera);
  }

  return { resize, setMode, render };
}
