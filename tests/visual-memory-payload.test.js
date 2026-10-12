import test from 'node:test';
import assert from 'node:assert/strict';
import { keccak256, toUtf8Bytes } from 'ethers';
import { createVisualMemoryPayload } from '../src/monad/wallet.js';
import { VISUALIZER_PACKS } from '../src/visualizers/packs.js';

test('visual memory payload binds renderer data and taste memory to one hash', () => {
  const pack = {
    id: 'nano-hex',
    name: 'Nano Hex Genesis',
    wave: 'radial',
    shaderMode: 0,
    lift: 1,
    tilt: 1,
    compression: 1,
    warp: 1,
    reflection: 1,
    socket: 1
  };
  const payload = createVisualMemoryPayload({
    pack,
    sensitivity: 1.2,
    autoMode: true,
    styleBrief: 'Dark luxury visuals for an afrobeats event.'
  });

  const visualCode = JSON.parse(payload.visualCode);
  const tasteProfile = JSON.parse(payload.tasteProfile);
  const metadata = JSON.parse(Buffer.from(payload.metadataUri.split(',')[1], 'base64').toString());

  assert.equal(visualCode.schema, 'papagedon.visual.v1');
  assert.equal(visualCode.pack.id, 'nano-hex');
  assert.equal(tasteProfile.styleBrief, 'Dark luxury visuals for an afrobeats event.');
  assert.equal(metadata.name, 'Papagedon Visual Memory: Nano Hex Genesis');
  assert.equal(
    payload.contentHash,
    keccak256(toUtf8Bytes(`${payload.visualCode}\u0000${payload.tasteProfile}`))
  );
});

test('all 3D scenes retain complete Visual Memory renderer metadata', () => {
  const scenes = VISUALIZER_PACKS.filter((pack) => pack.sceneMode);
  assert.equal(scenes.length, 10);
  assert.equal(new Set(VISUALIZER_PACKS.map((pack) => pack.id)).size, VISUALIZER_PACKS.length);

  for (const pack of scenes) {
    const payload = createVisualMemoryPayload({
      pack,
      sensitivity: 1.2,
      autoMode: false,
      styleBrief: 'Music reactive 3D scene.'
    });
    const savedPack = JSON.parse(payload.visualCode).pack;
    assert.equal(savedPack.id, pack.id);
    assert.equal(savedPack.shaderMode, pack.shaderMode);
    assert.equal(savedPack.sceneMode, pack.sceneMode);
    for (const property of ['lift', 'tilt', 'compression', 'warp', 'reflection', 'socket']) {
      assert.equal(typeof savedPack[property], 'number', `${pack.id}.${property}`);
    }
  }
});
