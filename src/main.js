import './styles/app.css';
import { createAudioEngine } from './audio/audio-engine.js';
import { createNanoHexVisualizer } from './visualizers/nano-hex.js';
import { MONAD_TESTNET, buildPackQuote } from './monad/monad-testnet.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <section class="shell">
    <canvas id="visualizer" aria-label="Papageddon live nanotech visualizer"></canvas>
    <aside class="panel">
      <div class="brand">
        <span class="mark"></span>
        <div>
          <p>PAPAGEDDON</p>
          <strong>Monad visual runtime</strong>
        </div>
      </div>

      <div class="status-grid">
        <span>Listening</span><b id="listenState">idle</b>
        <span>Music lock</span><b id="musicLock">waiting</b>
        <span>Render pack</span><b>Nano Hex Genesis</b>
        <span>Network</span><b>${MONAD_TESTNET.name}</b>
      </div>

      <div class="meters">
        <label>Bass <i id="bassMeter"></i></label>
        <label>Mid <i id="midMeter"></i></label>
        <label>Treble <i id="trebleMeter"></i></label>
        <label>Energy <i id="energyMeter"></i></label>
      </div>

      <div class="composer">
        <span>AI Pack Prompt</span>
        <textarea id="packPrompt">Generate a high-definition nanotech hex pack with electric violet, plasma cyan, dark chrome plates, and a premium creator-dashboard mood.</textarea>
        <button id="quoteButton">Quote Monad Pack</button>
        <p id="quoteOutput">Custom visual packs are paid with Monad testnet tokens.</p>
      </div>

      <button id="listenButton" class="primary">Start Listening</button>
    </aside>
  </section>
`;

const canvas = document.querySelector('#visualizer');
const visualizer = createNanoHexVisualizer(canvas);
const audio = createAudioEngine();

const listenButton = document.querySelector('#listenButton');
const listenState = document.querySelector('#listenState');
const musicLock = document.querySelector('#musicLock');
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
  requestAnimationFrame(frame);
}

listenButton.addEventListener('click', async () => {
  if (isListening) {
    await audio.stop();
    isListening = false;
    listenButton.textContent = 'Start Listening';
    listenState.textContent = 'idle';
    return;
  }

  await audio.start();
  isListening = true;
  listenButton.textContent = 'Stop Listening';
  listenState.textContent = 'live';
});

quoteButton.addEventListener('click', () => {
  const quote = buildPackQuote(packPrompt.value);
  quoteOutput.textContent = `${quote.price} testnet MON unlocks "${quote.packName}" generation on ${MONAD_TESTNET.name}.`;
});

visualizer.resize();
frame();

