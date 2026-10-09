import * as THREE from 'three';

const PLATE_COUNT = 620;
const tmpObject = new THREE.Object3D();
const tmpColor = new THREE.Color();

export function createNanoHexVisualizer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x03050b, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050814, 0.032);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  camera.position.set(0, 8.5, 15.5);
  camera.lookAt(0, 0, 0);

  const plateGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 6, 1, false);
  plateGeometry.rotateY(Math.PI / 6);

  const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0x111923,
    metalness: 0.82,
    roughness: 0.28,
    emissive: 0x050812,
    emissiveIntensity: 0.45
  });

  const plates = new THREE.InstancedMesh(plateGeometry, plateMaterial, PLATE_COUNT);
  plates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  plates.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PLATE_COUNT * 3), 3);
  scene.add(plates);

  const positions = buildHexPositions(PLATE_COUNT);
  const baseColors = positions.map((plate) => {
    const tint = plate.seed * 0.55 + plate.radius * 0.035;
    return new THREE.Color().setHSL(0.56 + tint * 0.16, 0.72, 0.34);
  });

  const underGlow = createUnderGlow();
  scene.add(underGlow);

  const coreLight = new THREE.PointLight(0x39e8ff, 42, 34, 1.6);
  coreLight.position.set(0, 3.2, 2);
  scene.add(coreLight);

  const magentaLight = new THREE.PointLight(0xff35bd, 26, 28, 1.8);
  magentaLight.position.set(-5.4, 2.2, -4);
  scene.add(magentaLight);

  const rimLight = new THREE.DirectionalLight(0x9edcff, 2.4);
  rimLight.position.set(5, 9, 7);
  scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0x1a2440, 1.25));

  const starField = createStarField();
  scene.add(starField);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(rect.width, rect.height, false);
      renderer.setPixelRatio(ratio);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }
  }

  function render(signals) {
    resize();

    const time = performance.now() / 1000;
    const beat = signals.beat * signals.beat;
    const bassPower = signals.bass * 1.25 + beat * 1.8;
    const energy = signals.energy;

    for (let index = 0; index < positions.length; index += 1) {
      const plate = positions[index];
      const waveA = Math.sin(plate.radius * 1.95 - time * (3.2 + signals.bass * 4.4));
      const waveB = Math.sin(plate.angle * 5.0 + plate.radius * 3.8 - time * 5.4);
      const lift = Math.max(0, waveA * 0.72 + waveB * 0.28) * bassPower;
      const micro = Math.sin(time * 7 + plate.seed * 11) * signals.treble * 0.06;
      const y = lift * 1.55 + micro;
      const scale = 0.92 + lift * 0.18 + beat * 0.08;

      tmpObject.position.set(plate.x, y, plate.z);
      tmpObject.rotation.set(
        lift * 0.16 * Math.sin(plate.angle),
        Math.PI / 6 + lift * 0.12,
        lift * 0.16 * Math.cos(plate.angle)
      );
      tmpObject.scale.setScalar(scale);
      tmpObject.updateMatrix();
      plates.setMatrixAt(index, tmpObject.matrix);

      tmpColor.copy(baseColors[index]);
      tmpColor.lerp(new THREE.Color(0x11f2ff), Math.min(1, lift * 0.65 + signals.treble * 0.24));
      tmpColor.offsetHSL(0, 0.1 + energy * 0.25, lift * 0.22);
      plates.setColorAt(index, tmpColor);
    }

    plates.instanceMatrix.needsUpdate = true;
    plates.instanceColor.needsUpdate = true;

    underGlow.material.uniforms.uTime.value = time;
    underGlow.material.uniforms.uBass.value = signals.bass;
    underGlow.material.uniforms.uBeat.value = beat;
    underGlow.material.uniforms.uEnergy.value = energy;

    coreLight.intensity = 32 + signals.bass * 70 + beat * 80;
    magentaLight.intensity = 18 + signals.treble * 42;

    camera.position.x = Math.sin(time * 0.18) * 1.2;
    camera.position.y = 8.2 + beat * 0.5;
    camera.position.z = 15.2 - energy * 1.2;
    camera.lookAt(0, 0.25 + beat * 0.35, 0);

    starField.rotation.y = time * 0.025;
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize);

  return { resize, render };
}

function buildHexPositions(limit) {
  const plates = [];
  const spacing = 0.86;
  const rows = 18;
  const columns = 36;

  for (let row = -rows; row <= rows; row += 1) {
    for (let col = -columns; col <= columns; col += 1) {
      const x = (col + (Math.abs(row) % 2) * 0.5) * spacing;
      const z = row * spacing * 0.76;
      const radius = Math.hypot(x, z);
      if (radius > 13.8 || plates.length >= limit) continue;
      plates.push({
        x,
        z,
        radius,
        angle: Math.atan2(z, x),
        seed: fract(Math.sin((x * 12.9898 + z * 78.233) * 43758.5453))
      });
    }
  }

  return plates.sort((a, b) => a.radius - b.radius).slice(0, limit);
}

function createUnderGlow() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uBeat: { value: 0 },
      uEnergy: { value: 0 }
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

      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float d = length(uv);
        float ripple = sin(d * 38.0 - uTime * (5.0 + uBass * 8.0));
        float veins = sin((uv.x - uv.y) * 28.0 + uTime * 2.5) * sin((uv.x + uv.y) * 18.0 - uTime * 1.7);
        float mask = smoothstep(1.0, 0.12, d);
        float power = 0.14 + uEnergy * 0.5 + uBass * 0.8 + uBeat * 1.4;
        vec3 cyan = vec3(0.02, 0.92, 1.0);
        vec3 violet = vec3(0.52, 0.12, 1.0);
        vec3 magenta = vec3(1.0, 0.12, 0.72);
        vec3 color = mix(violet, cyan, 0.5 + 0.5 * ripple);
        color = mix(color, magenta, uBeat * 0.45);
        float alpha = mask * power * (0.34 + max(ripple, 0.0) * 0.45 + max(veins, 0.0) * 0.18);
        gl_FragColor = vec4(color * alpha * 2.2, alpha);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 26, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.14;
  return mesh;
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const points = new Float32Array(360 * 3);

  for (let index = 0; index < 360; index += 1) {
    const i = index * 3;
    const angle = index * 9.399;
    const radius = 18 + fract(Math.sin(index * 87.23) * 31.11) * 24;
    points[i] = Math.cos(angle) * radius;
    points[i + 1] = 4 + fract(Math.sin(index * 19.91) * 17.71) * 13;
    points[i + 2] = Math.sin(angle) * radius - 8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x6ddfff,
      size: 0.035,
      transparent: true,
      opacity: 0.44,
      blending: THREE.AdditiveBlending
    })
  );
}

function fract(value) {
  return value - Math.floor(value);
}
