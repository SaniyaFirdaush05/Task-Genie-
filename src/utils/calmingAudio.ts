export type CalmingSoundscapeId = 'calmMusic' | 'zenChimes' | 'softRain';

export interface CalmingSoundscapeOption {
  id: CalmingSoundscapeId;
  name: string;
  subtitle: string;
}

export const CALMING_SOUNDSCAPES: CalmingSoundscapeOption[] = [
  {
    id: 'calmMusic',
    name: 'Lo-Fi Ambient Pads',
    subtitle: 'Warm relaxing chord progression',
  },
  {
    id: 'zenChimes',
    name: 'Zen Focus Chimes',
    subtitle: 'Soft pentatonic chimes & harmonic drone',
  },
  {
    id: 'softRain',
    name: 'Warm Focus Rain',
    subtitle: 'Filtered pink noise to block distractions',
  },
];

// Gentle Fmaj7 -> G6 -> Em7 -> Am9 ambient chord voicings (in Hz)
const AMBIENT_CHORDS: number[][] = [
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
  [164.81, 196.0, 246.94, 293.66], // Em7
  [220.0, 261.63, 329.63, 392.0, 493.88], // Am9
];

// Soft D minor pentatonic bell notes for Zen Chimes (Hz)
const PENTATONIC_NOTES = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 659.25];

export class CalmingAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private activeNodes: AudioNode[] = [];
  private isPlaying = false;
  private currentPreset: CalmingSoundscapeId = 'calmMusic';
  private volume = 0.45;

  public start(preset: CalmingSoundscapeId, volume = 0.45): boolean {
    this.stop();
    this.currentPreset = preset;
    this.volume = Math.max(0, Math.min(1, volume));

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, this.volume * 0.65), ctx.currentTime + 0.8);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      if (preset === 'calmMusic') {
        this.startAmbientPads(ctx, masterGain);
      } else if (preset === 'zenChimes') {
        this.startZenChimes(ctx, masterGain);
      } else {
        this.startSoftRain(ctx, masterGain);
      }

      this.isPlaying = true;
      return true;
    } catch (err) {
      console.warn('Web Audio API unavailable:', err);
      this.stop();
      return false;
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(Math.max(0.001, this.volume * 0.65), this.ctx.currentTime, 0.08);
    }
  }

  public stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Node may already be stopped
      }
    }
    this.activeNodes = [];

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignore close errors
      }
      this.ctx = null;
    }

    this.masterGain = null;
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getPreset(): CalmingSoundscapeId {
    return this.currentPreset;
  }

  private startAmbientPads(ctx: AudioContext, destination: AudioNode) {
    // Shared warm lowpass filter + subtle feedback delay for spaciousness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 780;
    filter.Q.value = 0.7;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.25;

    filter.connect(destination);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(destination);

    this.activeNodes.push(filter, delay, feedback, delayWet);

    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const chord = AMBIENT_CHORDS[chordIdx % AMBIENT_CHORDS.length];
      chordIdx += 1;

      // Subtle low bass root
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.16, now + 1.2);
      bassGain.gain.linearRampToValueAtTime(0.0001, now + 4.9);
      bassOsc.connect(bassGain);
      bassGain.connect(filter);
      bassOsc.start(now);
      bassOsc.stop(now + 5.0);

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((i % 2 === 0 ? 1 : -1) * 4, now);

        const peak = 0.085 / Math.sqrt(chord.length);
        voiceGain.gain.setValueAtTime(0.0001, now);
        voiceGain.gain.linearRampToValueAtTime(peak, now + 1.5);
        voiceGain.gain.linearRampToValueAtTime(peak * 0.75, now + 3.1);
        voiceGain.gain.linearRampToValueAtTime(0.0001, now + 5.1);

        osc.connect(voiceGain);
        voiceGain.connect(filter);
        osc.start(now);
        osc.stop(now + 5.2);
      });
    };

    playChord();
    this.intervalId = window.setInterval(playChord, 4400);
  }

  private startZenChimes(ctx: AudioContext, destination: AudioNode) {
    // Soft continuous harmonic pad (D3 + A3)
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 420;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.14;
    droneFilter.connect(droneGain);
    droneGain.connect(destination);
    this.activeNodes.push(droneFilter, droneGain);

    [146.83, 220.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = idx === 0 ? -3 : 3;
      osc.connect(droneFilter);
      osc.start();
      this.activeNodes.push(osc);
    });

    // Subtle delay for chime echo
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    const chimeBus = ctx.createGain();
    chimeBus.gain.value = 0.3;

    chimeBus.connect(destination);
    chimeBus.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(destination);
    this.activeNodes.push(delay, feedback, chimeBus);

    let step = 0;
    const playChime = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const noteFreq = PENTATONIC_NOTES[(step * 3 + Math.floor(Math.random() * 2)) % PENTATONIC_NOTES.length];
      step += 1;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(chimeBus);
      osc.start(now);
      osc.stop(now + 3.3);
    };

    playChime();
    this.intervalId = window.setInterval(playChime, 2600);
  }

  private startSoftRain(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.065;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;

    // Gentle LFO breathing on the rain filter
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.7;

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, lfo, lfoGain, filter, gainNode);
  }
}
