/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Elegant Web Audio synthesizer for premium traditional immersive sound effects.
// Bypasses missing .mp3 file asset issues while delivering pristine, reactive sound.

class AudioSynth {
  private ctx: AudioContext | null = null;
  private ambientNodes: { oscA: OscillatorNode; oscB: OscillatorNode; gain: GainNode } | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Soft high-frequency gold bells chime
  playChime() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 Bell
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now); // High bell harmonic
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.82);
      osc2.stop(now + 0.82);
    } catch (e) {
      console.warn("Audio Context block or unsupported", e);
    }
  }

  // Direct heavy thump bass, representing a heavy wooden-iron imperial stamp
  playGoldSealStamp() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // Heavy low frequency thump
      const oscBass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      oscBass.type = 'sine';
      oscBass.frequency.setValueAtTime(65, now); // C2 Deep bass
      oscBass.frequency.exponentialRampToValueAtTime(20, now + 0.35);

      bassGain.gain.setValueAtTime(0.6, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      oscBass.connect(bassGain);
      bassGain.connect(ctx.destination);

      // Metallic impact click friction
      const oscMetal = ctx.createOscillator();
      const metalGain = ctx.createGain();
      oscMetal.type = 'triangle';
      oscMetal.frequency.setValueAtTime(400, now);
      oscMetal.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      metalGain.gain.setValueAtTime(0.15, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      oscMetal.connect(metalGain);
      metalGain.connect(ctx.destination);

      oscBass.start(now);
      oscMetal.start(now);
      oscBass.stop(now + 0.5);
      oscMetal.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Soft environmental spring water droplet sound
  playWaterDrop() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08); // rising high water squeak

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn(e);
    }
  }

  // Ink stroke feedback sound
  playSwipe() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      console.warn(e);
    }
  }

  startAmbientLoop() {
    try {
      const ctx = this.initCtx();
      if (this.ambientNodes) return;

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const gain = ctx.createGain();

      oscA.type = "sine";
      oscA.frequency.setValueAtTime(146.83, ctx.currentTime);
      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(220, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.6);

      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(ctx.destination);

      oscA.start();
      oscB.start();

      this.ambientNodes = { oscA, oscB, gain };
    } catch (e) {
      console.warn("Ambient loop unavailable", e);
    }
  }

  stopAmbientLoop() {
    if (!this.ctx || !this.ambientNodes) return;

    const { oscA, oscB, gain } = this.ambientNodes;
    const now = this.ctx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    oscA.stop(now + 0.52);
    oscB.stop(now + 0.52);
    this.ambientNodes = null;
  }
}

export const synth = new AudioSynth();
