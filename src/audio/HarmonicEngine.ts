import { Note, Scale } from 'tonal';
import { SeedId } from '../state/store';

export type HarmonicZoneId =
  | 'shadow-aeolian'
  | 'wistful-dorian'
  | 'floating-maj9'
  | 'cosmic-lydian';

export type SatelliteTimbreKind = 'felt-piano' | 'glassy-pad';

export interface HarmonicZoneInfo {
  id: HarmonicZoneId;
  label: string;
  modeName: string;
  rootNote: string;
  pitchClasses: string[];
  droneVoicing: string[];
  subFundamental: string;
  timbrePreference: SatelliteTimbreKind;
}

export interface QuantizedSatellitePitch {
  note: string;
  frequency: number;
  octave: number;
  registerLabel: 'Inner (High)' | 'Middle (Warm Mid)' | 'Outer (Deep Bass)';
  harmonicZone: HarmonicZoneInfo;
}

const SEED_ROOT_MAP: Record<SeedId, { darkRoot: string; brightRoot: string; primaryTimbre: SatelliteTimbreKind }> = {
  'rain-on-felt': {
    darkRoot: 'D',
    brightRoot: 'D',
    primaryTimbre: 'felt-piano',
  },
  'deep-drift': {
    darkRoot: 'C',
    brightRoot: 'F',
    primaryTimbre: 'glassy-pad',
  },
  'subterranean': {
    darkRoot: 'C',
    brightRoot: 'D',
    primaryTimbre: 'felt-piano',
  },
  'solar-wind': {
    darkRoot: 'D',
    brightRoot: 'G',
    primaryTimbre: 'glassy-pad',
  },
};

/**
 * Pure mathematical & music-theoretical quantization engine powered by Tonal.
 * Guarantees consonant, emotionally coherent pitch selection across all 4 Luminance zones
 * and maps orbital radius to psychoacoustic octave registers.
 */
export class HarmonicEngine {
  /**
   * Resolves the active harmonic scale, modal color extensions, and drone chord voicing
   * based on the active Seed and the continuous Luminance macro parameter (0.0 to 1.0).
   *
   * - 0.00 - 0.25 (Deep Shadow / Melancholic): Aeolian / Phrygian in D or C
   * - 0.25 - 0.50 (Intimate / Wistful): Dorian Mode with min7 and add9 intervals
   * - 0.50 - 0.75 (Floating / Contemplative): Major Pentatonic / Maj9 voicings
   * - 0.75 - 1.00 (Cosmic / Space-Ambient): Lydian Mode (raised #4th)
   */
  public static resolveHarmonicZone(seedId: SeedId, luminance: number): HarmonicZoneInfo {
    const clampedLum = Math.max(0, Math.min(1, luminance));
    const seedRoots = SEED_ROOT_MAP[seedId] ?? SEED_ROOT_MAP['rain-on-felt'];

    if (clampedLum < 0.25) {
      const root = seedRoots.darkRoot; // C or D
      const isPhrygian = seedId === 'subterranean' && clampedLum < 0.12;
      const scaleType = isPhrygian ? 'phrygian' : 'aeolian';
      const scaleData = Scale.get(`${root} ${scaleType}`);
      const notes =
        scaleData.notes.length > 0
          ? scaleData.notes
          : root === 'C'
            ? ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']
            : ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'];

      return {
        id: 'shadow-aeolian',
        label: isPhrygian ? `${root} Phrygian · Deep Shadow` : `${root} Aeolian · Melancholic Shadow`,
        modeName: isPhrygian ? 'phrygian' : 'aeolian',
        rootNote: root,
        pitchClasses: notes,
        droneVoicing: [`${root}2`, `${notes[4] ?? 'G'}2`, `${notes[2] ?? 'F'}3`, `${notes[6] ?? 'C'}3`],
        subFundamental: `${root}1`,
        timbrePreference: seedRoots.primaryTimbre,
      };
    }

    if (clampedLum < 0.50) {
      const root = seedRoots.darkRoot; // D or C
      const scaleData = Scale.get(`${root} dorian`);
      const baseNotes =
        scaleData.notes.length > 0
          ? scaleData.notes
          : ['D', 'E', 'F', 'G', 'A', 'B', 'C'];

      // Emphasize Dorian min7 + add9 intervals by ordering consonant color degrees first
      const pitchClasses = [
        baseNotes[0], // 1 (Root)
        baseNotes[1], // 9 (add9)
        baseNotes[2], // b3 (Minor 3rd)
        baseNotes[4], // 5 (Perfect 5th)
        baseNotes[5], // 6 (Natural Dorian 6th)
        baseNotes[6], // b7 (min7)
        baseNotes[3], // 4 (Perfect 4th)
      ].filter(Boolean);

      return {
        id: 'wistful-dorian',
        label: `${root} Dorian (min7/add9) · Intimate & Wistful`,
        modeName: 'dorian',
        rootNote: root,
        pitchClasses,
        droneVoicing: [
          `${baseNotes[0]}2`,
          `${baseNotes[4]}2`,
          `${baseNotes[6]}3`,
          `${baseNotes[1]}4`,
        ],
        subFundamental: `${root}1`,
        timbrePreference: seedRoots.primaryTimbre,
      };
    }

    if (clampedLum < 0.75) {
      const root = seedRoots.brightRoot;
      const majorScale = Scale.get(`${root} major`).notes;
      const fallback = ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'];
      const deg = majorScale.length >= 7 ? majorScale : fallback;

      // Major Pentatonic + Maj7 / Maj9 voicing (1, 2/9, 3, 5, 6, 7)
      const pitchClasses = [deg[0], deg[1], deg[2], deg[4], deg[5], deg[6]];

      return {
        id: 'floating-maj9',
        label: `${root} Maj9 Pentatonic · Floating & Contemplative`,
        modeName: 'maj9 pentatonic',
        rootNote: root,
        pitchClasses,
        droneVoicing: [`${deg[0]}2`, `${deg[4]}2`, `${deg[6]}3`, `${deg[1]}4`],
        subFundamental: `${root}1`,
        timbrePreference: seedRoots.primaryTimbre,
      };
    }

    // 0.75 - 1.00: Cosmic / Space-Ambient — Lydian Mode (raised #4th)
    const root = seedRoots.brightRoot;
    const lydianData = Scale.get(`${root} lydian`);
    const notes =
      lydianData.notes.length >= 7
        ? lydianData.notes
        : ['F', 'G', 'A', 'B', 'C', 'D', 'E'];

    // Prioritize Root, 5th, #4 (Lydian characteristic interval), Maj7, 9th, 3rd
    const pitchClasses = [
      notes[0], // 1
      notes[4], // 5
      notes[3], // #4 (Lydian raised 4th)
      notes[6], // Maj7
      notes[1], // 9
      notes[2], // 3
      notes[5], // 6
    ];

    return {
      id: 'cosmic-lydian',
      label: `${root} Lydian (#11) · Cosmic & Expansive`,
      modeName: 'lydian',
      rootNote: root,
      pitchClasses,
      droneVoicing: [`${notes[0]}2`, `${notes[4]}2`, `${notes[6]}3`, `${notes[3]}4`],
      subFundamental: `${root}1`,
      timbrePreference: 'glassy-pad',
    };
  }

  /**
   * Maps normalized orbital semi-major axis (0.14 to 0.94) to musical octave register:
   * - Inner orbits (0.14 - 0.38): Higher notes (Octaves 4-5)
   * - Middle orbits (0.38 - 0.68): Warm midrange (Octaves 3-4)
   * - Outer orbits (0.68 - 0.94): Deep bass / cello register (Octaves 2-3)
   */
  public static mapRadiusToOctave(semiMajorAxis: number): {
    octave: number;
    registerLabel: 'Inner (High)' | 'Middle (Warm Mid)' | 'Outer (Deep Bass)';
  } {
    const r = Math.max(0.14, Math.min(0.94, semiMajorAxis));

    if (r < 0.38) {
      const octave = r < 0.25 ? 5 : 4;
      return { octave, registerLabel: 'Inner (High)' };
    }
    if (r < 0.68) {
      const octave = r < 0.52 ? 4 : 3;
      return { octave, registerLabel: 'Middle (Warm Mid)' };
    }
    const octave = r < 0.82 ? 3 : 2;
    return { octave, registerLabel: 'Outer (Deep Bass)' };
  }

  /**
   * Quantizes a satellite's orbital position & degree into a consonant note and Hz frequency.
   */
  public static quantizeSatellitePitch(
    semiMajorAxis: number,
    scaleDegree: number,
    seedId: SeedId,
    luminance: number
  ): QuantizedSatellitePitch {
    const harmonicZone = this.resolveHarmonicZone(seedId, luminance);
    const { octave, registerLabel } = this.mapRadiusToOctave(semiMajorAxis);
    const pitchClasses = harmonicZone.pitchClasses;
    const safeDegree = Math.abs(Math.floor(scaleDegree)) % pitchClasses.length;
    const pitchClass = pitchClasses[safeDegree] ?? harmonicZone.rootNote;

    const simplifiedPitch = Note.simplify(pitchClass) || pitchClass;
    const noteName = `${simplifiedPitch}${octave}`;
    const rawFreq = Note.freq(noteName) ?? 220;

    return {
      note: noteName,
      frequency: rawFreq,
      octave,
      registerLabel,
      harmonicZone,
    };
  }
}
