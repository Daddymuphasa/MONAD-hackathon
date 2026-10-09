const SILENCE = {
  energy: 0,
  intensity: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: 0,
  musicDetected: false
};

export function createAudioEngine(mediaElement) {
  let context;
  let analyser;
  let stream;
  let source;
  let fileSource;
  let fileConnected = false;
  let fileUrl;
  let mode;
  let spectrum;
  let lastEnergy = 0;
  let bassEnvelope = 0;
  let lastBassSample = 0;
  let beatHold = 0;
  let lastBeatAt = -1000;

  function ensureGraph() {
    if (context) return;
    context = new AudioContext({ latencyHint: 'interactive' });
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    spectrum = new Uint8Array(analyser.frequencyBinCount);
  }

  function resetAnalysis() {
    lastEnergy = 0;
    bassEnvelope = 0;
    lastBassSample = 0;
    beatHold = 0;
    lastBeatAt = -1000;
  }

  async function start() {
    await stop();
    ensureGraph();
    await context.resume?.();
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    mode = 'microphone';
  }

  async function stop() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    source?.disconnect();
    source = undefined;
    mediaElement?.pause();
    if (fileConnected) {
      fileSource.disconnect();
      fileConnected = false;
    }
    mode = undefined;
    resetAnalysis();
  }

  async function loadFile(file) {
    if (!mediaElement) throw new Error('Audio player is unavailable.');
    if (file.type && !file.type.startsWith('audio/')) throw new Error('Choose an audio file.');
    await stop();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = URL.createObjectURL(file);
    mediaElement.src = fileUrl;
    mediaElement.load();
  }

  async function playFile() {
    if (!mediaElement?.src) throw new Error('Choose an audio file first.');
    if (mode === 'microphone') await stop();
    ensureGraph();
    if (!fileSource) fileSource = context.createMediaElementSource(mediaElement);
    if (!fileConnected) {
      fileSource.connect(analyser);
      fileSource.connect(context.destination);
      fileConnected = true;
    }
    if (mediaElement.ended) mediaElement.currentTime = 0;
    await context.resume?.();
    await mediaElement.play();
    mode = 'file';
  }

  function pauseFile() {
    mediaElement?.pause();
    resetAnalysis();
  }

  async function dispose() {
    await stop();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (context) await context.close();
  }

  function band(start, end) {
    if (!spectrum) return 0;
    let total = 0;
    let count = 0;
    for (let index = start; index < end; index += 1) {
      total += spectrum[index] ?? 0;
      count += 1;
    }
    return count ? total / count / 255 : 0;
  }

  function sample() {
    if (!analyser || !spectrum || !mode || (mode === 'file' && mediaElement.paused)) return SILENCE;

    analyser.getByteFrequencyData(spectrum);

    const bass = band(2, 8) * 0.75 + band(8, 16) * 0.25;
    const mid = band(12, 86);
    const treble = band(86, spectrum.length);
    const energy = Math.min(1, bass * 0.42 + mid * 0.38 + treble * 0.28);
    const intensity = Math.min(1, energy * 1.4);
    const now = performance.now();
    const onset = Math.max(bass - bassEnvelope, energy - lastEnergy);
    const hit = bass > 0.13 && onset > 0.03 && bass - lastBassSample > 0.025 && now - lastBeatAt > 180;
    const beat = hit ? 1 : Math.max(0, beatHold - 0.1);

    if (hit) lastBeatAt = now;
    lastEnergy = lastEnergy * 0.9 + energy * 0.1;
    bassEnvelope = bassEnvelope * 0.9 + bass * 0.1;
    lastBassSample = bass;
    beatHold = beat;

    return {
      energy,
      intensity,
      bass,
      mid,
      treble,
      beat,
      musicDetected: energy > 0.08 || bass > 0.12
    };
  }

  return { start, stop, loadFile, playFile, pauseFile, dispose, sample };
}

