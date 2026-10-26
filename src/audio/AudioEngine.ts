import * as Tone from 'tone';
import { HarmonicEngine, HarmonicZoneId } from './HarmonicEngine';
import {
  AetheriumState,
  SatelliteTriggerPayload,
  SEED_PRESETS,
  SeedId,
  store,
} from '../state/store';

const RAMP_TIME_SEC = 0.2;

/**
 * Generates a smooth hyperbolic tangent (tanh) soft-clipping curve
 * for analog midrange warmth saturation (Nostalgia macro).
 */
function createSoftClipCurve(driveAmount: number, samples = 1024): Float32Array {
  const curve = new Float32Array(samples);
  const k = Math.max(0.5, driveAmount * 2.8);
  const norm = Math.tanh(k);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(k * x) / norm;
  }
  return curve;
}

/**
 * Resolves a harmonic somatic sub-bass anchor frequency strictly within 40 Hz - 60 Hz
 * aligned with the active seed's tonal center.
 */
function resolveSomaticSubBassHz(seedId: SeedId): number {
  switch (seedId) {
    case 'rain-on-felt':
      return 55.0; // A1 (Perfect 5th below D2, warm 55 Hz anchor)
    case 'deep-drift':
      return 43.65; // F1 (Fundamental 43.65 Hz anchor)
    case 'subterranean':
      return 49.0; // G1 (Sub-dominant/Fifth 49 Hz anchor)
    case 'solar-wind':
      return 49.0; // G1 (Fundamental 49 Hz anchor)
    default:
      return 50.0;
  }
}

/**
 * Phase 2 & Phase 3 Production Generative Web Audio & Clinical Psychoacoustic DSP Engine.
 *
 * Implements:
 * - Layer A: Continuous Core Drone (detuned fatsawtooth + -12dB sub-sine through a 24dB resonant LPF
 *   modulated by a 0.05Hz - 0.15Hz breathing LFO).
 * - Layer B: Dual-Timbre Satellite Voices (FM Felt Piano / Intimate Pluck + Slow-Attack 1.5s-4.0s Glassy Space Pad)
 *   with Rarity entropy gate and sinusoidal Bilateral EMDR routing.
 * - Layer C: Procedural Brown/Pink Noise Organic Texture Generator shaped by a slow LFO bandpass filter.
 * - Phase 3 Clinical Suite DSP:
 *   1. Vocal-Range Acoustic Carving Filter (1100 Hz, Q = 0.7, 0 dB to -12 dB Dialogue Mode pocket)
 *   2. Automated ISO-Principle Session Arc Vector Pacing timer integration
 *   3. Bilateral Stimulation (EMDR 0.2 Hz - 1.5 Hz StereoPanner + dedicated soft harmonic pulse)
 *   4. Somatic Sub-Bass Anchor (40-60 Hz pure sine) & Binaural Theta Entrainment (100 Hz L / 106 Hz R = 6 Hz Theta)
 */
export class AudioEngine {
  private isInitialized = false;
  private activeSeedId: SeedId | null = null;
  private activeHarmonicZoneId: HarmonicZoneId | null = null;
  private activeDroneNotes: string[] = [];
  private activeSubNote: string | null = null;

  // Master Output & Protection Bus (-1.0 dBFS brickwall ceiling)
  private masterLimiter: Tone.Limiter | null = null;
  private masterCompressor: Tone.Compressor | null = null;
  private masterGain: Tone.Gain | null = null;
  private vocalCarvingEq: Tone.Filter | null = null;

  // Macro DSP Processing Bus (Fog, Nostalgia, Luminance)
  private fogMasterLowpass: Tone.Filter | null = null;
  private masterReverb: Tone.Reverb | null = null;
  private longTailReverb: Tone.Freeverb | null = null;
  private pingPongDelay: Tone.PingPongDelay | null = null;
  private nostalgiaTapeDelay: Tone.Delay | null = null;
  private wowFlutterLfo: Tone.LFO | null = null;
  private nostalgiaDriveGain: Tone.Gain | null = null;
  private nostalgiaWaveshaper: Tone.WaveShaper | null = null;
  private corePanner: Tone.Panner | null = null;

  // Clinical Tool 3: Bilateral Stimulation (EMDR / Somatic Panner + Soft Harmonic Pulse)
  private bilateralPanner: Tone.Panner | null = null;
  private emdrLfo: Tone.LFO | null = null;
  private emdrPulseOsc: Tone.Oscillator | null = null;
  private emdrPulseLfo: Tone.LFO | null = null;
  private emdrPulseGain: Tone.Gain | null = null;

  // Clinical Tool 4: Somatic Sub-Bass Anchor (40-60 Hz) & 6 Hz Binaural Theta Entrainment (100 Hz L / 106 Hz R)
  private somaticSubOsc: Tone.Oscillator | null = null;
  private somaticSubGain: Tone.Gain | null = null;
  private binauralLeftOsc: Tone.Oscillator | null = null;
  private binauralRightOsc: Tone.Oscillator | null = null;
  private binauralLeftPanner: Tone.Panner | null = null;
  private binauralRightPanner: Tone.Panner | null = null;
  private binauralMasterGain: Tone.Gain | null = null;

  // Layer A: Core Drone (Fat Sawtooth + -12dB Sub-Sine + 24dB LPF + 0.05-0.15Hz Breathing LFO)
  private dronePadSynth: Tone.PolySynth | null = null;
  private droneSubSynth: Tone.Synth | null = null;
  private droneFilter: Tone.Filter | null = null;
  private droneBreathLfo: Tone.LFO | null = null;
  private breathFreqHz = 0.085;

  // Layer B: Satellite Voices (1. Felt Piano FM Pluck, 2. Glassy Space Pad)
  private feltPianoSynth: Tone.PolySynth<Tone.FMSynth> | null = null;
  private glassyPadSynth: Tone.PolySynth<Tone.AMSynth> | null = null;
  private feltVoiceGain: Tone.Gain | null = null;
  private glassyVoiceGain: Tone.Gain | null = null;

  // Layer C: Organic Texture Generator (Procedural Brown/Pink Noise + Slow Bandpass Filter)
  private pinkNoise: Tone.Noise | null = null;
  private brownNoise: Tone.Noise | null = null;
  private pinkNoiseGain: Tone.Gain | null = null;
  private brownNoiseGain: Tone.Gain | null = null;
  private textureBandpass: Tone.Filter | null = null;
  private textureSweepLfo: Tone.LFO | null = null;
  private textureOutputGain: Tone.Gain | null = null;

  private sessionTickInterval: number | null = null;

  constructor() {
    store.subscribe((state) => {
      this.syncWithState(state);
    });

    store.onSatelliteTrigger((payload) => {
      this.triggerSatelliteVoice(payload);
    });

    // 1-second master clock for Sleep Timer & Automated ISO-Principle Session Arc interpolation
    this.sessionTickInterval = window.setInterval(() => {
      const st = store.getState();
      if (st.isPlaying && st.sleepTimerRemainingSec !== null) {
        store.tickSleepTimer();
      }
      if (st.mode === 'practitioner' && st.practitioner.isoArcRunning) {
        store.tickIsoSessionArc(1);
      }
    }, 1000);
  }

  /**
   * Returns instantaneous breathing phase (0.0 to 1.0) synchronized with the
   * Layer A 0.05Hz-0.15Hz LFO so SanctuaryCanvas can visually breathe with the drone.
   */
  public getBreathingModulation(timeSec: number): number {
    return 0.5 + 0.5 * Math.sin(timeSec * Math.PI * 2 * this.breathFreqHz);
  }

  /**
   * Returns instantaneous horizontal bilateral pan position (-1.0 Left to +1.0 Right)
   * when Practitioner EMDR Bilateral Grounding is enabled, or null when inactive.
   */
  public getBilateralPanPosition(timeSec: number): number | null {
    const state = store.getState();
    if (state.mode !== 'practitioner' || !state.practitioner.emdrBilateralEnabled) {
      return null;
    }
    const { emdrRateHz, emdrStereoWidth } = state.practitioner;
    return Math.sin(timeSec * Math.PI * 2 * emdrRateHz) * emdrStereoWidth;
  }

  public async togglePlayback(): Promise<void> {
    const { isPlaying } = store.getState();
    if (!isPlaying) {
      await this.start();
    } else {
      this.stop();
    }
  }

  public async start(): Promise<void> {
    await Tone.start();
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }

    if (!this.isInitialized) {
      await this.initializeDspGraph();
      this.isInitialized = true;
    }

    const state = store.getState();
    this.updateDroneHarmony(state.activeSeedId, state.macros.luminance, true);
    this.startContinuousGenerators();

    if (this.masterGain) {
      const now = Tone.now();
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.rampTo(state.masterVolume, 1.8);
    }

    store.setPlaying(true);
  }

  public stop(): void {
    if (this.masterGain) {
      const now = Tone.now();
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.rampTo(0.0001, 1.2);
    }

    window.setTimeout(() => {
      if (!store.getState().isPlaying) {
        this.dronePadSynth?.releaseAll();
        this.droneSubSynth?.triggerRelease();
        this.feltPianoSynth?.releaseAll();
        this.glassyPadSynth?.releaseAll();
        this.stopContinuousGenerators();
        this.activeSeedId = null;
        this.activeHarmonicZoneId = null;
      }
    }, 1250);

    store.setPlaying(false);
  }

  private async initializeDspGraph(): Promise<void> {
    const state = store.getState();
    const { luminance, fog, viscosity, nostalgia } = state.macros;
    const prac = state.practitioner;

    // 1. Master Safety Limiter (-1.0 dBFS) & Glue Compressor
    this.masterLimiter = new Tone.Limiter(-1.0).toDestination();
    this.masterCompressor = new Tone.Compressor({
      threshold: -15,
      ratio: 3.2,
      attack: 0.025,
      release: 0.28,
      knee: 10,
    }).connect(this.masterLimiter);

    this.masterGain = new Tone.Gain(0.0001).connect(this.masterCompressor);

    // Clinical Tool 1: Vocal-Range Acoustic Carving Filter (centered at 1100 Hz, Q = 0.7, 0 to -12 dB)
    const initialCarveDb =
      state.mode === 'practitioner' && prac.vocalCarvingEnabled
        ? prac.vocalCarvingDepthDb
        : 0;

    this.vocalCarvingEq = new Tone.Filter({
      type: 'peaking',
      frequency: 1100,
      Q: 0.7,
      gain: initialCarveDb,
    }).connect(this.masterGain);

    // 2. Fog Master Low-Pass Filter (rolls off HF from 12 kHz down to 1.2 kHz)
    this.fogMasterLowpass = new Tone.Filter({
      type: 'lowpass',
      frequency: this.computeFogCutoffHz(fog, luminance),
      rolloff: -24,
      Q: 0.7,
    }).connect(this.vocalCarvingEq);

    // 3. Fog Lush Stereo Reverb + Long-Tail Space Network (2s to 18s effective decay)
    this.masterReverb = new Tone.Reverb({
      decay: 11.5,
      preDelay: 0.08,
      wet: this.computeReverbWet(fog),
    }).connect(this.fogMasterLowpass);
    await this.masterReverb.generate();

    this.longTailReverb = new Tone.Freeverb({
      roomSize: this.computeFreeverbRoomSize(fog),
      dampening: 1800 + (1 - fog) * 4200,
      wet: 0.15 + fog * 0.55,
    }).connect(this.masterReverb);

    // 4. Stereo Ping-Pong Delay (feedback & wet controlled by Fog & Viscosity)
    this.pingPongDelay = new Tone.PingPongDelay({
      delayTime: '4n.',
      maxDelay: 2.0,
      feedback: this.computePingPongFeedback(fog, viscosity),
      wet: 0.12 + fog * 0.34,
    }).connect(this.longTailReverb);

    // 5. Nostalgia Analog Tape Wow & Flutter Pitch Drift (0.8 Hz sine LFO modulating delay time by a few ms)
    this.nostalgiaTapeDelay = new Tone.Delay({
      delayTime: 0.012,
      maxDelay: 0.05,
    }).connect(this.pingPongDelay);

    this.wowFlutterLfo = new Tone.LFO({
      frequency: 0.8,
      type: 'sine',
      min: 0.012 - nostalgia * 0.0035,
      max: 0.012 + nostalgia * 0.0035,
    });
    this.wowFlutterLfo.connect(this.nostalgiaTapeDelay.delayTime);
    this.wowFlutterLfo.start();

    // 6. Nostalgia Soft-Clipping Midrange Saturation Waveshaper
    this.nostalgiaWaveshaper = new Tone.WaveShaper(
      createSoftClipCurve(0.6 + nostalgia * 2.2),
      1024
    ).connect(this.nostalgiaTapeDelay);

    this.nostalgiaDriveGain = new Tone.Gain(1.0 + nostalgia * 0.85).connect(
      this.nostalgiaWaveshaper
    );

    // 7. Central Core Stereo Balance Panner & Dedicated Bilateral EMDR Panner
    this.corePanner = new Tone.Panner(state.coreOffset.x).connect(this.nostalgiaDriveGain);
    this.bilateralPanner = new Tone.Panner(state.coreOffset.x).connect(this.nostalgiaDriveGain);

    this.emdrLfo = new Tone.LFO({
      frequency: prac.emdrRateHz,
      min: -prac.emdrStereoWidth,
      max: prac.emdrStereoWidth,
      type: 'sine',
    });

    // Soft dedicated harmonic pulse routed through the sinusoidal Bilateral Panner
    this.emdrPulseGain = new Tone.Gain(0.0).connect(this.bilateralPanner);
    this.emdrPulseOsc = new Tone.Oscillator({
      frequency: 220,
      type: 'sine',
      volume: -18,
    }).connect(this.emdrPulseGain);

    this.emdrPulseLfo = new Tone.LFO({
      frequency: prac.emdrRateHz * 2,
      min: 0.02,
      max: 0.22,
      type: 'sine',
    });

    // =========================================================================
    // CLINICAL TOOL 4: SOMATIC SUB-BASS (40-60 Hz) & BINAURAL THETA (100/106 Hz)
    // =========================================================================
    // Somatic Sub-Bass Anchor bypassed around vocal-carving notch directly into masterGain
    this.somaticSubGain = new Tone.Gain(
      this.computeSomaticSubLinearGain(state)
    ).connect(this.masterGain);

    this.somaticSubOsc = new Tone.Oscillator({
      frequency: resolveSomaticSubBassHz(state.activeSeedId),
      type: 'sine',
    }).connect(this.somaticSubGain);

    // Subtle Binaural Theta Entrainment: Left 100 Hz & Right 106 Hz -> 6 Hz Theta beat
    this.binauralMasterGain = new Tone.Gain(
      this.computeBinauralLinearGain(state)
    ).connect(this.masterGain);

    this.binauralLeftPanner = new Tone.Panner(-1.0).connect(this.binauralMasterGain);
    this.binauralRightPanner = new Tone.Panner(1.0).connect(this.binauralMasterGain);

    this.binauralLeftOsc = new Tone.Oscillator({
      frequency: 100,
      type: 'sine',
    }).connect(this.binauralLeftPanner);

    this.binauralRightOsc = new Tone.Oscillator({
      frequency: 106,
      type: 'sine',
    }).connect(this.binauralRightPanner);

    // =========================================================================
    // LAYER A: THE CORE DRONE (Detuned Fat Sawtooth + -12dB Sub-Sine + 24dB LPF)
    // =========================================================================
    this.droneFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 220 + luminance * 680,
      rolloff: -24,
      Q: 2.1,
    }).connect(this.corePanner);

    this.breathFreqHz = this.computeBreathingRateHz(viscosity);
    const { minCutoff, maxCutoff } = this.computeDroneFilterBreathBounds(luminance, fog);
    this.droneBreathLfo = new Tone.LFO({
      frequency: this.breathFreqHz,
      type: 'sine',
      min: minCutoff,
      max: maxCutoff,
    });
    this.droneBreathLfo.connect(this.droneFilter.frequency);
    this.droneBreathLfo.start();

    this.dronePadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 24,
      },
      envelope: {
        attack: 4.2,
        decay: 2.5,
        sustain: 0.88,
        release: 6.5,
      },
      volume: -17,
    }).connect(this.droneFilter);

    this.droneSubSynth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 4.8,
        decay: 2.0,
        sustain: 0.92,
        release: 7.0,
      },
      volume: -24, // -12 dB sub-fundamental anchor
    }).connect(this.droneFilter);

    // =========================================================================
    // LAYER B: SATELLITE VOICES (Routed through sinusoidal Bilateral Panner)
    // =========================================================================
    const { feltBlend, glassyBlend } = this.computeTimbreBlend(
      state.activeSeedId,
      viscosity,
      luminance
    );
    this.feltVoiceGain = new Tone.Gain(feltBlend).connect(this.bilateralPanner);
    this.glassyVoiceGain = new Tone.Gain(glassyBlend).connect(this.bilateralPanner);

    this.feltPianoSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.0,
      modulationIndex: 1.65,
      oscillator: {
        type: 'sine',
      },
      modulation: {
        type: 'triangle',
      },
      envelope: {
        attack: this.computeFeltAttack(viscosity),
        decay: 1.35 + viscosity * 1.8,
        sustain: 0.08,
        release: this.computeFeltRelease(viscosity),
      },
      modulationEnvelope: {
        attack: 0.008,
        decay: 0.24 + viscosity * 0.35,
        sustain: 0.02,
        release: 0.6,
      },
      volume: -10,
    }).connect(this.feltVoiceGain);

    this.glassyPadSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      oscillator: {
        type: 'fatsine',
        count: 2,
        spread: 16,
      },
      modulation: {
        type: 'sine',
      },
      envelope: {
        attack: this.computeGlassyAttack(viscosity),
        decay: 2.4,
        sustain: 0.65,
        release: this.computeGlassyRelease(viscosity),
      },
      modulationEnvelope: {
        attack: 1.2 + viscosity * 1.8,
        decay: 2.0,
        sustain: 0.7,
        release: 3.5 + viscosity * 3.0,
      },
      volume: -11,
    }).connect(this.glassyVoiceGain);

    // =========================================================================
    // LAYER C: ORGANIC TEXTURE GENERATOR (Brown/Pink Noise + Slow Bandpass LFO)
    // =========================================================================
    this.textureOutputGain = new Tone.Gain(
      this.computeTextureNoiseGain(nostalgia, fog)
    ).connect(this.fogMasterLowpass);

    this.textureBandpass = new Tone.Filter({
      type: 'bandpass',
      frequency: 520,
      rolloff: -12,
      Q: 1.8,
    }).connect(this.textureOutputGain);

    this.textureSweepLfo = new Tone.LFO({
      frequency: 0.065,
      type: 'sine',
      min: 240,
      max: 1180,
    });
    this.textureSweepLfo.connect(this.textureBandpass.frequency);
    this.textureSweepLfo.start();

    const preset = SEED_PRESETS[state.activeSeedId];
    const isPinkPrimary = preset.noiseProfile === 'pink';

    this.pinkNoiseGain = new Tone.Gain(isPinkPrimary ? 0.65 : 0.35).connect(
      this.textureBandpass
    );
    this.brownNoiseGain = new Tone.Gain(isPinkPrimary ? 0.35 : 0.75).connect(
      this.textureBandpass
    );

    this.pinkNoise = new Tone.Noise('pink').connect(this.pinkNoiseGain);
    this.brownNoise = new Tone.Noise('brown').connect(this.brownNoiseGain);
  }

  private startContinuousGenerators(): void {
    if (this.pinkNoise && this.pinkNoise.state !== 'started') {
      this.pinkNoise.start();
    }
    if (this.brownNoise && this.brownNoise.state !== 'started') {
      this.brownNoise.start();
    }
    if (this.somaticSubOsc && this.somaticSubOsc.state !== 'started') {
      this.somaticSubOsc.start();
    }
    if (this.binauralLeftOsc && this.binauralLeftOsc.state !== 'started') {
      this.binauralLeftOsc.start();
    }
    if (this.binauralRightOsc && this.binauralRightOsc.state !== 'started') {
      this.binauralRightOsc.start();
    }
    if (this.emdrPulseOsc && this.emdrPulseOsc.state !== 'started') {
      this.emdrPulseOsc.start();
    }
  }

  private stopContinuousGenerators(): void {
    if (this.pinkNoise && this.pinkNoise.state === 'started') {
      this.pinkNoise.stop();
    }
    if (this.brownNoise && this.brownNoise.state === 'started') {
      this.brownNoise.stop();
    }
    if (this.somaticSubOsc && this.somaticSubOsc.state === 'started') {
      this.somaticSubOsc.stop();
    }
    if (this.binauralLeftOsc && this.binauralLeftOsc.state === 'started') {
      this.binauralLeftOsc.stop();
    }
    if (this.binauralRightOsc && this.binauralRightOsc.state === 'started') {
      this.binauralRightOsc.stop();
    }
    if (this.emdrPulseOsc && this.emdrPulseOsc.state === 'started') {
      this.emdrPulseOsc.stop();
    }
  }

  private computeSomaticSubLinearGain(state: AetheriumState): number {
    if (state.mode !== 'practitioner') {
      return 0.0;
    }
    // Warm 40-60 Hz physical room/headphone sub-anchor
    return Math.max(0, Math.min(0.26, state.practitioner.somaticSubBassLevel * 0.24));
  }

  private computeBinauralLinearGain(state: AetheriumState): number {
    if (state.mode !== 'practitioner' || !state.practitioner.binauralThetaEnabled) {
      return 0.0;
    }
    // Masked organically beneath the ambient soundscape (-26 dB linear equivalent)
    return 0.048;
  }

  private computeFogCutoffHz(fog: number, luminance: number): number {
    const baseHz = 12000 * Math.pow(1200 / 12000, Math.max(0, Math.min(1, fog)));
    const lumLift = 0.75 + luminance * 0.5;
    return Math.max(950, Math.min(14000, Math.round(baseHz * lumLift)));
  }

  private computeReverbWet(fog: number): number {
    return Math.max(0.16, Math.min(0.88, 0.18 + fog * 0.68));
  }

  private computeFreeverbRoomSize(fog: number): number {
    return Math.max(0.18, Math.min(0.96, 0.22 + fog * 0.72));
  }

  private computePingPongFeedback(fog: number, viscosity: number): number {
    return Math.max(0.08, Math.min(0.76, 0.1 + fog * 0.38 + viscosity * 0.24));
  }

  private computeBreathingRateHz(viscosity: number): number {
    return 0.15 - viscosity * 0.1;
  }

  private computeDroneFilterBreathBounds(
    luminance: number,
    fog: number
  ): { minCutoff: number; maxCutoff: number } {
    const fogDamp = 1.0 - fog * 0.38;
    const minCutoff = Math.round((130 + luminance * 340) * fogDamp);
    const maxCutoff = Math.round((340 + luminance * 1250) * fogDamp);
    return {
      minCutoff: Math.max(90, minCutoff),
      maxCutoff: Math.max(minCutoff + 120, maxCutoff),
    };
  }

  private computeFeltAttack(viscosity: number): number {
    return 0.015 + viscosity * 0.265;
  }

  private computeFeltRelease(viscosity: number): number {
    return 1.8 + viscosity * 4.7;
  }

  private computeGlassyAttack(viscosity: number): number {
    return 1.5 + viscosity * 2.5;
  }

  private computeGlassyRelease(viscosity: number): number {
    return 3.0 + viscosity * 5.5;
  }

  private computeTimbreBlend(
    seedId: SeedId,
    viscosity: number,
    luminance: number
  ): { feltBlend: number; glassyBlend: number } {
    const preset = SEED_PRESETS[seedId];
    if (preset.timbre === 'felt-piano') {
      const padOverlay = Math.min(0.65, viscosity * 0.4 + luminance * 0.25);
      return {
        feltBlend: 0.85,
        glassyBlend: 0.18 + padOverlay,
      };
    }
    const feltBody = Math.max(0.15, (1.0 - viscosity) * 0.45);
    return {
      feltBlend: feltBody,
      glassyBlend: 0.88,
    };
  }

  private computeTextureNoiseGain(nostalgia: number, fog: number): number {
    return 0.006 + nostalgia * 0.042 + fog * 0.016;
  }

  private updateDroneHarmony(seedId: SeedId, luminance: number, force = false): void {
    if (!this.dronePadSynth || !this.droneSubSynth) return;

    const zone = HarmonicEngine.resolveHarmonicZone(seedId, luminance);
    const seedChanged = this.activeSeedId !== seedId;
    const zoneChanged = this.activeHarmonicZoneId !== zone.id;

    if (!force && !seedChanged && !zoneChanged) {
      return;
    }

    this.activeSeedId = seedId;
    this.activeHarmonicZoneId = zone.id;

    const now = Tone.now();
    if (this.activeDroneNotes.length > 0) {
      this.dronePadSynth.releaseAll(now);
    }
    this.dronePadSynth.triggerAttack(zone.droneVoicing, now + 0.05, 0.34);
    this.activeDroneNotes = [...zone.droneVoicing];

    if (this.activeSubNote !== zone.subFundamental) {
      if (this.activeSubNote) {
        this.droneSubSynth.triggerRelease(now);
      }
      this.droneSubSynth.triggerAttack(zone.subFundamental, now + 0.05, 0.5);
      this.activeSubNote = zone.subFundamental;
    }

    // Update Somatic Sub-Bass (40-60 Hz) & EMDR Harmonic Pulse pitch to match tonal center
    if (this.somaticSubOsc) {
      this.somaticSubOsc.frequency.rampTo(resolveSomaticSubBassHz(seedId), RAMP_TIME_SEC);
    }
    if (this.emdrPulseOsc) {
      const pulseNote = `${zone.rootNote}3`;
      const pulseFreq = Tone.Frequency(pulseNote).toFrequency();
      this.emdrPulseOsc.frequency.rampTo(pulseFreq, RAMP_TIME_SEC);
    }
  }

  private syncWithState(state: AetheriumState): void {
    const { luminance, fog, viscosity, nostalgia } = state.macros;
    const prac = state.practitioner;
    this.breathFreqHz = this.computeBreathingRateHz(viscosity);

    if (!this.isInitialized) return;

    if (state.isPlaying) {
      this.updateDroneHarmony(state.activeSeedId, luminance, false);
    }

    // 1. Fog & Luminance -> Master Low-Pass Filter + Reverb Decay/Wet + Ping-Pong Delay
    if (this.fogMasterLowpass) {
      this.fogMasterLowpass.frequency.rampTo(
        this.computeFogCutoffHz(fog, luminance),
        RAMP_TIME_SEC
      );
    }

    if (this.masterReverb) {
      this.masterReverb.wet.rampTo(this.computeReverbWet(fog), RAMP_TIME_SEC);
    }

    if (this.longTailReverb) {
      this.longTailReverb.roomSize.rampTo(this.computeFreeverbRoomSize(fog), RAMP_TIME_SEC);
      this.longTailReverb.dampening = 1800 + (1 - fog) * 4200;
      this.longTailReverb.wet.rampTo(0.15 + fog * 0.55, RAMP_TIME_SEC);
    }

    if (this.pingPongDelay) {
      this.pingPongDelay.feedback.rampTo(
        this.computePingPongFeedback(fog, viscosity),
        RAMP_TIME_SEC
      );
      this.pingPongDelay.wet.rampTo(0.12 + fog * 0.34, RAMP_TIME_SEC);
    }

    // 2. Viscosity & Luminance -> Layer A Drone Breathing LFO & Layer B Voice Envelopes
    if (this.droneBreathLfo) {
      this.droneBreathLfo.frequency.rampTo(this.breathFreqHz, RAMP_TIME_SEC);
      const { minCutoff, maxCutoff } = this.computeDroneFilterBreathBounds(luminance, fog);
      this.droneBreathLfo.min = minCutoff;
      this.droneBreathLfo.max = maxCutoff;
    }

    const { feltBlend, glassyBlend } = this.computeTimbreBlend(
      state.activeSeedId,
      viscosity,
      luminance
    );
    this.feltVoiceGain?.gain.rampTo(feltBlend, RAMP_TIME_SEC);
    this.glassyVoiceGain?.gain.rampTo(glassyBlend, RAMP_TIME_SEC);

    if (this.feltPianoSynth) {
      this.feltPianoSynth.set({
        modulationIndex: 1.2 + luminance * 1.4,
        envelope: {
          attack: this.computeFeltAttack(viscosity),
          decay: 1.35 + viscosity * 1.8,
          sustain: 0.08,
          release: this.computeFeltRelease(viscosity),
        },
      });
    }

    if (this.glassyPadSynth) {
      this.glassyPadSynth.set({
        envelope: {
          attack: this.computeGlassyAttack(viscosity),
          decay: 2.4,
          sustain: 0.65,
          release: this.computeGlassyRelease(viscosity),
        },
        modulationEnvelope: {
          attack: 1.2 + viscosity * 1.8,
          decay: 2.0,
          sustain: 0.7,
          release: 3.5 + viscosity * 3.0,
        },
      });
    }

    // 3. Nostalgia -> 0.8Hz Wow & Flutter Pitch Drift + Soft-Clip Warmth + Layer C Noise Floor
    if (this.wowFlutterLfo) {
      const driftSec = nostalgia * 0.0038;
      this.wowFlutterLfo.min = Math.max(0.002, 0.012 - driftSec);
      this.wowFlutterLfo.max = 0.012 + driftSec;
    }

    if (this.nostalgiaDriveGain) {
      this.nostalgiaDriveGain.gain.rampTo(1.0 + nostalgia * 0.85, RAMP_TIME_SEC);
    }

    if (this.textureOutputGain) {
      this.textureOutputGain.gain.rampTo(
        this.computeTextureNoiseGain(nostalgia, fog),
        RAMP_TIME_SEC
      );
    }

    const preset = SEED_PRESETS[state.activeSeedId];
    const isPinkPrimary = preset.noiseProfile === 'pink';
    this.pinkNoiseGain?.gain.rampTo(isPinkPrimary ? 0.65 : 0.35, RAMP_TIME_SEC);
    this.brownNoiseGain?.gain.rampTo(isPinkPrimary ? 0.35 : 0.75, RAMP_TIME_SEC);

    // 4. Core Stereo Balance & Clinical Tool 3: Bilateral Stimulation (EMDR / Somatic Panner)
    if (this.corePanner) {
      this.corePanner.pan.rampTo(
        Math.max(-1, Math.min(1, state.coreOffset.x)),
        RAMP_TIME_SEC
      );
    }

    if (this.bilateralPanner && this.emdrLfo && this.emdrPulseLfo && this.emdrPulseGain) {
      const emdrActive = state.mode === 'practitioner' && prac.emdrBilateralEnabled;
      if (emdrActive) {
        this.emdrLfo.frequency.rampTo(prac.emdrRateHz, RAMP_TIME_SEC);
        this.emdrLfo.min = -prac.emdrStereoWidth;
        this.emdrLfo.max = prac.emdrStereoWidth;

        this.emdrPulseLfo.frequency.rampTo(prac.emdrRateHz * 2, RAMP_TIME_SEC);
        this.emdrPulseLfo.min = 0.02 * prac.emdrStereoWidth;
        this.emdrPulseLfo.max = 0.22 * prac.emdrStereoWidth;

        if (this.emdrLfo.state !== 'started') {
          this.emdrLfo.connect(this.bilateralPanner.pan);
          this.emdrLfo.start();
        }
        if (this.emdrPulseLfo.state !== 'started') {
          this.emdrPulseLfo.connect(this.emdrPulseGain.gain);
          this.emdrPulseLfo.start();
        }
      } else {
        if (this.emdrLfo.state === 'started') {
          this.emdrLfo.stop();
          this.emdrLfo.disconnect();
        }
        if (this.emdrPulseLfo.state === 'started') {
          this.emdrPulseLfo.stop();
          this.emdrPulseLfo.disconnect();
        }
        this.emdrPulseGain.gain.rampTo(0.0, RAMP_TIME_SEC);
        this.bilateralPanner.pan.rampTo(
          Math.max(-1, Math.min(1, state.coreOffset.x)),
          RAMP_TIME_SEC
        );
      }
    }

    // 5. Clinical Tool 1: Vocal-Range Acoustic Carving (1100 Hz, Q = 0.7, 0 dB to -12 dB)
    if (this.vocalCarvingEq) {
      const targetCarveDb =
        state.mode === 'practitioner' && prac.vocalCarvingEnabled
          ? Math.max(-12, Math.min(0, prac.vocalCarvingDepthDb))
          : 0;
      this.vocalCarvingEq.gain.rampTo(targetCarveDb, RAMP_TIME_SEC);
    }

    // 6. Clinical Tool 4: Somatic Sub-Bass (40-60 Hz) & Binaural Theta (100/106 Hz)
    if (this.somaticSubGain) {
      this.somaticSubGain.gain.rampTo(
        this.computeSomaticSubLinearGain(state),
        RAMP_TIME_SEC
      );
    }

    if (this.binauralMasterGain) {
      this.binauralMasterGain.gain.rampTo(
        this.computeBinauralLinearGain(state),
        RAMP_TIME_SEC
      );
    }

    // 7. Sleep Timer Fade-to-Silence Gain Envelope
    if (this.masterGain && state.isPlaying) {
      let targetGain = state.masterVolume;
      if (
        state.sleepTimerRemainingSec !== null &&
        state.sleepTimerRemainingSec <= 60
      ) {
        targetGain = state.masterVolume * (state.sleepTimerRemainingSec / 60);
      }
      this.masterGain.gain.rampTo(Math.max(0.0001, targetGain), RAMP_TIME_SEC);
    }
  }

  private triggerSatelliteVoice(payload: SatelliteTriggerPayload): void {
    const state = store.getState();
    if (!state.isPlaying || payload.silencedByRarity) {
      return;
    }

    const now = Tone.now();
    const { viscosity } = state.macros;

    if (this.feltPianoSynth) {
      const feltDuration = 0.9 + viscosity * 2.2;
      this.feltPianoSynth.triggerAttackRelease(
        payload.note,
        feltDuration,
        now,
        payload.velocity * 0.65
      );
    }

    if (this.glassyPadSynth) {
      const padDuration = 2.2 + viscosity * 3.8;
      this.glassyPadSynth.triggerAttackRelease(
        payload.note,
        padDuration,
        now + 0.02,
        payload.velocity * 0.52
      );
    }
  }

  public dispose(): void {
    if (this.sessionTickInterval !== null) {
      window.clearInterval(this.sessionTickInterval);
    }
    this.stopContinuousGenerators();
    this.wowFlutterLfo?.dispose();
    this.droneBreathLfo?.dispose();
    this.textureSweepLfo?.dispose();
    this.emdrLfo?.dispose();
    this.emdrPulseLfo?.dispose();
    this.emdrPulseOsc?.dispose();
    this.somaticSubOsc?.dispose();
    this.binauralLeftOsc?.dispose();
    this.binauralRightOsc?.dispose();
    this.dronePadSynth?.dispose();
    this.droneSubSynth?.dispose();
    this.feltPianoSynth?.dispose();
    this.glassyPadSynth?.dispose();
    this.pinkNoise?.dispose();
    this.brownNoise?.dispose();
    this.masterReverb?.dispose();
    this.longTailReverb?.dispose();
    this.pingPongDelay?.dispose();
    this.masterCompressor?.dispose();
    this.masterLimiter?.dispose();
  }
}
