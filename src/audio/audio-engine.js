const SILENCE = {
  energy: 0,
  intensity: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  pulse: 0,
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
  let sensitivity = 1.2;

  function setSensitivity(value) {
    sensitivity = Math.min(2, Math.max(0.7, Number(value) || 1));
  }

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

    const rawBass = band(2, 10) * 0.7 + band(10, 22) * 0.3;
    const rawMid = band(12, 86);
    const rawTreble = band(86, spectrum.length);
    const rawEnergy = Math.min(1, rawBass * 0.42 + rawMid * 0.38 + rawTreble * 0.28);
    const bass = Math.min(1, rawBass * sensitivity);
    const mid = Math.min(1, rawMid * sensitivity);
    const treble = Math.min(1, rawTreble * sensitivity);
    const energy = Math.min(1, rawEnergy * sensitivity);
    const intensity = Math.min(1, energy * 1.4);
    const now = performance.now();
    const bassRise = Math.max(0, rawBass - bassEnvelope);
    const energyRise = Math.max(0, rawEnergy - lastEnergy);
    const hit = rawBass > 0.08 &&
      (bassRise > 0.018 / sensitivity || energyRise > 0.028 / sensitivity) &&
      rawBass - lastBassSample > 0.008 / sensitivity && now - lastBeatAt > 180;
    const pulse = Math.min(1, bassRise * 5 * sensitivity);
    const beat = hit ? 1 : Math.max(0, beatHold - 0.1);

    if (hit) lastBeatAt = now;
    lastEnergy = lastEnergy * 0.9 + rawEnergy * 0.1;
    bassEnvelope = bassEnvelope * 0.88 + rawBass * 0.12;
    lastBassSample = rawBass;
    beatHold = beat;

    return {
      energy,
      intensity,
      bass,
      mid,
      treble,
      pulse,
      beat,
      musicDetected: rawEnergy > 0.06 || rawBass > 0.09
    };
  }

  return { start, stop, loadFile, playFile, pauseFile, dispose, sample, setSensitivity };
}

