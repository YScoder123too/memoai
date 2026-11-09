// Ambient sounds generated live with the Web Audio API. No audio files, nothing to download or license.
let ctx = null, master = null, current = null;
let volume = 0.5;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noiseBuffer(c, kind) {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "brown") { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.5; } else d[i] = white;
  }
  return buf;
}

function noiseSource(c, kind) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, kind);
  src.loop = true;
  src.start();
  return src;
}

const BUILDERS = {
  // steady rainfall: white noise shaped to the mid and high range
  rain(c, out) {
    const n = noiseSource(c, "white");
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
    const g = c.createGain(); g.gain.value = 0.35;
    n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    return [n];
  },
  // ocean: deep noise whose loudness swells and fades slowly
  waves(c, out) {
    const n = noiseSource(c, "brown");
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const swell = c.createGain(); swell.gain.value = 0.55;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.09; lfo.start();
    const depth = c.createGain(); depth.gain.value = 0.4;
    lfo.connect(depth); depth.connect(swell.gain);
    n.connect(lp); lp.connect(swell); swell.connect(out);
    return [n, lfo];
  },
  // deep focus: low, even brown noise
  brown(c, out) {
    const n = noiseSource(c, "brown");
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
    const g = c.createGain(); g.gain.value = 0.9;
    n.connect(lp); lp.connect(g); g.connect(out);
    return [n];
  },
  // calm pad: a slow A minor chord with gentle movement
  pad(c, out) {
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1000;
    const bus = c.createGain(); bus.gain.value = 0.16;
    lp.connect(bus); bus.connect(out);
    const nodes = [];
    [110, 164.81, 220, 261.63, 329.63].forEach((f, i) => {
      const o = c.createOscillator(); o.type = i % 2 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = (i - 2) * 4;
      const g = c.createGain(); g.gain.value = 0.5;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.017; lfo.start();
      const d = c.createGain(); d.gain.value = 0.25;
      lfo.connect(d); d.connect(g.gain);
      o.connect(g); g.connect(lp); o.start();
      nodes.push(o, lfo);
    });
    return nodes;
  },
};

export const SOUNDS = [
  { id: "off", label: "Silent" },
  { id: "rain", label: "Rain" },
  { id: "waves", label: "Ocean" },
  { id: "brown", label: "Deep focus" },
  { id: "pad", label: "Calm pad" },
];

export function stopSound() {
  if (!ctx || !current) return;
  const old = current; current = null;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  setTimeout(() => old.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }), 1200);
}

// Must be called from a click handler the first time, because browsers block audio until the user interacts.
export function startSound(kind) {
  stopSound();
  if (kind === "off" || !BUILDERS[kind]) return;
  const c = ensure();
  if (!c) return;
  const inner = c.createGain();
  inner.connect(master);
  current = BUILDERS[kind](c, inner);
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setTargetAtTime(volume, c.currentTime + 0.05, 0.8);
}

export function setVolume(v) {
  volume = v;
  if (ctx && current) master.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}

// soft three-note chime when a session finishes
export function chime() {
  const c = ensure();
  if (!c) return;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const g = c.createGain(); const t = c.currentTime + i * 0.22;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.7);
  });
}
