let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate a quick white noise buffer
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const bufferSize = ctx.sampleRate * 0.1; // 100ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

export type SwitchType = 'mechanical' | 'creamy' | 'silent' | 'typewriter' | 'none';

export function playSwitchSound(type: SwitchType) {
  if (type === 'none') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Base Sine/Triangle Oscillator for the low-frequency thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // 2. Noise Source for the mechanical clack/click
    const noiseNode = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noiseNode.buffer = getNoiseBuffer(ctx);
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    if (type === 'mechanical') {
      // High-pitched tactile click + crisp metal thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      // Noise click
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(6000, now);
      
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.start(now);
      osc.stop(now + 0.05);
      noiseNode.start(now);
    } 
    else if (type === 'creamy') {
      // Deeper, popped/marbly sound ("thock")
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      oscGain.gain.setValueAtTime(0.18, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      // Noise thock
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(3, now);
      
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.start(now);
      osc.stop(now + 0.06);
      noiseNode.start(now);
    } 
    else if (type === 'silent') {
      // Extremely muted, low-pass "thud"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.03);

      oscGain.gain.setValueAtTime(0.08, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      // No high click noise, very soft bandpass
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(250, now);
      
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

      osc.start(now);
      osc.stop(now + 0.04);
      noiseNode.start(now);
    }
    else if (type === 'typewriter') {
      // Vintage metallic click + punchy thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

      oscGain.gain.setValueAtTime(0.15, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(4200, now);
      
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.start(now);
      osc.stop(now + 0.06);
      noiseNode.start(now);
    }
  } catch (err) {
    console.warn("AudioContext sound synthesis is blocked or unsupported in this frame browser:", err);
  }
}

export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    // ignore audio block
  }
}

