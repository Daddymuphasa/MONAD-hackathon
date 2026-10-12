import * as THREE from 'three';
import { VISUALIZER_PACKS } from './packs.js';
import { createElectricNetwork } from './electric-network.js';
import { createSculpturalModes } from './sculptural-modes.js';

const PLATE_COUNT = 1073;
const tmpObject = new THREE.Object3D();
const tmpColor = new THREE.Color();
const silver = new THREE.Color(0xb0b7ba);
const graphite = new THREE.Color(0x586065);
const socketAccent = new THREE.Color(0xb0b7ba);

export function createNanoHexVisualizer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x050a0f, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;
  const sculpturalModes = createSculpturalModes(renderer);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a0f, 0.017);

  const camera = new THREE.OrthographicCamera(-11, 11, 11, -11, 0.1, 100);
  camera.position.set(0, 24, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const socketGeometry = new THREE.CylinderGeometry(0.478, 0.478, 0.035, 6, 1, false);
  let currentPack = VISUALIZER_PACKS[0];

  const plateMaterial = new THREE.MeshStandardMaterial({
    color: currentPack.plateColor,
    metalness: 0.23,
    roughness: 0.36,
    flatShading: true,
    emissive: 0x06090b,
    emissiveIntensity: 0.12
  });

  const plates = new THREE.InstancedMesh(currentPack.plateGeometry, plateMaterial, PLATE_COUNT);
  plates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  plates.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PLATE_COUNT * 3), 3);
  plates.frustumCulled = false;
  scene.add(plates);

  const insetMaterial = new THREE.MeshStandardMaterial({
    color: currentPack.insetColor,
    metalness: 0.18,
    roughness: 0.42,
    emissive: 0x030506,
    emissiveIntensity: 0.1
  });
  const insets = new THREE.InstancedMesh(currentPack.insetGeometry, insetMaterial, PLATE_COUNT);
  insets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  insets.frustumCulled = false;
  scene.add(insets);

  const details = new THREE.InstancedMesh(
    VISUALIZER_PACKS[1].detailGeometry,
    VISUALIZER_PACKS[1].detailMaterial,
    PLATE_COUNT
  );
  details.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  details.frustumCulled = false;
  details.visible = false;
  scene.add(details);

  const sockets = new THREE.InstancedMesh(socketGeometry, new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false
  }), PLATE_COUNT);
  sockets.frustumCulled = false;
  scene.add(sockets);

  const contactShadows = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.006, 6, 1, false),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    }),
    PLATE_COUNT
  );
  contactShadows.frustumCulled = false;
  scene.add(contactShadows);

  const positions = buildHexPositions(PLATE_COUNT);
  const heights = new Float32Array(PLATE_COUNT);
  positions.forEach((plate, index) => {
    tmpObject.position.set(plate.x, -0.17, plate.z);
    tmpObject.rotation.set(0, 0, 0);
    tmpObject.scale.setScalar(1);
    tmpObject.updateMatrix();
    sockets.setMatrixAt(index, tmpObject.matrix);
    tmpColor.copy(plate.accent ? silver : graphite).multiplyScalar(0.065);
    sockets.setColorAt(index, tmpColor);
    tmpObject.position.y = -0.12;
    tmpObject.updateMatrix();
    contactShadows.setMatrixAt(index, tmpObject.matrix);
  });
  sockets.instanceMatrix.needsUpdate = true;
  sockets.instanceColor.needsUpdate = true;
  contactShadows.instanceMatrix.needsUpdate = true;

  const underGlow = createUnderGlow();
  scene.add(underGlow);
  const electricNetwork = createElectricNetwork(positions);
  scene.add(electricNetwork.group);

  function setVariant(id) {
    const next = VISUALIZER_PACKS.find((pack) => pack.id === id);
    if (!next) return currentPack;
    currentPack = next;
    if (next.sceneMode) {
      sculpturalModes.setMode(next.sceneMode, next.glowColor);
      sculpturalModes.resize(canvas.clientWidth, canvas.clientHeight);
      return next;
    }
    sculpturalModes.setMode(null);
    socketAccent.setHex(next.glowColor ?? 0xb0b7ba);
    plates.geometry = next.plateGeometry;
    plateMaterial.color.setHex(next.plateColor);
    insets.geometry = next.insetGeometry;
    insetMaterial.color.setHex(next.insetColor);
    details.visible = Boolean(next.detailGeometry);
    if (next.detailGeometry) {
      details.geometry = next.detailGeometry;
      details.material = next.detailMaterial;
    }
    electricNetwork.group.visible = Boolean(next.electric);
    underGlow.material.uniforms.uMode.value = next.shaderMode;
    underGlow.material.uniforms.uTint.value.setHex(next.glowColor ?? 0xffffff);
    return next;
  }

  const coreLight = new THREE.PointLight(0xcbd1d1, 11, 42, 1.2);
  coreLight.position.set(0, 11, 3);
  scene.add(coreLight);

  const sideLight = new THREE.PointLight(0x858c90, 9, 35, 1.2);
  sideLight.position.set(-5.4, 10, -4);
  scene.add(sideLight);

  const rimLight = new THREE.DirectionalLight(0xe7f0f2, 3.2);
  rimLight.position.set(5, 9, 7);
  scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0xc1cbd0, 2.25));

  let lastFrame = 0;
  let lastBeat = 0;
  let lastImpactAt = -1000;
  const impacts = [];

  function triggerImpact(x = 0, z = 0, strength = 1) {
    impacts.push({ x, z, started: performance.now(), strength });
    if (impacts.length > 4) impacts.shift();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    sculpturalModes.resize(rect.width, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, rect.width < 720 ? 1.25 : 1.5);
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setPixelRatio(ratio);
      renderer.setSize(rect.width, rect.height, false);
      const aspect = rect.width / Math.max(1, rect.height);
      const halfHeight = Math.min(rect.width < 720 ? 9.6 : 8.7, 14.2 / aspect);
      const halfWidth = halfHeight * aspect;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }
  }

  function render(signals) {
    const now = performance.now();
    if (now - lastFrame < (canvas.clientWidth < 720 ? 33 : 20)) return;
    const delta = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    resize();

    const time = now / 1000;
    if (currentPack.sceneMode) {
      sculpturalModes.render(signals, time, delta);
      return;
    }
    const beat = Math.max(0, signals.beat || 0);
    const bass = Math.max(0, signals.bass || 0);
    const pulse = Math.max(0, signals.pulse || 0);
    const energy = Math.max(0, signals.energy || 0);
    if (beat > 0.72 && lastBeat <= 0.72 && now - lastImpactAt > 160) {
      triggerImpact(0, 0, Math.min(1.45, 0.78 + bass));
      lastImpactAt = now;
    }
    lastBeat = beat;
    while (impacts.length && now - impacts[0].started > 3000) impacts.shift();

    for (let index = 0; index < positions.length; index += 1) {
      const plate = positions[index];
      let front = 0;
      let tail = 0;
      let warpX = 0;
      let warpZ = 0;
      for (const impact of impacts) {
        const age = (now - impact.started) / 1000;
        const dx = plate.x - impact.x;
        const dz = plate.z - impact.z;
        const distance = Math.hypot(dx, dz);
        let waveDistance = distance - age * 6.7;
        if (currentPack.wave === 'faceted') {
          waveDistance += Math.sin(Math.atan2(dz, dx) * 6) * 0.36;
        } else if (currentPack.wave === 'spiral') {
          waveDistance += Math.atan2(dz, dx) * 0.42;
        } else if (currentPack.wave === 'diamond') {
          waveDistance = (Math.abs(dx) + Math.abs(dz)) * 0.84 - age * 6.7;
        } else if (currentPack.wave === 'fracture') {
          waveDistance += Math.sin(plate.x * 1.4 + plate.z * 0.8) * 0.32;
        } else if (currentPack.wave === 'rings') {
          waveDistance += Math.sin(distance * 2.8) * 0.24;
        } else if (currentPack.wave === 'tide') {
          waveDistance = Math.abs(dz) - age * 6.7;
        } else if (currentPack.wave === 'cross') {
          waveDistance = Math.min(Math.abs(dx), Math.abs(dz)) * 1.7 - age * 6.7;
        } else if (currentPack.wave === 'shard') {
          waveDistance += Math.sin(Math.atan2(dz, dx) * 9) * 0.48;
        } else if (currentPack.wave === 'chevron') {
          waveDistance = Math.abs(dx + dz) * 0.82 - age * 6.7;
        }
        const fade = Math.max(0, 1 - age / 3);
        const leading = Math.exp(-waveDistance * waveDistance / 0.52) * impact.strength * fade;
        const trailingDistance = waveDistance + 0.85;
        const trailing = Math.exp(-trailingDistance * trailingDistance / 1.6) * impact.strength * fade;
        front += leading;
        tail += trailing;
        if (distance > 0.01) {
          warpX += dx / distance * (leading * 0.068 - trailing * 0.022) * currentPack.warp;
          warpZ += dz / distance * (leading * 0.068 - trailing * 0.022) * currentPack.warp;
        }
      }
      front = Math.min(1.35, front);
      tail = Math.min(1, tail);
      const spatialPulse = 0.55 + 0.45 * Math.sin(plate.radius * 1.35 - time * 5.2);
      const liveBass = Math.min(1, bass * 0.8 + pulse * 0.7) * spatialPulse;
      const target = 0.018 + liveBass * 0.2 +
        (front * (0.56 + bass * 0.18) + tail * 0.055) * currentPack.lift;
      heights[index] += (target - heights[index]) * Math.min(1, delta * 8);
      const lift = heights[index];
      const lean = Math.min(0.085, front * 0.058 * currentPack.tilt);

      tmpObject.position.set(
        plate.x + warpX,
        lift,
        plate.z + warpZ
      );
      tmpObject.rotation.set(
        lean * Math.sin(plate.angle),
        0,
        lean * Math.cos(plate.angle)
      );
      const compression = Math.max(0.925, 1 - front * 0.045 * currentPack.compression + tail * 0.008);
      tmpObject.scale.set(compression, 1, compression);
      tmpObject.updateMatrix();
      plates.setMatrixAt(index, tmpObject.matrix);

      tmpObject.position.y = lift + currentPack.insetOffset;
      tmpObject.updateMatrix();
      insets.setMatrixAt(index, tmpObject.matrix);

      if (details.visible) {
        tmpObject.position.y = lift + currentPack.detailOffset;
        tmpObject.updateMatrix();
        details.setMatrixAt(index, tmpObject.matrix);
      }

      const reflection = 0.7 + liveBass * 0.5 + front * 0.6 * currentPack.reflection + tail * 0.14;
      tmpColor.setRGB(reflection, reflection, reflection);
      plates.setColorAt(index, tmpColor);
      const insetReflection = 0.64 + liveBass * 0.32 + front * 0.36 * currentPack.reflection + tail * 0.07;
      tmpColor.setRGB(insetReflection, insetReflection, insetReflection);
      insets.setColorAt(index, tmpColor);
      if (details.visible) {
        const detailReflection = 0.7 + liveBass * 0.28 + front * 0.42 * currentPack.reflection;
        tmpColor.setRGB(detailReflection, detailReflection, detailReflection);
        details.setColorAt(index, tmpColor);
      }

      const metalShift = 0.5 + 0.5 * Math.sin(time * 0.3 + plate.x * 0.18 + plate.z * 0.26);
      tmpColor.copy(graphite).lerp(socketAccent, metalShift);
      tmpColor.multiplyScalar((0.055 + liveBass * 0.34 + front * (0.48 + bass * 0.18) + tail * 0.09) * currentPack.socket);
      sockets.setColorAt(index, tmpColor);
    }

    plates.instanceMatrix.needsUpdate = true;
    plates.instanceColor.needsUpdate = true;
    insets.instanceMatrix.needsUpdate = true;
    insets.instanceColor.needsUpdate = true;
    if (details.visible) {
      details.instanceMatrix.needsUpdate = true;
      details.instanceColor.needsUpdate = true;
    }
    sockets.instanceColor.needsUpdate = true;

    underGlow.material.uniforms.uTime.value = time;
    underGlow.material.uniforms.uBass.value = bass;
    underGlow.material.uniforms.uBeat.value = beat;
    underGlow.material.uniforms.uEnergy.value = energy;
    if (electricNetwork.group.visible) electricNetwork.update(impacts, now, bass);
    const latestImpact = impacts[impacts.length - 1];
    underGlow.material.uniforms.uImpactStrength.value = latestImpact
      ? latestImpact.strength * Math.max(0, 1 - (now - latestImpact.started) / 3000)
      : 0;
    underGlow.material.uniforms.uImpactRadius.value = latestImpact
      ? (now - latestImpact.started) / 1000 * 6.7
      : 0;
    if (latestImpact) {
      underGlow.material.uniforms.uImpactOrigin.value.set(latestImpact.x, -latestImpact.z);
    }

    coreLight.intensity = 11 + bass * 8;
    sideLight.intensity = 9 + signals.treble * 6;

    camera.position.x = 0;
    camera.position.y = 24;
    camera.position.z = 0;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width * 2 - 1) * camera.right;
    const z = ((event.clientY - rect.top) / rect.height * 2 - 1) * camera.top;
    triggerImpact(x, z);
  });

  return { resize, render, triggerImpact, setVariant };
}

function buildHexPositions(limit) {
  const plates = [];
  const spacingX = 0.825;
  const spacingZ = 0.715;
  const rows = 14;
  const columns = 18;

  for (let row = -rows; row <= rows; row += 1) {
    for (let col = -columns; col <= columns; col += 1) {
      const x = (col + (Math.abs(row) % 2) * 0.5) * spacingX;
      const z = row * spacingZ;
      const radius = Math.hypot(x, z);
      plates.push({
        x,
        z,
        row,
        col,
        radius,
        angle: Math.atan2(z, x),
        accent: Math.sin(x * 0.8 + z * 0.45) > 0.83
      });
    }
  }

  return plates.sort((a, b) => a.radius - b.radius).slice(0, limit);
}

function createUnderGlow() {
  const material = new THREE.ShaderMaterial({
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uBeat: { value: 0 },
      uEnergy: { value: 0 },
      uImpactOrigin: { value: new THREE.Vector2(0, 0) },
      uImpactRadius: { value: 0 },
      uImpactStrength: { value: 0 },
      uMode: { value: 0 },
      uTint: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform float uBass;
      uniform float uBeat;
      uniform float uEnergy;
      uniform vec2 uImpactOrigin;
      uniform float uImpactRadius;
      uniform float uImpactStrength;
      uniform float uMode;
      uniform vec3 uTint;

      void main() {
        vec2 p = (vUv - 0.5) * vec2(32.0, 26.0);
        vec2 delta = p - uImpactOrigin;
        float distanceFromImpact = length(delta);
        float textureDetail = 0.5 + 0.5 * sin(p.x * 0.22 + uTime * 0.3);
        if (uMode > 8.5) {
          distanceFromImpact = abs(delta.x + delta.y) * 0.82;
          textureDetail = abs(sin(p.x * 1.2 + p.y * 1.2));
        } else if (uMode > 7.5) {
          distanceFromImpact += sin(atan(delta.y, delta.x) * 9.0) * 0.48;
          textureDetail = abs(sin(p.x * 1.7 - p.y * 0.7));
        } else if (uMode > 6.5) {
          distanceFromImpact = min(abs(delta.x), abs(delta.y)) * 1.7;
          textureDetail = max(abs(sin(p.x * 1.6)), abs(sin(p.y * 1.6)));
        } else if (uMode > 5.5) {
          distanceFromImpact = abs(delta.y);
          textureDetail = 0.5 + 0.5 * sin(p.y * 1.1);
        } else if (uMode > 4.5) {
          distanceFromImpact += sin(distanceFromImpact * 2.8) * 0.24;
          textureDetail = 0.5 + 0.5 * sin(length(p) * 1.5);
        } else if (uMode > 3.5) {
          textureDetail = max(abs(sin(p.x * 1.5)), abs(sin(p.y * 1.5)));
        } else if (uMode > 2.5) {
          distanceFromImpact = (abs(delta.x) + abs(delta.y)) * 0.84;
          textureDetail = max(abs(sin(p.x * 2.4)), abs(sin(p.y * 2.4)));
        } else if (uMode > 1.5) {
          distanceFromImpact += atan(delta.y, delta.x) * 0.42;
          textureDetail = 0.5 + 0.5 * sin(length(p) * 1.3);
        } else if (uMode > 0.5) {
          distanceFromImpact += sin(atan(delta.y, delta.x) * 6.0) * 0.36;
          textureDetail = abs(sin(p.x * 1.4 + p.y * 0.7));
        }
        float band = distanceFromImpact - uImpactRadius;
        float ripple = exp(-band * band / 0.85) * uImpactStrength;
        if (uMode > 3.5) ripple *= 0.25;
        float power = 0.3 + uEnergy * 0.28 + uBass * 0.42 + uBeat * 0.16;
        vec3 graphite = vec3(0.008, 0.009, 0.011);
        vec3 silver = mix(vec3(0.055), vec3(0.15), textureDetail) * uTint;
        float floorGlow = (uBass * 0.24 + uEnergy * 0.12) * textureDetail;
        gl_FragColor = vec4(graphite + silver * (floorGlow + ripple * power), 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 26, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.23;
  return mesh;
}
