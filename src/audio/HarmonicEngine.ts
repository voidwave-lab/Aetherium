/**
 * Aetherium — Generative Ambient Soundscape & Receptive Music Therapy Sanctuary
 * Copyright (C) 2026 Voidwave Lab
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Note, Scale } from 'tonal';
import { SeedId } from '../state/store';

export type HarmonicZoneId =
  | 'shadow-aeolian'
  | 'wistful-dorian'
  | 'floating-maj9'
  | 'cosmic-lydian';

export type SatelliteTimbreKind =
  | 'felt-piano'
  | 'glassy-pad'
  | 'rhodes-lofi'
  | 'singing-bowls'
  | 'cathedral-choir'
  | 'bowed-strings';

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

const SEED_ROOT_MAP: Record<
  SeedId,
  { darkRoot: string; brightRoot: string; primaryTimbre: SatelliteTimbreKind }
> = {
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
  'midnight-vinyl': {
    darkRoot: 'D',
    brightRoot: 'F',
    primaryTimbre: 'rhodes-lofi',
  },
  'singing-bowls': {
    darkRoot: 'C',
    brightRoot: 'F',
    primaryTimbre: 'singing-bowls',
  },
  'cathedral-choir': {
    darkRoot: 'D',
    brightRoot: 'G',
    primaryTimbre: 'cathedral-choir',
  },
  'bowed-glass-strings': {
    darkRoot: 'C',
    brightRoot: 'D',
    primaryTimbre: 'bowed-strings',
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
   * Supports an optional temporary modal root override (e.g. Subdominant IV or Submediant VI
   * triggered by the Serendipity "Modal Breeze" engine).
   *
   * - 0.00 - 0.25 (Deep Shadow / Melancholic): Aeolian / Phrygian in D or C
   * - 0.25 - 0.50 (Intimate / Wistful): Dorian Mode with min7 and add9 intervals
   * - 0.50 - 0.75 (Floating / Contemplative): Major Pentatonic / Maj9 voicings
   * - 0.75 - 1.00 (Cosmic / Space-Ambient): Lydian Mode (raised #4th)
   */
  public static resolveHarmonicZone(
    seedId: SeedId,
    luminance: number,
    rootOverride?: string | null
  ): HarmonicZoneInfo {
    const clampedLum = Math.max(0, Math.min(1, luminance));
    const seedRoots = SEED_ROOT_MAP[seedId] ?? SEED_ROOT_MAP['rain-on-felt'];

    if (clampedLum < 0.25) {
      const root = rootOverride || seedRoots.darkRoot;
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
      const root = rootOverride || seedRoots.darkRoot;
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
      const root = rootOverride || seedRoots.brightRoot;
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
    const root = rootOverride || seedRoots.brightRoot;
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
      timbrePreference: seedRoots.primaryTimbre,
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
    luminance: number,
    rootOverride?: string | null
  ): QuantizedSatellitePitch {
    const harmonicZone = this.resolveHarmonicZone(seedId, luminance, rootOverride);
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

  /**
   * Generates a 3-to-5 note "Rubato Arpeggio" from the active harmonic zone,
   * favoring warm extended intervals (Root, 5th, 7th, 9th, and 11th) in Octaves 4-5.
   */
  public static buildRubatoArpeggioNotes(
    seedId: SeedId,
    luminance: number,
    noteCount: number,
    rootOverride?: string | null
  ): string[] {
    const zone = this.resolveHarmonicZone(seedId, luminance, rootOverride);
    const baseScaleName =
      zone.id === 'shadow-aeolian'
        ? `${zone.rootNote} ${zone.modeName}`
        : zone.id === 'wistful-dorian'
          ? `${zone.rootNote} dorian`
          : zone.id === 'floating-maj9'
            ? `${zone.rootNote} major`
            : `${zone.rootNote} lydian`;

    const diatonic = Scale.get(baseScaleName).notes;
    const fallback = zone.pitchClasses;
    const deg = diatonic.length >= 7 ? diatonic : fallback;

    const root = Note.simplify(deg[0] ?? zone.rootNote) || zone.rootNote;
    const ninth = Note.simplify(deg[1] ?? deg[0] ?? 'E') || 'E';
    const eleventh = Note.simplify(deg[3] ?? deg[2] ?? 'G') || 'G';
    const fifth = Note.simplify(deg[4] ?? deg[1] ?? 'A') || 'A';
    const seventh = Note.simplify(deg[6] ?? deg[5] ?? 'C') || 'C';

    // Warm extended voicing pool in Octaves 4 and 5: Root4, Fifth4, Seventh4, Ninth5, Eleventh5, Fifth5
    const warmVoicingPool = [
      `${root}4`,
      `${fifth}4`,
      `${seventh}4`,
      `${ninth}5`,
      `${eleventh}5`,
      `${root}5`,
      `${fifth}5`,
    ];

    const clampedCount = Math.max(3, Math.min(5, Math.round(noteCount)));
    // Choose a gentle ascending, arch, or cascading contour
    const contourRoll = Math.random();
    const startIdx = Math.random() < 0.65 ? 0 : 1;
    const selected = warmVoicingPool.slice(startIdx, startIdx + clampedCount);

    if (contourRoll < 0.55) {
      // Ascending warm harp/felt arpeggio
      return selected;
    } else if (contourRoll < 0.82 && selected.length >= 4) {
      // Gentle arch contour (e.g. Root4 -> Fifth4 -> Ninth5 -> Seventh4)
      const copy = [...selected];
      const last = copy.pop()!;
      const secondLast = copy.pop()!;
      copy.push(last, secondLast);
      return copy;
    } else {
      // Descending starlight cascade
      return [...selected].reverse();
    }
  }

  /**
   * Resolves the Subdominant (IV) or Submediant (VI) modal root pitch class
   * for the Serendipity "Modal Breeze / Root Shift" event.
   */
  public static resolveModalBreezeRoot(
    seedId: SeedId,
    luminance: number
  ): { degree: 'IV' | 'VI'; shiftedRoot: string; homeRoot: string } {
    const homeZone = this.resolveHarmonicZone(seedId, luminance, null);
    const scaleQuery =
      homeZone.id === 'shadow-aeolian'
        ? `${homeZone.rootNote} ${homeZone.modeName}`
        : homeZone.id === 'wistful-dorian'
          ? `${homeZone.rootNote} dorian`
          : homeZone.id === 'floating-maj9'
            ? `${homeZone.rootNote} major`
            : `${homeZone.rootNote} lydian`;

    const diatonic = Scale.get(scaleQuery).notes;
    const degree: 'IV' | 'VI' = Math.random() < 0.55 ? 'IV' : 'VI';
    const rawTarget =
      degree === 'IV'
        ? diatonic[3] ?? homeZone.pitchClasses[3] ?? 'G'
        : diatonic[5] ?? homeZone.pitchClasses[4] ?? 'A';

    const shiftedRoot = Note.simplify(rawTarget) || rawTarget;
    return {
      degree,
      shiftedRoot,
      homeRoot: homeZone.rootNote,
    };
  }

  /**
   * Resolves a crystalline Octave-5 harmonic dyad (5th or 3rd interval)
   * for the Serendipity "High-Octave Shimmer / Ghost Echo" event.
   */
  public static resolveGhostEchoDyad(
    seedId: SeedId,
    luminance: number,
    rootOverride?: string | null
  ): { notes: [string, string]; intervalLabel: '5th' | '3rd' } {
    const zone = this.resolveHarmonicZone(seedId, luminance, rootOverride);
    const scaleQuery =
      zone.id === 'shadow-aeolian'
        ? `${zone.rootNote} ${zone.modeName}`
        : zone.id === 'wistful-dorian'
          ? `${zone.rootNote} dorian`
          : zone.id === 'floating-maj9'
            ? `${zone.rootNote} major`
            : `${zone.rootNote} lydian`;

    const diatonic = Scale.get(scaleQuery).notes;
    const rootPitch = Note.simplify(diatonic[0] ?? zone.rootNote) || zone.rootNote;
    const useFifth = Math.random() < 0.6;
    const partnerRaw = useFifth
      ? diatonic[4] ?? zone.pitchClasses[1] ?? 'A'
      : diatonic[2] ?? zone.pitchClasses[2] ?? 'F';
    const partnerPitch = Note.simplify(partnerRaw) || partnerRaw;

    return {
      notes: [`${rootPitch}5`, `${partnerPitch}5`],
      intervalLabel: useFifth ? '5th' : '3rd',
    };
  }
}
