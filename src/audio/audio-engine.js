const SILENCE = {
  energy: 0,
  intensity: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: 0,
  musicDetected: false
};

export function createAudioEngine() {
  let context;
  let analyser;
  let stream;
  let source;
  let spectrum;
  let lastEnergy = 0;
  let beatHold = 0;

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    context = new AudioContext({ latencyHint: 'interactive' });
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.76;
    source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    spectrum = new Uint8Array(analyser.frequencyBinCount);
  }

  async function stop() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    source?.disconnect();
    source = undefined;
    analyser = undefined;
    spectrum = undefined;
    if (context) {
      await context.close();
      context = undefined;
    }
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
    if (!analyser || !spectrum) return SILENCE;

    analyser.getByteFrequencyData(spectrum);

    const bass = band(2, 12);
    const mid = band(12, 86);
    const treble = band(86, spectrum.length);
    const energy = Math.min(1, bass * 0.42 + mid * 0.38 + treble * 0.28);
    const intensity = Math.min(1, energy * 1.4);
    const beat = energy > lastEnergy + 0.14 && bass > 0.26 ? 1 : Math.max(0, beatHold - 0.08);

    lastEnergy = lastEnergy * 0.86 + energy * 0.14;
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

  return { start, stop, sample };
}

