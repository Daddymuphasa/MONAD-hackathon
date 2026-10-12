import './styles/app.css';
import { createAudioEngine } from './audio/audio-engine.js';
import { createNanoHexVisualizer } from './visualizers/nano-hex.js';
import { VISUALIZER_PACKS } from './visualizers/packs.js';
import { createAutoMode } from './visualizers/auto-mode.js';
import { MONAD_TESTNET, buildPackQuote } from './monad/monad-testnet.js';
import {
  createVisualMemoryPayload,
  deployVisualMemoryContract,
  mintVisualMemory
} from './monad/wallet.js';
import { loadLatestVisualMemory } from './integrations/envio.js';
import { loadNansenVisualDNA } from './integrations/nansen.js';

const app = document.querySelector('#app');
const packOptions = [
  ['Surface packs', VISUALIZER_PACKS.filter((pack) => !pack.sceneMode)],
  ['3D scenes', VISUALIZER_PACKS.filter((pack) => pack.sceneMode)]
].map(([label, packs]) => `<optgroup label="${label}">${packs.map((pack) => `<option value="${pack.id}">${pack.name}</option>`).join('')}</optgroup>`).join('');

app.innerHTML = `
  <div id="brandIntro" class="brand-intro" aria-label="Papagedon opening animation">
    <div class="brand-intro__aura" aria-hidden="true"></div>
    <div class="brand-intro__stage">
      <img class="brand-intro__logo" src="${import.meta.env.BASE_URL}assets/papagedon-intro-logo.png" alt="Papagedon" />
      <div class="brand-intro__line" aria-hidden="true"></div>
    </div>
  </div>
  <section class="shell">
    <canvas id="visualizer" aria-label="Papagedon live music visualizer"></canvas>
    <img class="brand-mark" src="${import.meta.env.BASE_URL}assets/papagedon-mark.png" alt="Papagedon" />
    <aside class="panel">
      <span class="panel-trigger" aria-hidden="true"></span>
      <div class="panel-content">
      <header class="panel-header">
        <div><span class="live-dot"></span> Live visual</div>
        <span>Monad testnet</span>
      </header>

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

      <button id="listenButton" class="primary" type="button">Start Microphone</button>

      <div class="mode-switch" role="group" aria-label="Visualizer mode">
        <button id="autoModeButton" type="button" aria-pressed="true">Auto</button>
        <button id="manualModeButton" type="button" aria-pressed="false">Manual</button>
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

      <div class="sensitivity-control">
        <label for="sensitivity">Sensitivity <output id="sensitivityValue" for="sensitivity">1.2x</output></label>
        <input id="sensitivity" type="range" min="0.7" max="2" step="0.1" value="1.2">
      </div>

      <div class="composer">
        <label for="packPrompt">Custom Pack Style</label>
        <textarea id="packPrompt">Generate a high-definition nanotech hex pack with black chrome plates, layered graphite reflections, and subtle light moving beneath the surface.</textarea>
        <button id="quoteButton" type="button">Preview Testnet Quote</button>
        <p id="quoteOutput" role="status">Payment and minting are not connected yet.</p>
      </div>

      <section class="chain-actions" aria-label="Monad deployment">
        <div class="chain-heading"><span>Visual Memory NFT</span><b>Testnet only</b></div>
        <div id="dynamicWalletRoot" class="dynamic-wallet-root">
          <button id="connectWalletButton" type="button">Connect with Dynamic</button>
        </div>
        <p id="walletConnectionState" class="wallet-connection-state" role="status" aria-live="polite">Wallet not connected</p>
        <button id="deployContractButton" type="button" disabled>Deployed</button>
        <button id="mintMemoryButton" class="mint-action" type="button" disabled>Mint Visual Memory · 0.2 MON</button>
        <p id="chainOutput" role="status">Contract: ${MONAD_TESTNET.visualMemoryContract}</p>
        <div class="integration-status" aria-label="Sponsor integrations">
          <span>Dynamic</span><b id="dynamicStatus">checking</b>
          <span>Alchemy</span><b id="alchemyStatus">RPC ready</b>
          <span>Envio</span><b id="envioStatus">waiting</b>
          <span>Nansen AI</span><b id="nansenStatus">waiting</b>
        </div>
      </section>
      </div>
    </aside>
  </section>
`;

const canvas = document.querySelector('#visualizer');
const brandIntro = document.querySelector('#brandIntro');
const visualizer = createNanoHexVisualizer(canvas);
const trackAudio = document.querySelector('#trackAudio');
const audio = createAudioEngine(trackAudio);

const listenButton = document.querySelector('#listenButton');
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
const sensitivity = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivityValue');
const autoModeButton = document.querySelector('#autoModeButton');
const manualModeButton = document.querySelector('#manualModeButton');
const deployContractButton = document.querySelector('#deployContractButton');
const mintMemoryButton = document.querySelector('#mintMemoryButton');
const chainOutput = document.querySelector('#chainOutput');
const walletConnectionState = document.querySelector('#walletConnectionState');
const dynamicStatus = document.querySelector('#dynamicStatus');
const alchemyStatus = document.querySelector('#alchemyStatus');
const envioStatus = document.querySelector('#envioStatus');
const nansenStatus = document.querySelector('#nansenStatus');
const dynamicWalletRoot = document.querySelector('#dynamicWalletRoot');
const autoMode = createAutoMode(VISUALIZER_PACKS);

let walletSession = null;

function completeBrandIntro() {
  if (!brandIntro) return;
  brandIntro.classList.add('is-complete');
  brandIntro.addEventListener('transitionend', () => brandIntro.remove(), { once: true });
  window.setTimeout(() => brandIntro.remove(), 900);
}

window.setTimeout(completeBrandIntro, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 500 : 3300);

const meters = {
  bass: document.querySelector('#bassMeter'),
  mid: document.querySelector('#midMeter'),
  treble: document.querySelector('#trebleMeter'),
  energy: document.querySelector('#energyMeter')
};

let isListening = false;
let lastImpactAt = -1000;
let lastBeat = 0;
let autoEnabled = true;
autoMode.start(performance.now(), packSelect.value);

sensitivity.addEventListener('input', () => {
  audio.setSensitivity(sensitivity.value);
  sensitivityValue.value = `${Number(sensitivity.value).toFixed(1)}x`;
});

function setMode(auto) {
  autoEnabled = auto;
  autoModeButton.setAttribute('aria-pressed', String(auto));
  manualModeButton.setAttribute('aria-pressed', String(!auto));
  if (auto) autoMode.start(performance.now(), packSelect.value);
}

function selectPack(id) {
  packSelect.value = id;
  const pack = visualizer.setVariant(id);
  packState.textContent = pack.name;
}

autoModeButton.addEventListener('click', () => setMode(true));
manualModeButton.addEventListener('click', () => setMode(false));
packSelect.addEventListener('change', () => {
  setMode(false);
  selectPack(packSelect.value);
});

window.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  const index = VISUALIZER_PACKS.findIndex((pack) => pack.id === packSelect.value);
  const step = event.key === 'ArrowRight' ? 1 : -1;
  const next = VISUALIZER_PACKS[(index + step + VISUALIZER_PACKS.length) % VISUALIZER_PACKS.length];
  setMode(false);
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
  if (autoEnabled) {
    const nextPack = autoMode.maybeNext(performance.now(), signals.beat, packSelect.value);
    if (nextPack) selectPack(nextPack);
  }
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
  quoteOutput.textContent = `Preview: ${quote.price} testnet MON for "${quote.packName}". No payment is being requested.`;
});

async function hydrateWalletIdentity(session) {
  walletSession = session;
  const shortAddress = `${session.address.slice(0, 6)}...${session.address.slice(-4)}`;
  mintMemoryButton.disabled = false;
  walletConnectionState.textContent = `Wallet Connected · ${shortAddress}`;
  walletConnectionState.classList.add('is-connected');
  dynamicStatus.textContent = 'wallet connected';
  alchemyStatus.textContent = `${Number(session.balance).toFixed(3)} MON`;
  chainOutput.textContent = `Wallet connected. Restoring onchain Visual DNA for ${shortAddress}...`;

  const [envioResult, nansenResult] = await Promise.allSettled([
    loadLatestVisualMemory(session.address),
    loadNansenVisualDNA(session.address)
  ]);

  if (envioResult.status === 'fulfilled') {
    const { configured, memory } = envioResult.value;
    envioStatus.textContent = !configured ? 'add endpoint' : memory ? `memory #${memory.id}` : 'new identity';
  } else {
    envioStatus.textContent = 'unavailable';
  }

  if (nansenResult.status === 'fulfilled') {
    const dna = nansenResult.value.visualDNA;
    nansenStatus.textContent = `${nansenResult.value.labels.length} signals`;
    if (dna?.preferredPack && VISUALIZER_PACKS.some((pack) => pack.id === dna.preferredPack)) {
      packSelect.value = dna.preferredPack;
      selectPack(dna.preferredPack);
    }
    if (dna?.styleBrief) packPrompt.value = dna.styleBrief;
  } else {
    nansenStatus.textContent = 'add API key';
  }

  walletConnectionState.textContent = `Wallet Connected · ${shortAddress}`;
  chainOutput.textContent = `Wallet connected. Envio memory and Nansen Visual DNA sync completed for ${shortAddress}.`;
}

function handleWalletError(error) {
  dynamicStatus.textContent = 'error';
  walletConnectionState.textContent = 'Wallet not connected';
  walletConnectionState.classList.remove('is-connected');
  chainOutput.textContent = error.shortMessage || error.message;
}

dynamicStatus.textContent = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID ? 'ready' : 'needs env ID';
document.querySelector('#connectWalletButton').addEventListener('click', async () => {
  dynamicWalletRoot.innerHTML = '<span class="wallet-loading">Loading secure wallet...</span>';
  const { mountDynamicWallet } = await import('./dynamic/wallet-bridge.jsx');
  mountDynamicWallet(dynamicWalletRoot, {
    onSession: hydrateWalletIdentity,
    onError: handleWalletError,
    autoOpen: true
  });
});

window.addEventListener('papagedon:wallet-session', async (event) => {
  try {
    await hydrateWalletIdentity(event.detail);
  } catch (error) {
    handleWalletError(error);
  }
});

deployContractButton.addEventListener('click', async () => {
  if (MONAD_TESTNET.visualMemoryContract) return;
  if (!walletSession) return;
  deployContractButton.disabled = true;
  chainOutput.textContent = 'Confirm the testnet deployment in your wallet...';
  try {
    const deployment = await deployVisualMemoryContract(walletSession.signer);
    localStorage.setItem('papagedon.visualMemoryContract', deployment.address);
    deployContractButton.textContent = 'Deployed';
    chainOutput.textContent = `Contract deployed at ${deployment.address}`;
  } catch (error) {
    deployContractButton.disabled = false;
    chainOutput.textContent = error.shortMessage || error.message;
  }
});

mintMemoryButton.addEventListener('click', async () => {
  if (!walletSession) return;
  const styleBrief = packPrompt.value.trim();
  if (!styleBrief) {
    chainOutput.textContent = 'Describe your visual taste before minting.';
    packPrompt.focus();
    return;
  }

  const pack = VISUALIZER_PACKS.find((candidate) => candidate.id === packSelect.value);
  const payload = createVisualMemoryPayload({
    pack,
    sensitivity: Number(sensitivity.value),
    autoMode: autoEnabled,
    styleBrief
  });

  mintMemoryButton.disabled = true;
  chainOutput.textContent = 'Confirm the 0.2 testnet MON mint in your wallet...';
  try {
    const result = await mintVisualMemory(
      walletSession.signer,
      MONAD_TESTNET.visualMemoryContract,
      payload
    );
    mintMemoryButton.textContent = `Minted Memory #${result.tokenId}`;
    chainOutput.textContent = `Visual Memory #${result.tokenId} minted. Transaction: ${result.transactionHash}`;
  } catch (error) {
    mintMemoryButton.disabled = false;
    chainOutput.textContent = error.shortMessage || error.message;
  }
});

visualizer.resize();
frame();

