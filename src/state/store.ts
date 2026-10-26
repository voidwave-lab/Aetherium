import {
  HarmonicEngine,
  HarmonicZoneInfo,
  SatelliteTimbreKind,
} from '../audio/HarmonicEngine';

export type OperatingMode = 'explorer' | 'practitioner';

export type SeedId =
  | 'rain-on-felt'
  | 'deep-drift'
  | 'subterranean'
  | 'solar-wind'
  | 'midnight-vinyl'
  | 'singing-bowls'
  | 'cathedral-choir'
  | 'bowed-glass-strings';

export type SleepTimerDuration = 0 | 15 | 30 | 60;

export type IsoDurationMinutes = 20 | 45 | 50 | 60;

export type IsoStartStateId =
  | 'high-agitation'
  | 'melancholic-heavy'
  | 'dissociated-flat';

export type IsoTargetStateId = 'parasympathetic-rest' | 'warm-openness';

export type IsoSessionPhase = 'mirroring' | 'co-regulation' | 're-orientation';

export type SerendipityEventKind = 'rubato-arpeggio' | 'modal-breeze' | 'ghost-echo';

export interface SerendipityEventPayload {
  id: string;
  kind: SerendipityEventKind;
  label: string;
  /** Notes triggered by this event (3-5 notes for Rubato Arpeggio, shifted root for Modal Breeze, Octave-5 dyad for Ghost Echo) */
  notes: string[];
  /** Relative step offsets in ms for Rubato Arpeggio notes so the canvas comet pulses in sync */
  stepOffsetsMs?: number[];
  /** Modal degree ('IV' or 'VI') and duration (ms) when kind === 'modal-breeze' */
  modalDegree?: 'IV' | 'VI';
  durationMs: number;
  timestamp: number;
}

export interface MacroParams {
  /** 0.0 (Shadow: Aeolian/Phrygian) -> 1.0 (Light: Cosmic Lydian & bright filter cutoff) */
  luminance: number;
  /** 0.0 (Clarity) -> 1.0 (Mist: stereo reverb decay 2s-18s, ping-pong feedback & HF roll-off 12kHz->1.2kHz) */
  fog: number;
  /** 0.0 (Crystalline) -> 1.0 (Dense: slow attack/release envelopes & damped orbital tick rate) */
  viscosity: number;
  /** 0.0 (Pristine) -> 1.0 (Worn: 0.8Hz wow/flutter pitch drift, soft-clip warmth & organic noise floor) */
  nostalgia: number;
  /** 0.0 (Continuous) -> 1.0 (Sparse: entropy gate probability that a meridian crossing rests in silence) */
  rarity: number;
  /** 0.0 (Stillness) -> 1.0 (Sparks: stochastic rubato arpeggios, modal root breezes & ghost-echo shimmers) */
  serendipity: number;
}

export interface IsoVectorTarget extends MacroParams {
  orbitalSpeedMultiplier: number;
}

export const ISO_START_STATES: Record<
  IsoStartStateId,
  { id: IsoStartStateId; label: string; clinicalNote: string; vector: IsoVectorTarget }
> = {
  'high-agitation': {
    id: 'high-agitation',
    label: 'High Agitation / Tension',
    clinicalNote: 'Matches sympathetic hyper-arousal with active orbital motion & defined transients.',
    vector: {
      luminance: 0.28,
      fog: 0.28,
      viscosity: 0.22,
      nostalgia: 0.30,
      rarity: 0.14,
      serendipity: 0.18,
      orbitalSpeedMultiplier: 1.42,
    },
  },
  'melancholic-heavy': {
    id: 'melancholic-heavy',
    label: 'Melancholic / Heavy',
    clinicalNote: 'Attunes to grief or depressive weight via deep Aeolian/Dorian resonance & slow drift.',
    vector: {
      luminance: 0.14,
      fog: 0.68,
      viscosity: 0.74,
      nostalgia: 0.62,
      rarity: 0.38,
      serendipity: 0.08,
      orbitalSpeedMultiplier: 0.72,
    },
  },
  'dissociated-flat': {
    id: 'dissociated-flat',
    label: 'Dissociated / Flat',
    clinicalNote: 'Mirrors dorsal vagal numbness with diffused mist, sparse triggers & gentle sub-anchor.',
    vector: {
      luminance: 0.36,
      fog: 0.82,
      viscosity: 0.68,
      nostalgia: 0.48,
      rarity: 0.54,
      serendipity: 0.06,
      orbitalSpeedMultiplier: 0.64,
    },
  },
};

export const ISO_TARGET_STATES: Record<
  IsoTargetStateId,
  { id: IsoTargetStateId; label: string; clinicalNote: string; vector: IsoVectorTarget }
> = {
  'parasympathetic-rest': {
    id: 'parasympathetic-rest',
    label: 'Parasympathetic Rest / Safe Grounding',
    clinicalNote: 'Guides autonomic pacing toward deep vagal safety, warm envelopes & slow orbital flow.',
    vector: {
      luminance: 0.54,
      fog: 0.56,
      viscosity: 0.82,
      nostalgia: 0.34,
      rarity: 0.42,
      serendipity: 0.05,
      orbitalSpeedMultiplier: 0.58,
    },
  },
  'warm-openness': {
    id: 'warm-openness',
    label: 'Warm Openness',
    clinicalNote: 'Opens harmonic filter into Maj9/Lydian consonance for emotional integration.',
    vector: {
      luminance: 0.72,
      fog: 0.42,
      viscosity: 0.56,
      nostalgia: 0.24,
      rarity: 0.24,
      serendipity: 0.05,
      orbitalSpeedMultiplier: 0.82,
    },
  },
};

/** Final 10% Re-Orientation vector so the patient leaves alert and grounded (serendipity ramps to 0.35) */
export const ISO_REORIENTATION_VECTOR: IsoVectorTarget = {
  luminance: 0.84,
  fog: 0.22,
  viscosity: 0.36,
  nostalgia: 0.18,
  rarity: 0.18,
  serendipity: 0.35,
  orbitalSpeedMultiplier: 0.96,
};

export interface SatelliteNode {
  id: string;
  /** Normalized orbital semi-major axis (0.14 = innermost Oct 4-5, 0.94 = outermost Oct 2-3) */
  semiMajorAxis: number;
  /** Keplerian orbital eccentricity (0.04 to 0.24) */
  eccentricity: number;
  /** Current orbital angle in radians (-PI to PI; -PI/2 is 12 o'clock North Meridian) */
  angle: number;
  /** Orientation angle of the ellipse in radians */
  argumentOfPeriapsis: number;
  /** Musical pitch register (Inner: 4-5, Middle: 3-4, Outer: 2-3) */
  octave: number;
  /** Degree index within the active harmonic zone's quantized scale */
  scaleDegree: number;
  /** Timestamp (performance.now) when this satellite last crossed the 12 o'clock Meridian */
  lastTriggeredAt: number;
  /** Whether the most recent meridian crossing was skipped by the Rarity entropy gate */
  lastTriggerSilenced?: boolean;
}

export interface SatelliteTriggerPayload {
  satellite: SatelliteNode;
  note: string;
  frequency: number;
  velocity: number;
  pan: number;
  timbre: SatelliteTimbreKind;
  harmonicZoneLabel: string;
  silencedByRarity: boolean;
  timestamp: number;
}

export interface SeedPreset {
  id: SeedId;
  name: string;
  subtitle: string;
  description: string;
  rootNote: string;
  scaleType: string;
  timbre: SatelliteTimbreKind;
  noiseProfile: 'pink' | 'brown';
  defaultMacros: MacroParams;
  initialOrbits: Array<{
    semiMajorAxis: number;
    eccentricity: number;
    angle: number;
    argumentOfPeriapsis: number;
    scaleDegree: number;
  }>;
}

export interface PractitionerConfig {
  isDockCollapsed: boolean;

  // 1. Vocal-Range Acoustic Carving (Speech Clarity Filter @ 1100 Hz, Q = 0.7)
  vocalCarvingEnabled: boolean;
  /** Adjustable from 0 dB to -12 dB (stored as negative dB, e.g. -8.5) */
  vocalCarvingDepthDb: number;

  // 2. Automated ISO-Principle Session Arc (Vector Pacing)
  isoDurationMinutes: IsoDurationMinutes;
  isoStartState: IsoStartStateId;
  isoTargetState: IsoTargetStateId;
  isoArcRunning: boolean;
  isoElapsedSec: number;
  isoActivePhase: IsoSessionPhase;
  isoOrbitalSpeedMultiplier: number;

  // 3. Bilateral Stimulation (EMDR / Somatic Panner)
  emdrBilateralEnabled: boolean;
  /** 0.2 Hz ultra-slow meditative sweep up to 1.5 Hz active processing pace */
  emdrRateHz: number;
  /** Stereo width 0.0 (0%) to 1.0 (100%) */
  emdrStereoWidth: number;

  // 4. Psychoacoustic Sub-Bass & Binaural Grounding
  /** 0.0 to 1.0 boost for pure 40-60 Hz somatic sub-fundamental sine wave */
  somaticSubBassLevel: number;
  /** Splits fundamental sub-drone into Left (100 Hz) & Right (106 Hz) for 6 Hz Theta binaural beat */
  binauralThetaEnabled: boolean;
}

export interface SavedPresetRecord {
  id: string;
  name: string;
  savedAt: string;
  payloadJson: string;
}

export interface AetheriumState {
  mode: OperatingMode;
  hasCompletedOnboarding: boolean;
  isOnboardingOpen: boolean;
  activeSeedId: SeedId;
  macros: MacroParams;
  satellites: SatelliteNode[];
  /** Normalized stereo & spatial offset of the Central Core (-1.0 to +1.0) */
  coreOffset: {
    x: number;
    y: number;
  };
  isPlaying: boolean;
  masterVolume: number;
  sleepTimerMinutes: SleepTimerDuration;
  sleepTimerRemainingSec: number | null;
  practitioner: PractitionerConfig;
  savedPresets: SavedPresetRecord[];
  lastTriggerEvent: SatelliteTriggerPayload | null;
  lastSerendipityEvent: SerendipityEventPayload | null;
  /** Temporary modal root shift ('IV' or 'VI') triggered by Serendipity Modal Breeze */
  modalRootOverride: string | null;
  modalRootDegree: 'IV' | 'VI' | null;
  statusToast: string | null;
}

export const MAX_SATELLITES = 12;

export const SEED_PRESETS: Record<SeedId, SeedPreset> = {
  'rain-on-felt': {
    id: 'rain-on-felt',
    name: 'Rain on Felt',
    subtitle: 'D Dorian · Felt Piano & Intimate Pluck',
    description: 'Damped felt hammers, warm woody FM decay, gentle minor-seventh intervals, and distant rain.',
    rootNote: 'D',
    scaleType: 'dorian',
    timbre: 'felt-piano',
    noiseProfile: 'pink',
    defaultMacros: {
      luminance: 0.34,
      fog: 0.46,
      viscosity: 0.42,
      nostalgia: 0.58,
      rarity: 0.22,
      serendipity: 0.28,
    },
    initialOrbits: [
      { semiMajorAxis: 0.22, eccentricity: 0.09, angle: -2.1, argumentOfPeriapsis: 0.4, scaleDegree: 0 },
      { semiMajorAxis: 0.36, eccentricity: 0.14, angle: -0.9, argumentOfPeriapsis: 1.2, scaleDegree: 1 },
      { semiMajorAxis: 0.52, eccentricity: 0.11, angle: 0.7, argumentOfPeriapsis: 2.5, scaleDegree: 3 },
      { semiMajorAxis: 0.72, eccentricity: 0.16, angle: 2.2, argumentOfPeriapsis: 0.8, scaleDegree: 5 },
      { semiMajorAxis: 0.86, eccentricity: 0.08, angle: -1.65, argumentOfPeriapsis: 1.9, scaleDegree: 2 },
    ],
  },
  'deep-drift': {
    id: 'deep-drift',
    name: 'Deep Drift',
    subtitle: 'F Lydian · Glassy Space Pad',
    description: 'Slow-swelling glassy harmonic pads, raised-fourth Lydian wonder, and deep orbital viscosity.',
    rootNote: 'F',
    scaleType: 'lydian',
    timbre: 'glassy-pad',
    noiseProfile: 'brown',
    defaultMacros: {
      luminance: 0.82,
      fog: 0.76,
      viscosity: 0.78,
      nostalgia: 0.28,
      rarity: 0.30,
      serendipity: 0.32,
    },
    initialOrbits: [
      { semiMajorAxis: 0.26, eccentricity: 0.12, angle: -1.8, argumentOfPeriapsis: 0.9, scaleDegree: 2 },
      { semiMajorAxis: 0.46, eccentricity: 0.18, angle: -0.4, argumentOfPeriapsis: 2.1, scaleDegree: 3 },
      { semiMajorAxis: 0.64, eccentricity: 0.15, angle: 1.4, argumentOfPeriapsis: 0.3, scaleDegree: 1 },
      { semiMajorAxis: 0.82, eccentricity: 0.10, angle: 2.6, argumentOfPeriapsis: 1.5, scaleDegree: 0 },
    ],
  },
  'subterranean': {
    id: 'subterranean',
    name: 'Subterranean',
    subtitle: 'C Aeolian/Phrygian · Grounded Dark Drone',
    description: 'Cavernous sub-harmonic resonance, muted low-register plucks, and sparse meditative triggers.',
    rootNote: 'C',
    scaleType: 'aeolian',
    timbre: 'felt-piano',
    noiseProfile: 'brown',
    defaultMacros: {
      luminance: 0.12,
      fog: 0.68,
      viscosity: 0.66,
      nostalgia: 0.52,
      rarity: 0.46,
      serendipity: 0.16,
    },
    initialOrbits: [
      { semiMajorAxis: 0.34, eccentricity: 0.17, angle: -2.4, argumentOfPeriapsis: 1.1, scaleDegree: 2 },
      { semiMajorAxis: 0.56, eccentricity: 0.21, angle: -0.8, argumentOfPeriapsis: 2.8, scaleDegree: 4 },
      { semiMajorAxis: 0.76, eccentricity: 0.14, angle: 1.1, argumentOfPeriapsis: 0.6, scaleDegree: 0 },
      { semiMajorAxis: 0.89, eccentricity: 0.09, angle: 2.8, argumentOfPeriapsis: 1.9, scaleDegree: 3 },
    ],
  },
  'solar-wind': {
    id: 'solar-wind',
    name: 'Solar Wind',
    subtitle: 'G Maj9 / Lydian · Warm & Consonant',
    description: 'Golden harmonic overtones, luminous corona swell, and reassuring open Maj9 intervals.',
    rootNote: 'G',
    scaleType: 'maj9',
    timbre: 'glassy-pad',
    noiseProfile: 'pink',
    defaultMacros: {
      luminance: 0.66,
      fog: 0.38,
      viscosity: 0.34,
      nostalgia: 0.24,
      rarity: 0.15,
      serendipity: 0.36,
    },
    initialOrbits: [
      { semiMajorAxis: 0.21, eccentricity: 0.07, angle: -1.9, argumentOfPeriapsis: 0.2, scaleDegree: 4 },
      { semiMajorAxis: 0.34, eccentricity: 0.11, angle: -1.1, argumentOfPeriapsis: 1.4, scaleDegree: 2 },
      { semiMajorAxis: 0.49, eccentricity: 0.13, angle: 0.2, argumentOfPeriapsis: 2.2, scaleDegree: 0 },
      { semiMajorAxis: 0.66, eccentricity: 0.09, angle: 1.6, argumentOfPeriapsis: 0.7, scaleDegree: 5 },
      { semiMajorAxis: 0.83, eccentricity: 0.12, angle: 2.7, argumentOfPeriapsis: 1.8, scaleDegree: 1 },
    ],
  },
  'midnight-vinyl': {
    id: 'midnight-vinyl',
    name: 'Midnight Vinyl',
    subtitle: 'Nocturnal Lo-Fi · <600Hz Rhodes & Vinyl Crackle',
    description:
      'Deep 45–65 Hz sub-bass sine drone, heavily low-passed Rhodes FM chords (<600 Hz), and stochastic 2.5 kHz vinyl crackle & nocturnal rain.',
    rootNote: 'D',
    scaleType: 'dorian',
    timbre: 'rhodes-lofi',
    noiseProfile: 'pink',
    defaultMacros: {
      luminance: 0.26,
      fog: 0.62,
      viscosity: 0.54,
      nostalgia: 0.84,
      rarity: 0.28,
      serendipity: 0.24,
    },
    initialOrbits: [
      { semiMajorAxis: 0.32, eccentricity: 0.12, angle: -2.0, argumentOfPeriapsis: 0.6, scaleDegree: 0 },
      { semiMajorAxis: 0.48, eccentricity: 0.15, angle: -0.7, argumentOfPeriapsis: 1.4, scaleDegree: 2 },
      { semiMajorAxis: 0.64, eccentricity: 0.11, angle: 0.9, argumentOfPeriapsis: 2.1, scaleDegree: 5 },
      { semiMajorAxis: 0.81, eccentricity: 0.16, angle: 2.4, argumentOfPeriapsis: 0.3, scaleDegree: 1 },
    ],
  },
  'singing-bowls': {
    id: 'singing-bowls',
    name: 'Singing Bowls',
    subtitle: 'Inharmonic Modal · 4 Metallic Ratios (14s Decay)',
    description:
      'Clinical grounding via 4-mode inharmonic sine partials (1.0, 2.756, 5.404, 8.933) with a 0.08s felt-mallet strike and 14s resonant decay.',
    rootNote: 'F',
    scaleType: 'maj9',
    timbre: 'singing-bowls',
    noiseProfile: 'brown',
    defaultMacros: {
      luminance: 0.58,
      fog: 0.54,
      viscosity: 0.72,
      nostalgia: 0.18,
      rarity: 0.34,
      serendipity: 0.20,
    },
    initialOrbits: [
      { semiMajorAxis: 0.25, eccentricity: 0.08, angle: -1.7, argumentOfPeriapsis: 0.5, scaleDegree: 0 },
      { semiMajorAxis: 0.44, eccentricity: 0.10, angle: -0.3, argumentOfPeriapsis: 1.6, scaleDegree: 3 },
      { semiMajorAxis: 0.65, eccentricity: 0.12, angle: 1.2, argumentOfPeriapsis: 2.4, scaleDegree: 4 },
      { semiMajorAxis: 0.84, eccentricity: 0.09, angle: 2.5, argumentOfPeriapsis: 0.9, scaleDegree: 1 },
    ],
  },
  'cathedral-choir': {
    id: 'cathedral-choir',
    name: 'Cathedral Choir',
    subtitle: 'Vowel Formant DSP · Morphing Ahh ↔ Ooo Choir',
    description:
      'Drone and satellite pads sculpted through 3 parallel vocal formant bandpass filters morphing between "Ahh" [700, 1220, 2600 Hz] and "Ooo" [450, 800, 2830 Hz].',
    rootNote: 'G',
    scaleType: 'lydian',
    timbre: 'cathedral-choir',
    noiseProfile: 'pink',
    defaultMacros: {
      luminance: 0.76,
      fog: 0.84,
      viscosity: 0.80,
      nostalgia: 0.32,
      rarity: 0.26,
      serendipity: 0.26,
    },
    initialOrbits: [
      { semiMajorAxis: 0.28, eccentricity: 0.11, angle: -1.9, argumentOfPeriapsis: 0.8, scaleDegree: 0 },
      { semiMajorAxis: 0.46, eccentricity: 0.14, angle: -0.6, argumentOfPeriapsis: 1.9, scaleDegree: 1 },
      { semiMajorAxis: 0.62, eccentricity: 0.13, angle: 0.8, argumentOfPeriapsis: 0.4, scaleDegree: 3 },
      { semiMajorAxis: 0.79, eccentricity: 0.10, angle: 2.1, argumentOfPeriapsis: 1.5, scaleDegree: 4 },
      { semiMajorAxis: 0.90, eccentricity: 0.07, angle: -1.2, argumentOfPeriapsis: 2.7, scaleDegree: 2 },
    ],
  },
  'bowed-glass-strings': {
    id: 'bowed-glass-strings',
    name: 'Bowed Glass & Strings',
    subtitle: 'Post-Rock / Cinematic · 3s Bowed Swell & Woody Body',
    description:
      'Slow-attack (3.0s) bowed saw/triangle & sympathetic Karplus-Strong strings routed through a woody body-resonance filter bank with 4.5 Hz organic vibrato.',
    rootNote: 'D',
    scaleType: 'dorian',
    timbre: 'bowed-strings',
    noiseProfile: 'brown',
    defaultMacros: {
      luminance: 0.44,
      fog: 0.64,
      viscosity: 0.68,
      nostalgia: 0.46,
      rarity: 0.22,
      serendipity: 0.30,
    },
    initialOrbits: [
      { semiMajorAxis: 0.24, eccentricity: 0.10, angle: -2.2, argumentOfPeriapsis: 0.3, scaleDegree: 2 },
      { semiMajorAxis: 0.41, eccentricity: 0.15, angle: -0.9, argumentOfPeriapsis: 1.7, scaleDegree: 4 },
      { semiMajorAxis: 0.59, eccentricity: 0.12, angle: 0.5, argumentOfPeriapsis: 2.3, scaleDegree: 0 },
      { semiMajorAxis: 0.76, eccentricity: 0.14, angle: 1.9, argumentOfPeriapsis: 0.8, scaleDegree: 5 },
      { semiMajorAxis: 0.88, eccentricity: 0.09, angle: -1.4, argumentOfPeriapsis: 1.2, scaleDegree: 3 },
    ],
  },
};

export function radiusToOctave(semiMajorAxis: number): number {
  return HarmonicEngine.mapRadiusToOctave(semiMajorAxis).octave;
}

export function resolveSatellitePitch(
  satellite: Pick<SatelliteNode, 'semiMajorAxis' | 'octave' | 'scaleDegree'>,
  seedId: SeedId = store.getState().activeSeedId,
  luminance: number = store.getState().macros.luminance
): {
  note: string;
  frequency: number;
  registerLabel: string;
  harmonicZone: HarmonicZoneInfo;
} {
  const rootOverride = store.getState().modalRootOverride;
  const quantized = HarmonicEngine.quantizeSatellitePitch(
    satellite.semiMajorAxis,
    satellite.scaleDegree,
    seedId,
    luminance,
    rootOverride
  );
  return {
    note: quantized.note,
    frequency: quantized.frequency,
    registerLabel: quantized.registerLabel,
    harmonicZone: quantized.harmonicZone,
  };
}

function cosineInterp(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const mu = (1 - Math.cos(clamped * Math.PI)) * 0.5;
  return a * (1 - mu) + b * mu;
}

function interpolateVectors(
  v1: IsoVectorTarget,
  v2: IsoVectorTarget,
  t: number
): IsoVectorTarget {
  return {
    luminance: cosineInterp(v1.luminance, v2.luminance, t),
    fog: cosineInterp(v1.fog, v2.fog, t),
    viscosity: cosineInterp(v1.viscosity, v2.viscosity, t),
    nostalgia: cosineInterp(v1.nostalgia, v2.nostalgia, t),
    rarity: cosineInterp(v1.rarity, v2.rarity, t),
    serendipity: cosineInterp(v1.serendipity, v2.serendipity, t),
    orbitalSpeedMultiplier: cosineInterp(
      v1.orbitalSpeedMultiplier,
      v2.orbitalSpeedMultiplier,
      t
    ),
  };
}

export function evaluateIsoSessionArc(
  progress01: number,
  startStateId: IsoStartStateId,
  targetStateId: IsoTargetStateId
): { phase: IsoSessionPhase; vector: IsoVectorTarget } {
  const p = Math.max(0, Math.min(1, progress01));
  const startVec = ISO_START_STATES[startStateId].vector;
  const targetVec = ISO_TARGET_STATES[targetStateId].vector;

  if (p < 0.22) {
    const localT = p / 0.75;
    return {
      phase: 'mirroring',
      vector: interpolateVectors(startVec, targetVec, localT),
    };
  }

  if (p < 0.75) {
    const localT = p / 0.75;
    const interp = interpolateVectors(startVec, targetVec, localT);
    // Keep serendipity low (0.05) during the deep parasympathetic middle phase
    return {
      phase: 'co-regulation',
      vector: {
        ...interp,
        serendipity: 0.05,
      },
    };
  }

  if (p < 0.90) {
    return {
      phase: 'co-regulation',
      vector: {
        ...targetVec,
        serendipity: 0.05,
      },
    };
  }

  const reorientT = (p - 0.90) / 0.10;
  return {
    phase: 're-orientation',
    vector: interpolateVectors(
      { ...targetVec, serendipity: 0.05 },
      ISO_REORIENTATION_VECTOR,
      reorientT
    ),
  };
}

function createSatellitesForPreset(preset: SeedPreset): SatelliteNode[] {
  return preset.initialOrbits.map((orbit, idx) => ({
    id: `sat-${preset.id}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    semiMajorAxis: orbit.semiMajorAxis,
    eccentricity: orbit.eccentricity,
    angle: orbit.angle,
    argumentOfPeriapsis: orbit.argumentOfPeriapsis,
    octave: radiusToOctave(orbit.semiMajorAxis),
    scaleDegree: orbit.scaleDegree,
    lastTriggeredAt: 0,
    lastTriggerSilenced: false,
  }));
}

type StateListener = (state: AetheriumState) => void;
type TriggerListener = (payload: SatelliteTriggerPayload) => void;
type SerendipityListener = (payload: SerendipityEventPayload) => void;

const STORAGE_KEY_MODE = 'aetherium.operating_mode.v1';
const STORAGE_KEY_PRESETS = 'aetherium.saved_presets.v1';

class AetheriumStore {
  private state: AetheriumState;
  private listeners: Set<StateListener> = new Set();
  private triggerListeners: Set<TriggerListener> = new Set();
  private serendipityListeners: Set<SerendipityListener> = new Set();
  private toastTimer: number | null = null;

  constructor() {
    const defaultSeed = SEED_PRESETS['rain-on-felt'];
    const savedMode = this.readSavedMode();
    const savedPresets = this.readSavedPresets();

    this.state = {
      mode: savedMode ?? 'explorer',
      hasCompletedOnboarding: false,
      isOnboardingOpen: true,
      activeSeedId: defaultSeed.id,
      macros: { ...defaultSeed.defaultMacros },
      satellites: createSatellitesForPreset(defaultSeed),
      coreOffset: { x: 0, y: 0 },
      isPlaying: false,
      masterVolume: 0.84,
      sleepTimerMinutes: 0,
      sleepTimerRemainingSec: null,
      practitioner: {
        isDockCollapsed: false,
        vocalCarvingEnabled: true,
        vocalCarvingDepthDb: -8.5,
        isoDurationMinutes: 50,
        isoStartState: 'high-agitation',
        isoTargetState: 'parasympathetic-rest',
        isoArcRunning: false,
        isoElapsedSec: 0,
        isoActivePhase: 'mirroring',
        isoOrbitalSpeedMultiplier: 1.0,
        emdrBilateralEnabled: false,
        emdrRateHz: 0.45,
        emdrStereoWidth: 0.85,
        somaticSubBassLevel: 0.35,
        binauralThetaEnabled: false,
      },
      savedPresets,
      lastTriggerEvent: null,
      lastSerendipityEvent: null,
      modalRootOverride: null,
      modalRootDegree: null,
      statusToast: null,
    };
  }

  private readSavedMode(): OperatingMode | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_MODE);
      if (raw === 'explorer' || raw === 'practitioner') {
        return raw;
      }
    } catch {
      // Ignore storage access errors in restricted webviews
    }
    return null;
  }

  private readSavedPresets(): SavedPresetRecord[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_PRESETS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  }

  private persistSavedPresets(list: SavedPresetRecord[]): void {
    try {
      window.localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(list));
    } catch {
      // Ignore storage quota errors
    }
  }

  public getState(): AetheriumState {
    return this.state;
  }

  public getActivePreset(): SeedPreset {
    return SEED_PRESETS[this.state.activeSeedId];
  }

  public getActiveHarmonicZone(): HarmonicZoneInfo {
    return HarmonicEngine.resolveHarmonicZone(
      this.state.activeSeedId,
      this.state.macros.luminance,
      this.state.modalRootOverride
    );
  }

  /**
   * Returns the effective Serendipity value (0.0 to 1.0), enforcing the Clinical Safety Guard:
   * automatically clamped to 0.0 when Bilateral EMDR mode is active in Practitioner mode.
   */
  public getEffectiveSerendipity(): number {
    if (this.state.mode === 'practitioner' && this.state.practitioner.emdrBilateralEnabled) {
      return 0.0;
    }
    return Math.max(0, Math.min(1, this.state.macros.serendipity));
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onSatelliteTrigger(listener: TriggerListener): () => void {
    this.triggerListeners.add(listener);
    return () => {
      this.triggerListeners.delete(listener);
    };
  }

  public onSerendipityEvent(listener: SerendipityListener): () => void {
    this.serendipityListeners.add(listener);
    return () => {
      this.serendipityListeners.delete(listener);
    };
  }

  public emitSerendipityEvent(payload: SerendipityEventPayload): void {
    this.state = {
      ...this.state,
      lastSerendipityEvent: payload,
    };
    for (const listener of this.serendipityListeners) {
      listener(payload);
    }
    this.emit();
  }

  public setModalRootOverride(rootNote: string | null, degree: 'IV' | 'VI' | null): void {
    if (
      this.state.modalRootOverride === rootNote &&
      this.state.modalRootDegree === degree
    ) {
      return;
    }
    this.state = {
      ...this.state,
      modalRootOverride: rootNote,
      modalRootDegree: degree,
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public setMode(mode: OperatingMode, closeOnboarding = true): void {
    try {
      window.localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {
      // Ignore storage restrictions
    }
    this.state = {
      ...this.state,
      mode,
      hasCompletedOnboarding: true,
      isOnboardingOpen: closeOnboarding ? false : this.state.isOnboardingOpen,
    };
    this.emit();
  }

  public toggleMode(): void {
    const nextMode: OperatingMode = this.state.mode === 'explorer' ? 'practitioner' : 'explorer';
    this.setMode(nextMode, true);
    this.showToast(
      nextMode === 'practitioner'
        ? 'Practitioner / Guide Clinical Suite Active'
        : 'Solo Explorer Sanctuary Active'
    );
  }

  public setOnboardingOpen(isOpen: boolean): void {
    this.state = {
      ...this.state,
      isOnboardingOpen: isOpen,
    };
    this.emit();
  }

  public selectSeed(seedId: SeedId): void {
    const preset = SEED_PRESETS[seedId];
    if (!preset) return;

    const emdrActive =
      this.state.mode === 'practitioner' && this.state.practitioner.emdrBilateralEnabled;

    this.state = {
      ...this.state,
      activeSeedId: seedId,
      modalRootOverride: null,
      modalRootDegree: null,
      macros: {
        ...preset.defaultMacros,
        serendipity: emdrActive ? 0.0 : preset.defaultMacros.serendipity,
      },
      satellites: createSatellitesForPreset(preset),
    };
    this.showToast(`Seed Loaded: ${preset.name} (${preset.subtitle})`);
    this.emit();
  }

  public setMacro<K extends keyof MacroParams>(key: K, value: number): void {
    let clamped = Math.max(0, Math.min(1, value));
    // Clinical Safety Guard: Clamp serendipity to 0.0 when Bilateral EMDR mode is active
    if (
      key === 'serendipity' &&
      this.state.mode === 'practitioner' &&
      this.state.practitioner.emdrBilateralEnabled
    ) {
      clamped = 0.0;
    }
    this.state = {
      ...this.state,
      macros: {
        ...this.state.macros,
        [key]: clamped,
      },
    };
    this.emit();
  }

  public setCoreOffset(x: number, y: number): void {
    this.state = {
      ...this.state,
      coreOffset: {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      },
    };
    this.emit();
  }

  public spawnSatellite(semiMajorAxis: number, angle: number): SatelliteNode | null {
    if (this.state.satellites.length >= MAX_SATELLITES) {
      this.showToast(`Constellation full (${MAX_SATELLITES} Harmonic Satellites max)`);
      return null;
    }

    const clampedRadius = Math.max(0.14, Math.min(0.94, semiMajorAxis));
    const zone = this.getActiveHarmonicZone();
    const scaleDegree =
      Math.floor(((angle + Math.PI) / (Math.PI * 2)) * zone.pitchClasses.length * 2) %
      zone.pitchClasses.length;

    const newSatellite: SatelliteNode = {
      id: `sat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      semiMajorAxis: clampedRadius,
      eccentricity: 0.06 + (this.state.satellites.length % 5) * 0.03,
      angle,
      argumentOfPeriapsis: angle + 0.5,
      octave: radiusToOctave(clampedRadius),
      scaleDegree: Math.abs(scaleDegree),
      lastTriggeredAt: performance.now(),
      lastTriggerSilenced: false,
    };

    this.state = {
      ...this.state,
      satellites: [...this.state.satellites, newSatellite],
    };
    this.emit();
    return newSatellite;
  }

  public updateSatelliteOrbit(
    satelliteId: string,
    semiMajorAxis: number,
    angle?: number
  ): void {
    const clampedRadius = Math.max(0.14, Math.min(0.94, semiMajorAxis));
    const nextOctave = radiusToOctave(clampedRadius);

    this.state = {
      ...this.state,
      satellites: this.state.satellites.map((sat) =>
        sat.id === satelliteId
          ? {
              ...sat,
              semiMajorAxis: clampedRadius,
              octave: nextOctave,
              angle: angle !== undefined ? angle : sat.angle,
            }
          : sat
      ),
    };
    this.emit();
  }

  public removeSatellite(satelliteId: string): void {
    const beforeCount = this.state.satellites.length;
    const filtered = this.state.satellites.filter((sat) => sat.id !== satelliteId);
    if (filtered.length !== beforeCount) {
      this.state = {
        ...this.state,
        satellites: filtered,
      };
      this.emit();
    }
  }

  public emitSatelliteTrigger(satellite: SatelliteNode): SatelliteTriggerPayload {
    const preset = this.getActivePreset();
    const { note, frequency, harmonicZone } = resolveSatellitePitch(
      satellite,
      this.state.activeSeedId,
      this.state.macros.luminance
    );

    const silencedByRarity =
      this.state.macros.rarity > 0.01 && Math.random() < this.state.macros.rarity * 0.9;

    const velocity = Math.max(
      0.22,
      Math.min(
        0.9,
        (1.0 - satellite.semiMajorAxis * 0.42) * (0.68 + this.state.macros.luminance * 0.32)
      )
    );
    const pan = Math.max(
      -0.95,
      Math.min(0.95, this.state.coreOffset.x * 0.65 + Math.sin(satellite.angle) * 0.35)
    );

    satellite.lastTriggeredAt = performance.now();
    satellite.lastTriggerSilenced = silencedByRarity;

    const payload: SatelliteTriggerPayload = {
      satellite: { ...satellite },
      note,
      frequency,
      velocity,
      pan,
      timbre: preset.timbre,
      harmonicZoneLabel: harmonicZone.label,
      silencedByRarity,
      timestamp: Date.now(),
    };

    this.state.lastTriggerEvent = payload;

    window.dispatchEvent(
      new CustomEvent<SatelliteTriggerPayload>('onSatelliteTrigger', {
        detail: payload,
      })
    );

    for (const listener of this.triggerListeners) {
      listener(payload);
    }

    return payload;
  }

  public setPlaying(isPlaying: boolean): void {
    this.state = {
      ...this.state,
      isPlaying,
    };
    this.emit();
  }

  public setSleepTimer(minutes: SleepTimerDuration): void {
    this.state = {
      ...this.state,
      sleepTimerMinutes: minutes,
      sleepTimerRemainingSec: minutes > 0 ? minutes * 60 : null,
    };
    if (minutes > 0) {
      this.showToast(`Fade to Silence armed: ${minutes} minutes`);
    } else {
      this.showToast('Sleep timer disabled');
    }
    this.emit();
  }

  public tickSleepTimer(): void {
    if (this.state.sleepTimerRemainingSec === null) return;
    const nextSec = this.state.sleepTimerRemainingSec - 1;
    if (nextSec <= 0) {
      this.state = {
        ...this.state,
        isPlaying: false,
        sleepTimerMinutes: 0,
        sleepTimerRemainingSec: null,
      };
      this.showToast('Sanctuary faded to silence');
      this.emit();
    } else {
      this.state = {
        ...this.state,
        sleepTimerRemainingSec: nextSec,
      };
      this.emit();
    }
  }

  public updatePractitionerConfig(partial: Partial<PractitionerConfig>): void {
    const nextPractitioner = {
      ...this.state.practitioner,
      ...partial,
    };

    // Clinical Safety Guard: Clamp serendipity to 0.0 when Bilateral EMDR mode is active
    const nextMacros =
      this.state.mode === 'practitioner' && nextPractitioner.emdrBilateralEnabled
        ? { ...this.state.macros, serendipity: 0.0 }
        : this.state.macros;

    this.state = {
      ...this.state,
      macros: nextMacros,
      modalRootOverride:
        this.state.mode === 'practitioner' && nextPractitioner.emdrBilateralEnabled
          ? null
          : this.state.modalRootOverride,
      modalRootDegree:
        this.state.mode === 'practitioner' && nextPractitioner.emdrBilateralEnabled
          ? null
          : this.state.modalRootDegree,
      practitioner: nextPractitioner,
    };
    this.emit();
  }

  public applyIsoArcAtElapsed(elapsedSec: number, keepRunning?: boolean): void {
    const totalSec = this.state.practitioner.isoDurationMinutes * 60;
    const clampedElapsed = Math.max(0, Math.min(totalSec, elapsedSec));
    const progress01 = totalSec > 0 ? clampedElapsed / totalSec : 0;

    const { phase, vector } = evaluateIsoSessionArc(
      progress01,
      this.state.practitioner.isoStartState,
      this.state.practitioner.isoTargetState
    );

    const reachedEnd = clampedElapsed >= totalSec;
    const emdrClamped =
      this.state.mode === 'practitioner' && this.state.practitioner.emdrBilateralEnabled;

    this.state = {
      ...this.state,
      macros: {
        luminance: Number(vector.luminance.toFixed(3)),
        fog: Number(vector.fog.toFixed(3)),
        viscosity: Number(vector.viscosity.toFixed(3)),
        nostalgia: Number(vector.nostalgia.toFixed(3)),
        rarity: Number(vector.rarity.toFixed(3)),
        serendipity: emdrClamped ? 0.0 : Number(vector.serendipity.toFixed(3)),
      },
      practitioner: {
        ...this.state.practitioner,
        isoElapsedSec: clampedElapsed,
        isoActivePhase: phase,
        isoOrbitalSpeedMultiplier: vector.orbitalSpeedMultiplier,
        isoArcRunning:
          keepRunning !== undefined
            ? keepRunning && !reachedEnd
            : this.state.practitioner.isoArcRunning && !reachedEnd,
      },
    };

    if (reachedEnd && this.state.practitioner.isoArcRunning) {
      this.showToast('ISO-Principle Session Arc Complete · Patient Re-Oriented');
    }

    this.emit();
  }

  public tickIsoSessionArc(deltaSec = 1): void {
    if (!this.state.practitioner.isoArcRunning) return;
    this.applyIsoArcAtElapsed(this.state.practitioner.isoElapsedSec + deltaSec);
  }

  public saveLocalPreset(customName?: string): SavedPresetRecord {
    const preset = this.getActivePreset();
    const label =
      customName && customName.trim().length > 0
        ? customName.trim()
        : `${preset.name} · ${this.state.mode === 'practitioner' ? 'Clinical' : 'Sanctuary'}`;
    const payloadJson = this.serializeConstellation(label);
    const record: SavedPresetRecord = {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: label,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      payloadJson,
    };

    const nextList = [record, ...this.state.savedPresets].slice(0, 12);
    this.persistSavedPresets(nextList);
    this.state = {
      ...this.state,
      savedPresets: nextList,
    };
    this.showToast(`Saved session preset: "${label}"`);
    this.emit();
    return record;
  }

  public deleteLocalPreset(id: string): void {
    const nextList = this.state.savedPresets.filter((item) => item.id !== id);
    this.persistSavedPresets(nextList);
    this.state = {
      ...this.state,
      savedPresets: nextList,
    };
    this.emit();
  }

  public showToast(message: string, durationMs = 2800): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }
    this.state = {
      ...this.state,
      statusToast: message,
    };
    this.emit();
    this.toastTimer = window.setTimeout(() => {
      this.state = {
        ...this.state,
        statusToast: null,
      };
      this.toastTimer = null;
      this.emit();
    }, durationMs);
  }

  public serializeConstellation(name = 'Aetherium Session Constellation'): string {
    const p = this.state.practitioner;
    const payload = {
      version: '0.4.0',
      name,
      saved_at: new Date().toISOString(),
      mode: this.state.mode,
      active_seed_id: this.state.activeSeedId,
      macro_params: {
        luminance: this.state.macros.luminance,
        fog: this.state.macros.fog,
        viscosity: this.state.macros.viscosity,
        nostalgia: this.state.macros.nostalgia,
        rarity: this.state.macros.rarity,
        serendipity: this.state.macros.serendipity,
      },
      core_offset: {
        x: this.state.coreOffset.x,
        y: this.state.coreOffset.y,
      },
      practitioner_config: {
        vocal_carving_enabled: p.vocalCarvingEnabled,
        vocal_carving_depth_db: p.vocalCarvingDepthDb,
        iso_duration_minutes: p.isoDurationMinutes,
        iso_start_state: p.isoStartState,
        iso_target_state: p.isoTargetState,
        emdr_bilateral_enabled: p.emdrBilateralEnabled,
        emdr_rate_hz: p.emdrRateHz,
        emdr_stereo_width: p.emdrStereoWidth,
        somatic_sub_bass_level: p.somaticSubBassLevel,
        binaural_theta_enabled: p.binauralThetaEnabled,
      },
      satellites: this.state.satellites.map((s) => ({
        id: s.id,
        semi_major_axis: s.semiMajorAxis,
        eccentricity: s.eccentricity,
        angle: s.angle,
        argument_of_periapsis: s.argumentOfPeriapsis,
        octave: s.octave,
        scale_degree: s.scaleDegree,
      })),
    };
    return JSON.stringify(payload, null, 2);
  }

  public loadConstellationFromJson(rawJson: string): boolean {
    try {
      const parsed = JSON.parse(rawJson);
      const seedId: SeedId =
        parsed.active_seed_id && SEED_PRESETS[parsed.active_seed_id as SeedId]
          ? (parsed.active_seed_id as SeedId)
          : this.state.activeSeedId;

      const macros: MacroParams = {
        luminance: Number(parsed.macro_params?.luminance ?? 0.4),
        fog: Number(parsed.macro_params?.fog ?? 0.5),
        viscosity: Number(parsed.macro_params?.viscosity ?? 0.5),
        nostalgia: Number(parsed.macro_params?.nostalgia ?? 0.4),
        rarity: Number(parsed.macro_params?.rarity ?? 0.2),
        serendipity: Number(parsed.macro_params?.serendipity ?? 0.25),
      };

      const satellites: SatelliteNode[] = Array.isArray(parsed.satellites)
        ? parsed.satellites.slice(0, MAX_SATELLITES).map((s: Record<string, unknown>, idx: number) => {
            const semiMajorAxis = Math.max(0.14, Math.min(0.94, Number(s.semi_major_axis ?? 0.45)));
            return {
              id: String(s.id ?? `sat-loaded-${idx}-${Date.now()}`),
              semiMajorAxis,
              eccentricity: Math.max(0.02, Math.min(0.3, Number(s.eccentricity ?? 0.1))),
              angle: Number(s.angle ?? 0),
              argumentOfPeriapsis: Number(s.argument_of_periapsis ?? 0),
              octave: radiusToOctave(semiMajorAxis),
              scaleDegree: Math.max(0, Number(s.scale_degree ?? idx)),
              lastTriggeredAt: 0,
              lastTriggerSilenced: false,
            };
          })
        : createSatellitesForPreset(SEED_PRESETS[seedId]);

      const pc = parsed.practitioner_config;
      const updatedPractitioner: PractitionerConfig = pc
        ? {
            ...this.state.practitioner,
            vocalCarvingEnabled: Boolean(
              pc.vocal_carving_enabled ?? this.state.practitioner.vocalCarvingEnabled
            ),
            vocalCarvingDepthDb: Math.max(
              -12,
              Math.min(0, Number(pc.vocal_carving_depth_db ?? -8.5))
            ),
            isoDurationMinutes: ([20, 45, 50, 60].includes(Number(pc.iso_duration_minutes))
              ? Number(pc.iso_duration_minutes)
              : 50) as IsoDurationMinutes,
            isoStartState: (pc.iso_start_state in ISO_START_STATES
              ? pc.iso_start_state
              : 'high-agitation') as IsoStartStateId,
            isoTargetState: (pc.iso_target_state in ISO_TARGET_STATES
              ? pc.iso_target_state
              : 'parasympathetic-rest') as IsoTargetStateId,
            emdrBilateralEnabled: Boolean(
              pc.emdr_bilateral_enabled ?? this.state.practitioner.emdrBilateralEnabled
            ),
            emdrRateHz: Math.max(0.2, Math.min(1.5, Number(pc.emdr_rate_hz ?? 0.45))),
            emdrStereoWidth: Math.max(0, Math.min(1, Number(pc.emdr_stereo_width ?? 0.85))),
            somaticSubBassLevel: Math.max(
              0,
              Math.min(1, Number(pc.somatic_sub_bass_level ?? 0.35))
            ),
            binauralThetaEnabled: Boolean(
              pc.binaural_theta_enabled ?? this.state.practitioner.binauralThetaEnabled
            ),
          }
        : this.state.practitioner;

      this.state = {
        ...this.state,
        activeSeedId: seedId,
        macros,
        practitioner: updatedPractitioner,
        coreOffset: {
          x: Math.max(-1, Math.min(1, Number(parsed.core_offset?.x ?? 0))),
          y: Math.max(-1, Math.min(1, Number(parsed.core_offset?.y ?? 0))),
        },
        satellites,
      };
      this.showToast(`Session Constellation restored (${satellites.length} satellites)`);
      this.emit();
      return true;
    } catch {
      this.showToast('Unable to parse Constellation JSON file');
      return false;
    }
  }
}

export const store = new AetheriumStore();
