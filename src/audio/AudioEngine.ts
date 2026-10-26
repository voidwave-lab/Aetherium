import * as Tone from 'tone';
import { HarmonicEngine, HarmonicZoneId } from './HarmonicEngine';
import { SerendipityEngine } from './SerendipityEngine';
import {
  AetheriumState,
  SatelliteTriggerPayload,
  SEED_PRESETS,
  SeedId,
  store,
} from '../state/store';

const RAMP_TIME_SEC = 0.2;

/** Euler-Bernoulli metallic inharmonic modal ratios for Tibetan Singing Bowls */
const SINGING_BOWL_RATIOS: readonly [number, number, number, number] = [
  1.0,
  2.756,
  5.404,
  8.933,
];

/** Vocal Formant frequencies (F1, F2, F3 in Hz) for 'Ooo' (/u/) and 'Ahh' (/ɑ/) */
const VOWEL_OOO_FORMANTS: readonly [number, number, number] = [450, 800, 2830];
const VOWEL_AHH_FORMANTS: readonly [number, number, number] = [700, 1220, 2600];

/**
 * Guards Web Audio parameters against NaN or Infinity which would permanently poison
 * recursive BiquadFilterNode / ConvolverNode IIR state registers.
 */
function safeFinite(val: number, fallback: number): number {
  return Number.isFinite(val) ? val : fallback;
}

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
 * Resolves a harmonic sub-bass anchor frequency strictly within 45 Hz - 65 Hz (or 43.65-58.27 Hz)
 * aligned with the active seed's tonal center.
 */
function resolveSomaticSubBassHz(seedId: SeedId): number {
  switch (seedId) {
    case 'midnight-vinyl':
      return 55.0; // A1 (55.0 Hz deep nocturnal sub-bass anchor within 45-65 Hz)
    case 'rain-on-felt':
      return 55.0; // A1 (55.0 Hz)
    case 'deep-drift':
      return 43.65; // F1 (43.65 Hz)
    case 'singing-bowls':
      return 43.65; // F1 (43.65 Hz)
    case 'subterranean':
      return 49.0; // G1 (49.0 Hz)
    case 'solar-wind':
    case 'cathedral-choir':
      return 49.0; // G1 (49.0 Hz)
    case 'bowed-glass-strings':
      return 55.0; // A1 (55.0 Hz)
    default:
      return 50.0;
  }
}

/**
 * Production Generative Web Audio, Modal/Formant/Karplus-Strong & Clinical Psychoacoustic DSP Engine.
 *
 * Implements:
 * - Layer A: Continuous Core Drone (detuned fatsawtooth + -12dB sub-sine through a 24dB resonant LPF
 *   modulated by a 0.05Hz - 0.15Hz breathing LFO).
 * - Layer B: 6 Procedural Seed Synthesis Engines:
 *   1. Felt Piano / Intimate Pluck (FM synthesis with muted hammer transient & warm woody decay)
 *   2. Glassy Space Pad (Slow-attack 1.5s-4.0s harmonic swell)
 *   3. Midnight Vinyl (Heavily low-passed <600Hz Rhodes FM chords + 45-65Hz sub-bass + 2.5kHz stochastic vinyl crackle)
 *   4. Singing Bowls (4-mode inharmonic sine partials [1.0, 2.756, 5.404, 8.933] with 0.08s attack & 14s decay)
 *   5. Cathedral Choir (3 parallel vocal formant bandpass filters morphing between 'Ahh' [700, 1220, 2600Hz] & 'Ooo' [450, 800, 2830Hz])
 *   6. Bowed Glass & Strings (Slow-attack 3.0s saw/triangle + Karplus-Strong sympathetic pluck through a woody body-resonance filter bank with 4.5Hz vibrato)
 * - Layer C: Procedural Brown/Pink Noise Organic Texture Generator + 2.5 kHz Stochastic Vinyl Crackle Impulse Engine.
 * - Phase 3 Clinical Suite DSP (1100 Hz Vocal-Range Carving, ISO Session Arc, Bilateral EMDR Panner, Somatic Sub-Bass & 6 Hz Binaural Theta).
 */
export class AudioEngine {
  private isInitialized = false;
  private isStarting = false;
  private userExplicitlyMuted = false;
  private activeSeedId: SeedId | null = null;
  private activeHarmonicZoneId: HarmonicZoneId | null = null;
  private activeModalRootOverride: string | null = null;
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
  private longTailDiffuser: Tone.FeedbackDelay | null = null;
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

  // Clinical Tool 4: Somatic Sub-Bass Anchor (40-65 Hz) & 6 Hz Binaural Theta Entrainment (100 Hz L / 106 Hz R)
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

  // Layer B Standard Voices (1. Felt Piano FM Pluck, 2. Glassy Space Pad)
  private feltPianoSynth: Tone.PolySynth<Tone.FMSynth> | null = null;
  private glassyPadSynth: Tone.PolySynth<Tone.AMSynth> | null = null;
  private feltVoiceGain: Tone.Gain | null = null;
  private glassyVoiceGain: Tone.Gain | null = null;

  // Extension Engine 1: "Midnight Vinyl" (<600 Hz Rhodes FM Chords + 2.5 kHz Stochastic Crackle)
  private rhodesSynth: Tone.PolySynth<Tone.FMSynth> | null = null;
  private rhodesLowpassFilter: Tone.Filter | null = null;
  private rhodesVoiceGain: Tone.Gain | null = null;
  private vinylCrackleSynth: Tone.NoiseSynth | null = null;
  private vinylCrackleFilter: Tone.Filter | null = null;
  private vinylCrackleGain: Tone.Gain | null = null;

  // Extension Engine 2: "Singing Bowls" (4-Mode Inharmonic Modal Synthesis [1.0, 2.756, 5.404, 8.933])
  private bowlModalSynths: Array<Tone.PolySynth<Tone.Synth>> = [];
  private bowlVoiceGain: Tone.Gain | null = null;

  // Extension Engine 3: "Cathedral Choir" (3 Parallel Vowel Formant Filters: 'Ahh' <-> 'Ooo')
  private choirSynth: Tone.PolySynth<Tone.Synth> | null = null;
  private droneFormantSendGain: Tone.Gain | null = null;
  private formantFilters: [Tone.Filter, Tone.Filter, Tone.Filter] | null = null;
  private choirFormantBusGain: Tone.Gain | null = null;
  private formantMorphPhase = 0;

  // Extension Engine 4: "Bowed Glass & Strings" (3.0s Bowed Saw/Triangle + Plucked String + Woody Body Bank + 4.5Hz Vibrato)
  private bowedStringSynth: Tone.PolySynth<Tone.AMSynth> | null = null;
  private karplusPluckSynth: Tone.PolySynth<Tone.FMSynth> | null = null;
  private woodyBodyFilters: [Tone.Filter, Tone.Filter, Tone.Filter] | null = null;
  private bowedVibrato: Tone.Vibrato | null = null;
  private bowedStringsBusGain: Tone.Gain | null = null;

  // Layer C: Organic Texture Generator (Procedural Brown/Pink Noise + Slow Bandpass Filter)
  private pinkNoise: Tone.Noise | null = null;
  private brownNoise: Tone.Noise | null = null;
  private pinkNoiseGain: Tone.Gain | null = null;
  private brownNoiseGain: Tone.Gain | null = null;
  private textureBandpass: Tone.Filter | null = null;
  private textureSweepLfo: Tone.LFO | null = null;
  private textureOutputGain: Tone.Gain | null = null;

  // Extension: Serendipity Engine (Rubato Arpeggio, Modal Breeze & 100% Wet Ghost-Echo Shimmer)
  private serendipityEngine: SerendipityEngine;
  private ghostShimmerReverb: Tone.Reverb | null = null;
  private ghostShimmerSynth: Tone.PolySynth<Tone.AMSynth> | null = null;

  private sessionTickInterval: number | null = null;
  private crackleTickInterval: number | null = null;

  constructor() {
    this.serendipityEngine = new SerendipityEngine({
      onRubatoArpeggioNote: (note, durationSec, velocity, pan) => {
        this.triggerSerendipityArpeggioNote(note, durationSec, velocity, pan);
      },
      onModalBreezeShift: () => {
        const st = store.getState();
        if (st.isPlaying) {
          this.updateDroneHarmony(st.activeSeedId, st.macros.luminance, true);
        }
      },
      onGhostEchoShimmer: (notes, durationSec, velocity) => {
        this.triggerGhostEchoShimmer(notes, durationSec, velocity);
      },
    });

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

    // 180ms tick for Vowel Formant ('Ahh' <-> 'Ooo') morphing & Stochastic 2.5kHz Vinyl Crackle micro-impulses
    this.crackleTickInterval = window.setInterval(() => {
      this.tickProceduralMicroEngines();
    }, 180);
  }

  public getBreathingModulation(timeSec: number): number {
    return 0.5 + 0.5 * Math.sin(timeSec * Math.PI * 2 * this.breathFreqHz);
  }

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
      this.userExplicitlyMuted = false;
      await this.start();
    } else {
      this.userExplicitlyMuted = true;
      this.stop();
    }
  }

  /**
   * Automatically awakens the Web Audio context and sanctuary soundscape on the user's
   * first interaction gesture (choosing a space in Onboarding, selecting a Seed, or
   * interacting with the Orbital Canvas), unless the user has explicitly muted playback.
   */
  public ensureStartedFromGesture(): void {
    if (this.userExplicitlyMuted || store.getState().isPlaying || this.isStarting) {
      return;
    }
    void this.start();
  }

  public async start(): Promise<void> {
    if (this.isStarting) return;
    this.isStarting = true;

    try {
      const rawCtx = Tone.getContext().rawContext as AudioContext;
      if (rawCtx && rawCtx.state !== 'running') {
        void rawCtx.resume();
      }

      if (!this.isInitialized) {
        this.initializeDspGraph();
        this.isInitialized = true;
      }

      await Tone.start();
      if (Tone.getContext().state !== 'running') {
        await Tone.getContext().resume();
      }

      const state = store.getState();
      this.syncWithState(state);
      this.startContinuousGenerators();
      this.updateDroneHarmony(state.activeSeedId, state.macros.luminance, true);

      if (this.masterGain) {
        const now = Tone.now();
        const targetVol = safeFinite(state.masterVolume, 0.8);
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(
          Math.max(0.02, safeFinite(this.masterGain.gain.value, 0.02)),
          now
        );
        this.masterGain.gain.rampTo(targetVol, 0.65);
      }

      store.setPlaying(true);
      this.playWelcomeBloom();
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Plays a gentle harmonic welcome bloom on the active Seed engine so the listener
   * receives immediate, unmistakable acoustic confirmation while the deep Core Drone swells in.
   */
  public playWelcomeBloom(): void {
    const state = store.getState();
    if (!this.isInitialized || !state.isPlaying) return;

    const firstSat = state.satellites[0];
    if (firstSat) {
      store.emitSatelliteTrigger(firstSat);
    }
  }

  public stop(): void {
    if (this.masterGain) {
      const now = Tone.now();
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.rampTo(0.0001, 1.0);
    }

    window.setTimeout(() => {
      if (!store.getState().isPlaying) {
        this.dronePadSynth?.releaseAll();
        this.droneSubSynth?.triggerRelease();
        this.feltPianoSynth?.releaseAll();
        this.glassyPadSynth?.releaseAll();
        this.rhodesSynth?.releaseAll();
        this.choirSynth?.releaseAll();
        this.bowedStringSynth?.releaseAll();
        this.karplusPluckSynth?.releaseAll();
        for (const bowlSynth of this.bowlModalSynths) {
          bowlSynth.releaseAll();
        }
        this.stopContinuousGenerators();
        this.activeSeedId = null;
        this.activeHarmonicZoneId = null;
      }
    }, 1050);

    store.setPlaying(false);
  }

  private initializeDspGraph(): void {
    const state = store.getState();
    const { luminance, fog, viscosity, nostalgia } = state.macros;
    const prac = state.practitioner;

    // 1. Master Safety Limiter (-1.0 dBFS) & Glue Compressor
    this.masterLimiter = new Tone.Limiter(-1.0).toDestination();
    this.masterCompressor = new Tone.Compressor({
      threshold: -16,
      ratio: 3.0,
      attack: 0.02,
      release: 0.25,
      knee: 10,
    }).connect(this.masterLimiter);

    this.masterGain = new Tone.Gain(0.02).connect(this.masterCompressor);

    // Clinical Tool 1: Vocal-Range Acoustic Carving Filter (centered at 1100 Hz, Q = 0.7, 0 to -12 dB)
    const initialCarveDb =
      state.mode === 'practitioner' && prac.vocalCarvingEnabled
        ? safeFinite(prac.vocalCarvingDepthDb, -6)
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

    // 3. Fog Lush Stereo Reverb + Native Long-Tail Stereo Diffuser (Zero AudioWorklet dependency)
    this.masterReverb = new Tone.Reverb({
      decay: 5.5,
      preDelay: 0.045,
      wet: this.computeReverbWet(fog),
    }).connect(this.fogMasterLowpass);
    void this.masterReverb.ready.catch(() => {
      // If OfflineAudioContext fails in restricted webviews, fall back cleanly to dry + diffuser
      if (this.masterReverb) {
        this.masterReverb.wet.value = 0;
      }
    });

    this.longTailDiffuser = new Tone.FeedbackDelay({
      delayTime: 0.185,
      maxDelay: 1.0,
      feedback: this.computeFreeverbRoomSize(fog) * 0.65,
      wet: 0.14 + fog * 0.42,
    }).connect(this.masterReverb);

    // 4. Stereo Ping-Pong Delay (feedback & wet controlled by Fog & Viscosity)
    this.pingPongDelay = new Tone.PingPongDelay({
      delayTime: 0.34,
      maxDelay: 1.5,
      feedback: this.computePingPongFeedback(fog, viscosity),
      wet: 0.12 + fog * 0.34,
    }).connect(this.longTailDiffuser);

    // 5. Nostalgia Analog Tape Wow & Flutter Pitch Drift (0.8 Hz sine LFO modulating delay time)
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
    // CLINICAL TOOL 4 & MIDNIGHT VINYL SUB: SOMATIC SUB-BASS (45-65 Hz) & BINAURAL THETA
    // =========================================================================
    this.somaticSubGain = new Tone.Gain(
      this.computeSomaticSubLinearGain(state)
    ).connect(this.masterGain);

    this.somaticSubOsc = new Tone.Oscillator({
      frequency: resolveSomaticSubBassHz(state.activeSeedId),
      type: 'sine',
    }).connect(this.somaticSubGain);

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
    const { minCutoff, maxCutoff } = this.computeDroneFilterBreathBounds(
      state.activeSeedId,
      luminance,
      fog
    );
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
        attack: 1.6,
        decay: 2.5,
        sustain: 0.9,
        release: 6.5,
      },
      volume: -12,
    }).connect(this.droneFilter);

    this.droneSubSynth = new Tone.Synth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 2.0,
        decay: 2.0,
        sustain: 0.92,
        release: 7.0,
      },
      volume: -16,
    }).connect(this.droneFilter);

    // =========================================================================
    // LAYER B (1 & 2): STANDARD VOICES (Felt Piano FM & Glassy Space Pad)
    // =========================================================================
    this.feltVoiceGain = new Tone.Gain(0.85).connect(this.bilateralPanner);
    this.glassyVoiceGain = new Tone.Gain(0.4).connect(this.bilateralPanner);

    this.feltPianoSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.0,
      modulationIndex: 1.65,
      oscillator: { type: 'sine' },
      modulation: { type: 'triangle' },
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
      volume: -7,
    }).connect(this.feltVoiceGain);

    this.glassyPadSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      oscillator: {
        type: 'fatsine',
        count: 2,
        spread: 16,
      },
      modulation: { type: 'sine' },
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
      volume: -8,
    }).connect(this.glassyVoiceGain);

    // =========================================================================
    // EXTENSION 1: "MIDNIGHT VINYL" (<600 Hz Rhodes FM + 2.5 kHz Vinyl Crackle)
    // =========================================================================
    this.rhodesVoiceGain = new Tone.Gain(0.0).connect(this.bilateralPanner);
    this.rhodesLowpassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 460 + luminance * 120, // Strictly < 600 Hz warm nocturnal roll-off
      rolloff: -24,
      Q: 1.35,
    }).connect(this.rhodesVoiceGain);

    this.rhodesSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 0.9,
      oscillator: { type: 'sine' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.018 + viscosity * 0.08,
        decay: 1.8 + viscosity * 1.6,
        sustain: 0.22,
        release: 2.6 + viscosity * 3.2,
      },
      modulationEnvelope: {
        attack: 0.005,
        decay: 0.45,
        sustain: 0.05,
        release: 0.8,
      },
      volume: -8,
    }).connect(this.rhodesLowpassFilter);

    // Procedural Vinyl Crackle / Rain Micro-Impulse Generator filtered at 2.5 kHz
    this.vinylCrackleGain = new Tone.Gain(0.0).connect(this.vocalCarvingEq);
    this.vinylCrackleFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 2500,
      Q: 3.4,
    }).connect(this.vinylCrackleGain);

    this.vinylCrackleSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.0005,
        decay: 0.0055,
        sustain: 0,
      },
      volume: -16,
    }).connect(this.vinylCrackleFilter);

    // =========================================================================
    // EXTENSION 2: "SINGING BOWLS" (4 Inharmonic Modes: 1.0, 2.756, 5.404, 8.933)
    // =========================================================================
    this.bowlVoiceGain = new Tone.Gain(0.0).connect(this.bilateralPanner);
    const modalVolumesDb = [-10, -17, -23, -29];
    const modalDecaysSec = [14.0, 11.2, 8.4, 5.8];

    this.bowlModalSynths = SINGING_BOWL_RATIOS.map((_ratio, idx) => {
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.08, // Soft felt-mallet attack (0.08s)
          decay: modalDecaysSec[idx], // Ultra-long 14s fundamental modal decay
          sustain: 0.0,
          release: modalDecaysSec[idx],
        },
        volume: modalVolumesDb[idx],
      }).connect(this.bowlVoiceGain!);
    });

    // =========================================================================
    // EXTENSION 3: "CATHEDRAL CHOIR" (3 Parallel Vowel Formant Filters: 'Ahh' <-> 'Ooo')
    // =========================================================================
    this.choirFormantBusGain = new Tone.Gain(0.0).connect(this.bilateralPanner);

    const f1 = new Tone.Filter({
      type: 'bandpass',
      frequency: VOWEL_AHH_FORMANTS[0],
      rolloff: -12,
      Q: 6.5,
    }).connect(this.choirFormantBusGain);

    const f2 = new Tone.Filter({
      type: 'bandpass',
      frequency: VOWEL_AHH_FORMANTS[1],
      rolloff: -12,
      Q: 7.5,
    }).connect(this.choirFormantBusGain);

    const f3 = new Tone.Filter({
      type: 'bandpass',
      frequency: VOWEL_AHH_FORMANTS[2],
      rolloff: -12,
      Q: 8.5,
    }).connect(this.choirFormantBusGain);

    this.formantFilters = [f1, f2, f3];

    this.choirSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        count: 4,
        spread: 28,
      },
      envelope: {
        attack: 1.8 + viscosity * 2.2,
        decay: 2.5,
        sustain: 0.78,
        release: 4.5 + viscosity * 4.5,
      },
      volume: -6,
    });
    this.choirSynth.connect(f1);
    this.choirSynth.connect(f2);
    this.choirSynth.connect(f3);

    // Also route a send from the continuous Core Drone through the 3 vocal formant filters
    this.droneFormantSendGain = new Tone.Gain(0.0);
    this.dronePadSynth.connect(this.droneFormantSendGain);
    this.droneFormantSendGain.connect(f1);
    this.droneFormantSendGain.connect(f2);
    this.droneFormantSendGain.connect(f3);

    // =========================================================================
    // EXTENSION 4: "BOWED GLASS & STRINGS" (3.0s Bowed Swell + Woody Body Bank + 4.5Hz Vibrato)
    // =========================================================================
    this.bowedStringsBusGain = new Tone.Gain(0.0).connect(this.bilateralPanner);

    // Delayed organic vibrato at 4.5 Hz
    this.bowedVibrato = new Tone.Vibrato({
      frequency: 4.5,
      depth: 0.14 + nostalgia * 0.1,
      wet: 0.82,
    }).connect(this.bowedStringsBusGain);

    // Woody Body-Resonance Filter Bank (250 Hz Cavity, 520 Hz Bridge, 1850 Hz Rosin Sheen)
    const bodyLow = new Tone.Filter({
      type: 'bandpass',
      frequency: 250,
      Q: 2.4,
    }).connect(this.bowedVibrato);

    const bodyMid = new Tone.Filter({
      type: 'bandpass',
      frequency: 520,
      Q: 2.8,
    }).connect(this.bowedVibrato);

    const bodyHigh = new Tone.Filter({
      type: 'bandpass',
      frequency: 1850,
      Q: 3.1,
    }).connect(this.bowedVibrato);

    this.woodyBodyFilters = [bodyLow, bodyMid, bodyHigh];

    this.bowedStringSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.0,
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 18,
      },
      modulation: {
        type: 'triangle',
      },
      envelope: {
        attack: 3.0, // Slow 3.0s bowed attack
        decay: 2.4,
        sustain: 0.78,
        release: 4.8 + viscosity * 4.2,
      },
      modulationEnvelope: {
        attack: 2.2,
        decay: 1.8,
        sustain: 0.85,
        release: 4.0,
      },
      volume: -6,
    });
    this.bowedStringSynth.connect(bodyLow);
    this.bowedStringSynth.connect(bodyMid);
    this.bowedStringSynth.connect(bodyHigh);

    // Sympathetic plucked-string resonance layer (100% native Web Audio FM string model, zero AudioWorklet)
    this.karplusPluckSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 3.2,
      oscillator: { type: 'triangle' },
      modulation: { type: 'sine' },
      envelope: {
        attack: 0.004,
        decay: 1.45,
        sustain: 0.0,
        release: 2.4,
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.18,
        sustain: 0.0,
        release: 0.35,
      },
      volume: -11,
    });
    this.karplusPluckSynth.connect(bodyLow);
    this.karplusPluckSynth.connect(bodyMid);

    // =========================================================================
    // LAYER C: ORGANIC TEXTURE GENERATOR (Brown/Pink Noise + Slow Bandpass LFO)
    // =========================================================================
    this.textureOutputGain = new Tone.Gain(
      this.computeTextureNoiseGain(state.activeSeedId, nostalgia, fog)
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

    // =========================================================================
    // SERENDIPITY EVENT C: 100% WET REVERB SHIMMER BUS ("GHOST ECHO")
    // =========================================================================
    this.ghostShimmerReverb = new Tone.Reverb({
      decay: 9.5,
      preDelay: 0.09,
      wet: 1.0, // Strictly 100% wet reverb bus
    }).connect(this.fogMasterLowpass);
    void this.ghostShimmerReverb.ready.catch(() => {
      // Fallback cleanly if OfflineAudioContext is restricted
    });

    this.ghostShimmerSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.0,
      oscillator: {
        type: 'fatsine',
        count: 3,
        spread: 22,
      },
      modulation: {
        type: 'sine',
      },
      envelope: {
        attack: 1.8,
        decay: 3.5,
        sustain: 0.45,
        release: 7.5,
      },
      modulationEnvelope: {
        attack: 1.5,
        decay: 2.8,
        sustain: 0.5,
        release: 6.0,
      },
      volume: -9,
    }).connect(this.ghostShimmerReverb);
  }

  /**
   * Periodic 180ms procedural tick for:
   * 1. Vowel Formant Morphing ('Ahh' [700, 1220, 2600 Hz] <-> 'Ooo' [450, 800, 2830 Hz])
   * 2. Stochastic 2.5 kHz Vinyl Crackle / Nocturnal Rain micro-impulses
   */
  private tickProceduralMicroEngines(): void {
    if (!this.isInitialized) return;
    const state = store.getState();
    if (!state.isPlaying) return;

    // 1. Update Vowel Formant Morphing for Cathedral Choir
    if (this.formantFilters && state.activeSeedId === 'cathedral-choir') {
      this.formantMorphPhase += 0.18 * (0.35 + (1 - state.macros.viscosity) * 0.45);
      // Morph factor 0.0 ('Ooo') <-> 1.0 ('Ahh') biased gently by Luminance
      const osc = 0.5 + 0.5 * Math.sin(this.formantMorphPhase);
      const morphAhh = Math.max(
        0,
        Math.min(1, osc * 0.75 + state.macros.luminance * 0.25)
      );

      for (let i = 0; i < 3; i++) {
        const targetHz =
          VOWEL_OOO_FORMANTS[i] +
          (VOWEL_AHH_FORMANTS[i] - VOWEL_OOO_FORMANTS[i]) * morphAhh;
        this.formantFilters[i].frequency.rampTo(targetHz, 0.18);
      }
    }

    // 2. Stochastic 2.5 kHz Vinyl Crackle micro-impulses
    if (this.vinylCrackleSynth && this.vinylCrackleFilter) {
      const isMidnightVinyl = state.activeSeedId === 'midnight-vinyl';
      const crackleProb = isMidnightVinyl
        ? 0.42 + state.macros.nostalgia * 0.42
        : state.macros.nostalgia > 0.45
          ? (state.macros.nostalgia - 0.45) * 0.45
          : 0;

      if (crackleProb > 0 && Math.random() < crackleProb) {
        // Randomize center frequency slightly around 2.5 kHz (2100 - 2900 Hz) for organic surface grain
        this.vinylCrackleFilter.frequency.value = 2150 + Math.random() * 700;
        const vel = (0.15 + Math.random() * 0.55) * (isMidnightVinyl ? 1.0 : 0.6);
        this.vinylCrackleSynth.triggerAttackRelease(0.006, Tone.now(), vel);
      }
    }
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
    // Midnight Vinyl always engages its signature 45-65 Hz deep sub-bass sine drone
    const vinylSubBase = state.activeSeedId === 'midnight-vinyl' ? 0.16 : 0.0;
    const practitionerSub =
      state.mode === 'practitioner' ? state.practitioner.somaticSubBassLevel * 0.24 : 0.0;
    return Math.max(0, Math.min(0.28, Math.max(vinylSubBase, practitionerSub)));
  }

  private computeBinauralLinearGain(state: AetheriumState): number {
    if (state.mode !== 'practitioner' || !state.practitioner.binauralThetaEnabled) {
      return 0.0;
    }
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
    seedId: SeedId,
    luminance: number,
    fog: number
  ): { minCutoff: number; maxCutoff: number } {
    // Midnight Vinyl keeps drone filter strictly warm and nocturnal (< 580 Hz)
    if (seedId === 'midnight-vinyl') {
      return {
        minCutoff: 140,
        maxCutoff: Math.round(360 + luminance * 210),
      };
    }
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

  private computeEngineVoiceGains(
    seedId: SeedId,
    viscosity: number,
    luminance: number
  ): {
    felt: number;
    glassy: number;
    rhodes: number;
    bowls: number;
    choir: number;
    droneFormantSend: number;
    bowed: number;
  } {
    const preset = SEED_PRESETS[seedId];
    switch (preset.timbre) {
      case 'rhodes-lofi':
        return {
          felt: 0.12,
          glassy: 0.0,
          rhodes: 0.95,
          bowls: 0.0,
          choir: 0.0,
          droneFormantSend: 0.0,
          bowed: 0.0,
        };
      case 'singing-bowls':
        return {
          felt: 0.0,
          glassy: 0.16 * viscosity,
          rhodes: 0.0,
          bowls: 0.95,
          choir: 0.0,
          droneFormantSend: 0.0,
          bowed: 0.0,
        };
      case 'cathedral-choir':
        return {
          felt: 0.0,
          glassy: 0.22,
          rhodes: 0.0,
          bowls: 0.0,
          choir: 0.95,
          droneFormantSend: 0.78,
          bowed: 0.0,
        };
      case 'bowed-strings':
        return {
          felt: 0.0,
          glassy: 0.18,
          rhodes: 0.0,
          bowls: 0.0,
          choir: 0.0,
          droneFormantSend: 0.0,
          bowed: 0.95,
        };
      case 'felt-piano': {
        const padOverlay = Math.min(0.65, viscosity * 0.4 + luminance * 0.25);
        return {
          felt: 0.85,
          glassy: 0.18 + padOverlay,
          rhodes: 0.0,
          bowls: 0.0,
          choir: 0.0,
          droneFormantSend: 0.0,
          bowed: 0.0,
        };
      }
      case 'glassy-pad':
      default: {
        const feltBody = Math.max(0.15, (1.0 - viscosity) * 0.45);
        return {
          felt: feltBody,
          glassy: 0.88,
          rhodes: 0.0,
          bowls: 0.0,
          choir: 0.0,
          droneFormantSend: 0.0,
          bowed: 0.0,
        };
      }
    }
  }

  private computeTextureNoiseGain(
    seedId: SeedId,
    nostalgia: number,
    fog: number
  ): number {
    const n = safeFinite(nostalgia, 0.35);
    const f = safeFinite(fog, 0.5);
    const vinylBoost = seedId === 'midnight-vinyl' ? 0.018 : 0.0;
    return safeFinite(0.006 + n * 0.042 + f * 0.016 + vinylBoost, 0.02);
  }

  private updateDroneHarmony(seedId: SeedId, luminance: number, force = false): void {
    if (!this.dronePadSynth || !this.droneSubSynth) return;

    const modalRootOverride = store.getState().modalRootOverride;
    const zone = HarmonicEngine.resolveHarmonicZone(seedId, luminance, modalRootOverride);
    const seedChanged = this.activeSeedId !== seedId;
    const zoneChanged = this.activeHarmonicZoneId !== zone.id;
    const modalRootChanged = this.activeModalRootOverride !== modalRootOverride;

    if (!force && !seedChanged && !zoneChanged && !modalRootChanged) {
      return;
    }

    const hadPreviousSeed = this.activeSeedId !== null;
    this.activeSeedId = seedId;
    this.activeHarmonicZoneId = zone.id;
    this.activeModalRootOverride = modalRootOverride;

    const now = Tone.now();
    if (this.activeDroneNotes.length > 0) {
      this.dronePadSynth.releaseAll(now);
    }
    this.dronePadSynth.triggerAttack(zone.droneVoicing, now + 0.05, 0.45);
    this.activeDroneNotes = [...zone.droneVoicing];

    if (this.activeSubNote !== zone.subFundamental) {
      if (this.activeSubNote) {
        this.droneSubSynth.triggerRelease(now);
      }
      this.droneSubSynth.triggerAttack(zone.subFundamental, now + 0.05, 0.58);
      this.activeSubNote = zone.subFundamental;
    }

    if (this.somaticSubOsc) {
      const subHz = modalRootOverride
        ? safeFinite(Tone.Frequency(`${modalRootOverride}1`).toFrequency(), resolveSomaticSubBassHz(seedId))
        : resolveSomaticSubBassHz(seedId);
      this.somaticSubOsc.frequency.rampTo(subHz, 1.8);
    }
    if (this.emdrPulseOsc) {
      const pulseNote = `${zone.rootNote}3`;
      const pulseFreq = Tone.Frequency(pulseNote).toFrequency();
      this.emdrPulseOsc.frequency.rampTo(pulseFreq, RAMP_TIME_SEC);
    }

    // When the user switches Seed presets while playing, chime the first satellite gently
    if (hadPreviousSeed && seedChanged && !force) {
      window.setTimeout(() => {
        this.playWelcomeBloom();
      }, 60);
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

    if (this.longTailDiffuser) {
      this.longTailDiffuser.feedback.rampTo(
        this.computeFreeverbRoomSize(fog) * 0.65,
        RAMP_TIME_SEC
      );
      this.longTailDiffuser.wet.rampTo(0.14 + fog * 0.42, RAMP_TIME_SEC);
    }

    if (this.pingPongDelay) {
      this.pingPongDelay.feedback.rampTo(
        this.computePingPongFeedback(fog, viscosity),
        RAMP_TIME_SEC
      );
      this.pingPongDelay.wet.rampTo(0.12 + fog * 0.34, RAMP_TIME_SEC);
    }

    // 2. Viscosity & Luminance -> Layer A Drone Breathing LFO & Layer B Voice Buses
    if (this.droneBreathLfo) {
      this.droneBreathLfo.frequency.rampTo(this.breathFreqHz, RAMP_TIME_SEC);
      const { minCutoff, maxCutoff } = this.computeDroneFilterBreathBounds(
        state.activeSeedId,
        luminance,
        fog
      );
      this.droneBreathLfo.min = minCutoff;
      this.droneBreathLfo.max = maxCutoff;
    }

    const gains = this.computeEngineVoiceGains(state.activeSeedId, viscosity, luminance);
    this.feltVoiceGain?.gain.rampTo(gains.felt, RAMP_TIME_SEC);
    this.glassyVoiceGain?.gain.rampTo(gains.glassy, RAMP_TIME_SEC);
    this.rhodesVoiceGain?.gain.rampTo(gains.rhodes, RAMP_TIME_SEC);
    this.bowlVoiceGain?.gain.rampTo(gains.bowls, RAMP_TIME_SEC);
    this.choirFormantBusGain?.gain.rampTo(gains.choir, RAMP_TIME_SEC);
    this.droneFormantSendGain?.gain.rampTo(gains.droneFormantSend, RAMP_TIME_SEC);
    this.bowedStringsBusGain?.gain.rampTo(gains.bowed, RAMP_TIME_SEC);

    // Midnight Vinyl Rhodes low-pass ceiling (< 600 Hz) & 2.5 kHz Crackle Gain
    if (this.rhodesLowpassFilter) {
      const rhodesCutoff = Math.min(585, Math.round(380 + luminance * 200));
      this.rhodesLowpassFilter.frequency.rampTo(rhodesCutoff, RAMP_TIME_SEC);
    }
    if (this.vinylCrackleGain) {
      const targetCrackle =
        state.activeSeedId === 'midnight-vinyl'
          ? 0.25 + nostalgia * 0.38
          : nostalgia > 0.45
            ? (nostalgia - 0.45) * 0.25
            : 0.0;
      this.vinylCrackleGain.gain.rampTo(targetCrackle, RAMP_TIME_SEC);
    }

    // Bowed Glass & Strings 3.0s attack & 4.5Hz Vibrato depth
    if (this.bowedStringSynth) {
      this.bowedStringSynth.set({
        envelope: {
          attack: 2.6 + viscosity * 0.8, // ~3.0s bowed swell
          decay: 2.4,
          sustain: 0.78,
          release: 4.5 + viscosity * 4.5,
        },
      });
    }
    if (this.bowedVibrato && this.woodyBodyFilters) {
      this.bowedVibrato.depth.rampTo(0.12 + nostalgia * 0.14, RAMP_TIME_SEC);
      this.woodyBodyFilters[2].frequency.rampTo(1650 + luminance * 550, RAMP_TIME_SEC);
    }

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
        this.computeTextureNoiseGain(state.activeSeedId, nostalgia, fog),
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

    // 6. Clinical Tool 4 & Midnight Vinyl Sub-Bass (45-65 Hz) & Binaural Theta (100/106 Hz)
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

  /**
   * Triggers the active procedural Seed engine when a satellite crosses the 12 o'clock Meridian.
   */
  private triggerSatelliteVoice(payload: SatelliteTriggerPayload): void {
    const state = store.getState();
    if (!state.isPlaying || payload.silencedByRarity) {
      return;
    }

    const now = Tone.now();
    const { viscosity } = state.macros;
    const timbre = payload.timbre;

    if (timbre === 'rhodes-lofi') {
      // 1. Midnight Vinyl: Low-passed Rhodes FM chord dyad (<600 Hz)
      if (this.rhodesSynth) {
        const zone = store.getActiveHarmonicZone();
        const thirdPitch =
          zone.pitchClasses[(payload.satellite.scaleDegree + 2) % zone.pitchClasses.length] ??
          zone.rootNote;
        const chordNotes = [
          payload.note,
          `${thirdPitch}${Math.min(4, payload.satellite.octave)}`,
        ];
        this.rhodesSynth.triggerAttackRelease(
          chordNotes,
          1.6 + viscosity * 2.4,
          now,
          payload.velocity * 0.62
        );
      }
      return;
    }

    if (timbre === 'singing-bowls') {
      // 2. Singing Bowls: 4 Inharmonic Modal Sine Partials [1.0, 2.756, 5.404, 8.933]
      const baseFreq = payload.frequency;
      const modalDurations = [13.5, 10.5, 7.8, 5.2];
      SINGING_BOWL_RATIOS.forEach((ratio, idx) => {
        const partialFreq = baseFreq * ratio;
        if (partialFreq < 9500 && this.bowlModalSynths[idx]) {
          this.bowlModalSynths[idx].triggerAttackRelease(
            partialFreq,
            modalDurations[idx],
            now,
            payload.velocity * 0.65
          );
        }
      });
      return;
    }

    if (timbre === 'cathedral-choir') {
      // 3. Cathedral Choir: Vowel Formant Filtered Choir Swell
      if (this.choirSynth) {
        this.choirSynth.triggerAttackRelease(
          payload.note,
          3.2 + viscosity * 4.2,
          now,
          payload.velocity * 0.58
        );
      }
      if (this.glassyPadSynth) {
        this.glassyPadSynth.triggerAttackRelease(
          payload.note,
          2.6 + viscosity * 3.2,
          now + 0.04,
          payload.velocity * 0.35
        );
      }
      return;
    }

    if (timbre === 'bowed-strings') {
      // 4. Bowed Glass & Strings: 3.0s Bowed Saw/Triangle Swell + Sympathetic Plucked String
      if (this.bowedStringSynth) {
        this.bowedStringSynth.triggerAttackRelease(
          payload.note,
          3.8 + viscosity * 4.5,
          now,
          payload.velocity * 0.68
        );
      }
      if (this.karplusPluckSynth) {
        this.karplusPluckSynth.triggerAttackRelease(
          payload.note,
          1.4,
          now + 0.02,
          payload.velocity * 0.52
        );
      }
      return;
    }

    // Standard Felt Piano & Glassy Space Pad blend
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

  /**
   * Triggers a single note of a Serendipity "Rubato Arpeggio" (Event A)
   * with low, non-startling velocity on a delicate felt-piano / harp blend.
   */
  public triggerSerendipityArpeggioNote(
    note: string,
    durationSec: number,
    velocity: number,
    _pan: number
  ): void {
    const state = store.getState();
    if (!this.isInitialized || !state.isPlaying) return;

    const now = Tone.now();
    const safeVel = Math.max(0.12, Math.min(0.38, safeFinite(velocity, 0.24)));

    if (state.activeSeedId === 'midnight-vinyl' && this.rhodesSynth) {
      this.rhodesSynth.triggerAttackRelease(note, durationSec, now, safeVel * 0.85);
      return;
    }

    if (state.activeSeedId === 'singing-bowls' && this.bowlModalSynths[0]) {
      const freq = safeFinite(Tone.Frequency(note).toFrequency(), 440);
      this.bowlModalSynths[0].triggerAttackRelease(freq, durationSec * 2.2, now, safeVel * 0.75);
      return;
    }

    if (this.feltPianoSynth) {
      this.feltPianoSynth.triggerAttackRelease(note, durationSec, now, safeVel);
    }
    if (this.glassyPadSynth) {
      this.glassyPadSynth.triggerAttackRelease(
        note,
        durationSec * 1.35,
        now + 0.03,
        safeVel * 0.55
      );
    }
  }

  /**
   * Triggers a Serendipity "High-Octave Shimmer / Ghost Echo" (Event C):
   * a crystalline Octave-5 harmonic dyad (5th or 3rd) routed 100% through the wet Reverb bus.
   */
  public triggerGhostEchoShimmer(
    notes: [string, string],
    durationSec: number,
    velocity: number
  ): void {
    const state = store.getState();
    if (!this.isInitialized || !state.isPlaying || !this.ghostShimmerSynth) return;

    const now = Tone.now();
    const safeVel = Math.max(0.14, Math.min(0.4, safeFinite(velocity, 0.26)));
    this.ghostShimmerSynth.triggerAttackRelease(notes, durationSec, now, safeVel);
  }

  public dispose(): void {
    this.serendipityEngine.dispose();
    if (this.sessionTickInterval !== null) {
      window.clearInterval(this.sessionTickInterval);
    }
    if (this.crackleTickInterval !== null) {
      window.clearInterval(this.crackleTickInterval);
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
    this.rhodesSynth?.dispose();
    this.vinylCrackleSynth?.dispose();
    this.choirSynth?.dispose();
    this.bowedStringSynth?.dispose();
    this.karplusPluckSynth?.dispose();
    for (const s of this.bowlModalSynths) {
      s.dispose();
    }
    this.pinkNoise?.dispose();
    this.brownNoise?.dispose();
    this.ghostShimmerSynth?.dispose();
    this.ghostShimmerReverb?.dispose();
    this.masterReverb?.dispose();
    this.longTailDiffuser?.dispose();
    this.pingPongDelay?.dispose();
    this.masterCompressor?.dispose();
    this.masterLimiter?.dispose();
  }
}
