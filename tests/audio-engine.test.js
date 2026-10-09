import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/audio/audio-engine.js';

test('microphone and file playback share prompt bass onset analysis', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const originalPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance');
  let now = 0;
  let bassLevel = 0;
  let mediaSourceCreations = 0;
  const player = {
    src: '',
    paused: true,
    ended: false,
    currentTime: 0,
    load() {},
    pause() { this.paused = true; },
    async play() { this.paused = false; }
  };

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } }
  });
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: { now: () => now }
  });
  Object.defineProperty(globalThis, 'AudioContext', {
    configurable: true,
    value: class {
      destination = {};
      createAnalyser() {
        return {
          frequencyBinCount: 1024,
          getByteFrequencyData(data) {
            data.fill(0);
            data.fill(Math.round(bassLevel * 255), 2, 16);
          }
        };
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createMediaElementSource() {
        mediaSourceCreations += 1;
        return { connect() {}, disconnect() {} };
      }
      async resume() {}
      async close() {}
    }
  });

  try {
    const audio = createAudioEngine(player);
    await audio.start();
    assert.equal(audio.sample().beat, 0);

    now = 100;
    bassLevel = 0.6;
    assert.equal(audio.sample().beat, 1);

    now = 400;
    assert.ok(audio.sample().beat < 1);

    now = 450;
    bassLevel = 0;
    audio.sample();
    now = 700;
    bassLevel = 0.6;
    assert.equal(audio.sample().beat, 1);
    await audio.stop();

    await audio.loadFile(new Blob([0], { type: 'audio/wav' }));
    assert.ok(player.src.startsWith('blob:'));
    bassLevel = 0;
    now = 800;
    await audio.playFile();
    assert.equal(audio.sample().beat, 0);
    now = 840;
    bassLevel = 0.6;
    assert.equal(audio.sample().beat, 1);
    audio.pauseFile();
    assert.equal(audio.sample().beat, 0);
    await audio.playFile();
    assert.equal(mediaSourceCreations, 1);
    await audio.dispose();
  } finally {
    for (const [name, descriptor] of [
      ['navigator', originalNavigator],
      ['AudioContext', originalAudioContext],
      ['performance', originalPerformance]
    ]) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});
