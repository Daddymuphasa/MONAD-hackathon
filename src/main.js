import './styles/app.css';
import { createAudioEngine } from './audio/audio-engine.js';
import { createNanoHexVisualizer } from './visualizers/nano-hex.js';
import { VISUALIZER_PACKS } from './visualizers/packs.js';
import { MONAD_TESTNET, buildPackQuote } from './monad/monad-testnet.js';

const app = document.querySelector('#app');
const packOptions = VISUALIZER_PACKS.map((pack) => `<option value="${pack.id}">${pack.name}</option>`).join('');

app.innerHTML = `
  <section class="shell">
    <canvas id="visualizer" aria-label="Papageddon live nanotech visualizer"></canvas>
    <div class="display-frame" aria-hidden="true">
      <span class="frame-corner top-left"></span>
      <span class="frame-corner top-right"></span>
      <span class="frame-corner bottom-left"></span>
      <span class="frame-corner bottom-right"></span>
      <span class="frame-notch top-notch"></span>
      <span class="frame-notch bottom-notch"></span>
    </div>
    <aside class="panel">
      <button id="dockToggle" class="dock-toggle" type="button" aria-label="Pin controls" aria-pressed="false" aria-expanded="false" title="Pin controls">
        <span class="dock-icon" aria-hidden="true">&#9776;</span>
        <span class="dock-name" aria-hidden="true">PAPAGEDDON</span>
      </button>
      <div class="panel-content">
      <div class="brand">
        <span class="mark"></span>
        <div>
          <p>PAPAGEDDON</p>
          <strong>Monad visual runtime</strong>
        </div>
      </div>

      <div class="status-grid">
        <span>Input</span><b id="listenState">idle</b>
        <span>Music lock</span><b id="musicLock">waiting</b>
        <span>Impact</span><b id="impactState">ready</b>
        <span>Render pack</span><b id="packState">Nano Hex Genesis</b>
        <span>Network</span><b>${MONAD_TESTNET.name}</b>
      </div>

      <div class="pack-switch">
        <label for="packSelect">Visual Pack</label>
        <select id="packSelect">${packOptions}</select>
      </div>

      <div class="meters">
        <label>Bass <i id="bassMeter"></i></label>
        <label>Mid <i id="midMeter"></i></label>
        <label>Treble <i id="trebleMeter"></i></label>
        <label>Energy <i id="energyMeter"></i></label>
      </div>

      <div class="track-player">
        <div class="track-heading"><span>Audio Track</span><b id="trackState">none</b></div>
        <input id="trackFile" type="file" accept="audio/*" hidden>
        <div class="track-actions">
          <button id="selectTrackButton" type="button">Choose Track</button>
          <button id="playTrackButton" type="button" disabled>Play</button>
        </div>
        <p id="trackName">No track selected</p>
        <div class="track-timeline">
          <span id="trackTime">0:00</span>
          <input id="trackSeek" type="range" min="0" max="1000" value="0" aria-label="Seek in track" disabled>
          <span id="trackDuration">0:00</span>
        </div>
        <audio id="trackAudio" preload="metadata"></audio>
      </div>

      <div class="composer">
        <span>AI Pack Prompt</span>
        <textarea id="packPrompt">Generate a high-definition nanotech hex pack with black chrome plates, layered graphite reflections, and subtle light moving beneath the surface.</textarea>
        <button id="quoteButton">Quote Monad Pack</button>
        <p id="quoteOutput">Custom visual packs are paid with Monad testnet tokens.</p>
      </div>

      <button id="listenButton" class="primary">Start Microphone</button>
      </div>
    </aside>
  </section>
`;

const canvas = document.querySelector('#visualizer');
const visualizer = createNanoHexVisualizer(canvas);
const trackAudio = document.querySelector('#trackAudio');
const audio = createAudioEngine(trackAudio);

const listenButton = document.querySelector('#listenButton');
const panel = document.querySelector('.panel');
const dockToggle = document.querySelector('#dockToggle');
const listenState = document.querySelector('#listenState');
const musicLock = document.querySelector('#musicLock');
const impactState = document.querySelector('#impactState');
const packState = document.querySelector('#packState');
const packSelect = document.querySelector('#packSelect');
const trackFile = document.querySelector('#trackFile');
const selectTrackButton = document.querySelector('#selectTrackButton');
const playTrackButton = document.querySelector('#playTrackButton');
const trackState = document.querySelector('#trackState');
const trackName = document.querySelector('#trackName');
const trackSeek = document.querySelector('#trackSeek');
const trackTime = document.querySelector('#trackTime');
const trackDuration = document.querySelector('#trackDuration');
const quoteButton = document.querySelector('#quoteButton');
const quoteOutput = document.querySelector('#quoteOutput');
const packPrompt = document.querySelector('#packPrompt');

const meters = {
  bass: document.querySelector('#bassMeter'),
  mid: document.querySelector('#midMeter'),
  treble: document.querySelector('#trebleMeter'),
  energy: document.querySelector('#energyMeter')
};

let isListening = false;
let lastImpactAt = -1000;
let lastBeat = 0;
let pointerDockFocus = false;

function syncDockState() {
  const expanded = panel.classList.contains('pinned') || panel.matches(':hover') || panel.contains(document.activeElement);
  dockToggle.setAttribute('aria-expanded', String(expanded));
  dockToggle.setAttribute('aria-pressed', String(panel.classList.contains('pinned')));
  dockToggle.setAttribute('aria-label', panel.classList.contains('pinned') ? 'Unpin controls' : 'Pin controls');
  dockToggle.title = panel.classList.contains('pinned') ? 'Unpin controls' : 'Pin controls';
}

dockToggle.addEventListener('click', () => {
  panel.classList.toggle('pinned');
  syncDockState();
});
panel.addEventListener('mouseenter', syncDockState);
panel.addEventListener('pointerdown', () => { pointerDockFocus = true; });
document.addEventListener('keydown', () => { pointerDockFocus = false; });
panel.addEventListener('mouseleave', () => {
  if (pointerDockFocus && !panel.classList.contains('pinned') && panel.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  syncDockState();
});
panel.addEventListener('focusin', syncDockState);
panel.addEventListener('focusout', () => requestAnimationFrame(syncDockState));

function selectPack(id) {
  packSelect.value = id;
  const pack = visualizer.setVariant(id);
  packState.textContent = pack.name;
}

packSelect.addEventListener('change', () => selectPack(packSelect.value));

window.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  const index = VISUALIZER_PACKS.findIndex((pack) => pack.id === packSelect.value);
  const step = event.key === 'ArrowRight' ? 1 : -1;
  const next = VISUALIZER_PACKS[(index + step + VISUALIZER_PACKS.length) % VISUALIZER_PACKS.length];
  selectPack(next.id);
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function updateTrackTime() {
  const duration = trackAudio.duration;
  trackTime.textContent = formatTime(trackAudio.currentTime);
  trackDuration.textContent = formatTime(duration);
  trackSeek.disabled = !Number.isFinite(duration) || duration <= 0;
  if (!trackSeek.matches(':active')) {
    trackSeek.value = trackSeek.disabled ? 0 : Math.round(trackAudio.currentTime / duration * 1000);
  }
}

function setMeter(node, value) {
  node.style.setProperty('--value', `${Math.round(value * 100)}%`);
}

function frame() {
  const signals = audio.sample();
  visualizer.render(signals);
  setMeter(meters.bass, signals.bass);
  setMeter(meters.mid, signals.mid);
  setMeter(meters.treble, signals.treble);
  setMeter(meters.energy, signals.energy);
  musicLock.textContent = signals.musicDetected ? 'active' : 'waiting';
  if (signals.beat > 0.72 && lastBeat <= 0.72) lastImpactAt = performance.now();
  lastBeat = signals.beat;
  const impactActive = performance.now() - lastImpactAt < 210;
  impactState.textContent = impactActive ? 'hit' : 'ready';
  impactState.classList.toggle('active', impactActive);
  requestAnimationFrame(frame);
}

listenButton.addEventListener('click', async () => {
  if (isListening) {
    await audio.stop();
    isListening = false;
    listenButton.textContent = 'Start Microphone';
    listenState.textContent = 'idle';
    trackState.textContent = trackAudio.src ? 'ready' : 'none';
    return;
  }

  audio.pauseFile();
  playTrackButton.textContent = 'Play';
  try {
    await audio.start();
    isListening = true;
    listenButton.textContent = 'Stop Microphone';
    listenState.textContent = 'microphone';
    trackState.textContent = trackAudio.src ? 'paused' : 'none';
  } catch (error) {
    listenState.textContent = 'mic unavailable';
    trackState.textContent = trackAudio.src ? 'ready' : 'none';
  }
});

selectTrackButton.addEventListener('click', () => trackFile.click());

trackFile.addEventListener('change', async () => {
  const file = trackFile.files?.[0];
  if (!file) return;
  try {
    await audio.loadFile(file);
    isListening = false;
    listenButton.textContent = 'Start Microphone';
    listenState.textContent = 'idle';
    trackState.textContent = 'ready';
    trackName.textContent = file.name;
    playTrackButton.disabled = false;
    playTrackButton.textContent = 'Play';
    trackSeek.value = 0;
    trackTime.textContent = '0:00';
    trackDuration.textContent = '0:00';
  } catch (error) {
    trackState.textContent = 'error';
    trackName.textContent = error.message;
  }
  trackFile.value = '';
});

playTrackButton.addEventListener('click', async () => {
  if (!trackAudio.paused) {
    audio.pauseFile();
    playTrackButton.textContent = 'Play';
    trackState.textContent = 'paused';
    listenState.textContent = 'idle';
    return;
  }

  try {
    await audio.playFile();
    isListening = false;
    listenButton.textContent = 'Start Microphone';
    playTrackButton.textContent = 'Pause';
    trackState.textContent = 'playing';
    listenState.textContent = 'track';
  } catch (error) {
    trackState.textContent = 'error';
    trackName.textContent = error.message;
  }
});

trackSeek.addEventListener('input', () => {
  if (Number.isFinite(trackAudio.duration)) {
    trackAudio.currentTime = trackAudio.duration * Number(trackSeek.value) / 1000;
    updateTrackTime();
  }
});

trackAudio.addEventListener('timeupdate', updateTrackTime);
trackAudio.addEventListener('loadedmetadata', updateTrackTime);
trackAudio.addEventListener('ended', () => {
  audio.pauseFile();
  playTrackButton.textContent = 'Play';
  trackState.textContent = 'ready';
  listenState.textContent = 'idle';
  updateTrackTime();
});

window.addEventListener('pagehide', () => { void audio.dispose(); });

quoteButton.addEventListener('click', () => {
  const quote = buildPackQuote(packPrompt.value);
  quoteOutput.textContent = `${quote.price} testnet MON unlocks "${quote.packName}" generation on ${MONAD_TESTNET.name}.`;
});

visualizer.resize();
frame();

