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

import { HarmonicEngine } from './HarmonicEngine';
import { SerendipityEventPayload, store } from '../state/store';

export interface SerendipityAudioCallbacks {
  onRubatoArpeggioNote: (
    note: string,
    durationSec: number,
    velocity: number,
    pan: number,
    stepIndex: number,
    totalSteps: number
  ) => void;
  onModalBreezeShift: (
    shiftedRoot: string | null,
    degree: 'IV' | 'VI' | null,
    homeRoot: string
  ) => void;
  onGhostEchoShimmer: (
    notes: [string, string],
    durationSec: number,
    velocity: number
  ) => void;
}

/**
 * Constrained Generative Randomness & Stochastic Musical Spark Scheduler ("Serendipity").
 *
 * Prevents auditory habituation while preserving a meditative, non-startling sanctuary:
 * - Evaluates at slow, irregular intervals (8s to 25s, scaled inversely by `serendipity`).
 * - Automatically suspends when `serendipity <= 0.01` or when Bilateral EMDR mode is active.
 * - Selects from 3 weighted musical events:
 *   1. Event A (60%): "Rubato Arpeggio" — 3 to 5 notes (Root, 5th, 7th, 9th, 11th in Oct 4-5)
 *      with humanized, decelerating rubato timing (350ms to 900ms between notes).
 *   2. Event B (20%): "Modal Breeze / Root Shift" — Shifts Core Drone & quantization root to
 *      Subdominant (IV) or Submediant (VI) for 16-24 seconds, then glides back to Home (I).
 *   3. Event C (20%): "High-Octave Shimmer / Ghost Echo" — Crystalline Octave-5 harmonic dyad
 *      (5th or 3rd) routed 100% through the wet Reverb shimmer bus.
 */
export class SerendipityEngine {
  private callbacks: SerendipityAudioCallbacks;
  private schedulerTimeoutId: number | null = null;
  private modalReturnTimeoutId: number | null = null;
  private arpeggioStepTimeouts: number[] = [];
  private isRunning = false;
  private lastKnownSerendipity = 0;

  constructor(callbacks: SerendipityAudioCallbacks) {
    this.callbacks = callbacks;

    store.subscribe((state) => {
      const effective = store.getEffectiveSerendipity();

      // If Bilateral EMDR is engaged in Practitioner mode, immediately clear any active Modal Breeze
      // and cancel pending arpeggio steps to protect bilateral focus.
      if (state.mode === 'practitioner' && state.practitioner.emdrBilateralEnabled) {
        this.clearPendingArpeggioSteps();
        this.restoreHomeModalRoot();
      }

      if (state.isPlaying && !this.isRunning) {
        this.start();
      } else if (!state.isPlaying && this.isRunning) {
        this.stop();
      } else if (
        this.isRunning &&
        Math.abs(effective - this.lastKnownSerendipity) > 0.18
      ) {
        // Reschedule timer when user adjusts the Serendipity slider significantly
        this.lastKnownSerendipity = effective;
        this.scheduleNextEvaluation();
      }
    });
  }

  public start(): void {
    this.isRunning = true;
    this.lastKnownSerendipity = store.getEffectiveSerendipity();
    this.scheduleNextEvaluation();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.schedulerTimeoutId !== null) {
      window.clearTimeout(this.schedulerTimeoutId);
      this.schedulerTimeoutId = null;
    }
    this.clearPendingArpeggioSteps();
    this.restoreHomeModalRoot();
  }

  private clearPendingArpeggioSteps(): void {
    for (const id of this.arpeggioStepTimeouts) {
      window.clearTimeout(id);
    }
    this.arpeggioStepTimeouts = [];
  }

  private restoreHomeModalRoot(): void {
    if (this.modalReturnTimeoutId !== null) {
      window.clearTimeout(this.modalReturnTimeoutId);
      this.modalReturnTimeoutId = null;
    }
    const state = store.getState();
    if (state.modalRootOverride !== null) {
      const homeZone = HarmonicEngine.resolveHarmonicZone(
        state.activeSeedId,
        state.macros.luminance,
        null
      );
      store.setModalRootOverride(null, null);
      this.callbacks.onModalBreezeShift(null, null, homeZone.rootNote);
    }
  }

  /**
   * Computes the next irregular evaluation delay (8s to 25s, scaled inversely by `serendipity`).
   */
  private computeNextDelayMs(effectiveSerendipity: number): number {
    const s = Math.max(0, Math.min(1, effectiveSerendipity));
    // At s -> 0.02: window is ~18.8s to 25.0s
    // At s -> 1.00: window is 8.0s to 12.0s
    const minSec = 8.0 + (1.0 - s) * 11.0;
    const maxSec = 12.0 + (1.0 - s) * 13.0;
    const randomSec = minSec + Math.random() * (maxSec - minSec);
    return Math.round(randomSec * 1000);
  }

  private scheduleNextEvaluation(): void {
    if (this.schedulerTimeoutId !== null) {
      window.clearTimeout(this.schedulerTimeoutId);
      this.schedulerTimeoutId = null;
    }

    if (!this.isRunning) {
      return;
    }

    const effective = store.getEffectiveSerendipity();
    this.lastKnownSerendipity = effective;

    if (effective <= 0.01) {
      // Check again gently in 6 seconds in case ISO Arc or slider raises serendipity
      this.schedulerTimeoutId = window.setTimeout(() => {
        this.scheduleNextEvaluation();
      }, 6000);
      return;
    }

    const delayMs = this.computeNextDelayMs(effective);
    this.schedulerTimeoutId = window.setTimeout(() => {
      this.evaluateAndTriggerEvent();
      this.scheduleNextEvaluation();
    }, delayMs);
  }

  /**
   * Evaluates weighted probabilities and triggers one of the 3 Serendipity musical phenomena:
   * - 60% Event A: "Rubato Arpeggio"
   * - 20% Event B: "Modal Breeze / Root Shift"
   * - 20% Event C: "High-Octave Shimmer / Ghost Echo"
   */
  public evaluateAndTriggerEvent(): void {
    const state = store.getState();
    const effective = store.getEffectiveSerendipity();
    if (!state.isPlaying || effective <= 0.01) {
      return;
    }

    const roll = Math.random();

    if (roll < 0.60) {
      this.triggerRubatoArpeggio();
    } else if (roll < 0.80) {
      // If a Modal Breeze is already active, trigger Ghost Echo or Rubato Arpeggio instead
      if (state.modalRootOverride !== null) {
        this.triggerGhostEchoShimmer();
      } else {
        this.triggerModalBreeze();
      }
    } else {
      this.triggerGhostEchoShimmer();
    }
  }

  /**
   * Event A (60% weight): "Rubato Arpeggio"
   * Picks 3 to 5 notes from the current scale (Root, 5th, 7th, 9th, 11th in Octaves 4-5)
   * and plays them sequentially with humanized, decelerating rubato timing (350ms to 900ms).
   */
  private triggerRubatoArpeggio(): void {
    const state = store.getState();
    const noteCount = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 notes
    const notes = HarmonicEngine.buildRubatoArpeggioNotes(
      state.activeSeedId,
      state.macros.luminance,
      noteCount,
      state.modalRootOverride
    );

    this.clearPendingArpeggioSteps();

    const stepOffsetsMs: number[] = [0];
    let cumulativeMs = 0;

    for (let i = 1; i < notes.length; i++) {
      // Progressive rubato deceleration: 350ms on early steps slowing toward 750-900ms at the end
      const progress = i / Math.max(1, notes.length - 1);
      const baseGapMs = 350 + Math.pow(progress, 1.45) * 430;
      const humanJitterMs = Math.random() * 115;
      const stepGapMs = Math.min(900, Math.max(350, Math.round(baseGapMs + humanJitterMs)));
      cumulativeMs += stepGapMs;
      stepOffsetsMs.push(cumulativeMs);
    }

    const totalDurationMs = cumulativeMs + 2600;
    const basePan = (Math.random() - 0.5) * 0.65;

    notes.forEach((note, idx) => {
      const offsetMs = stepOffsetsMs[idx];
      const timeoutId = window.setTimeout(() => {
        const currState = store.getState();
        if (!currState.isPlaying || store.getEffectiveSerendipity() <= 0.005) {
          return;
        }
        // Soft, non-startling velocity (0.18 to 0.30) tapering gently on the final note
        const taper = 1.0 - (idx / notes.length) * 0.22;
        const velocity = (0.22 + Math.random() * 0.07) * taper;
        const notePan = Math.max(
          -0.8,
          Math.min(0.8, basePan + (idx - (notes.length - 1) * 0.5) * 0.14)
        );
        const durationSec = 2.0 + currState.macros.viscosity * 2.2;

        this.callbacks.onRubatoArpeggioNote(
          note,
          durationSec,
          velocity,
          notePan,
          idx,
          notes.length
        );
      }, offsetMs);

      this.arpeggioStepTimeouts.push(timeoutId);
    });

    const payload: SerendipityEventPayload = {
      id: `seren-arp-${Date.now()}`,
      kind: 'rubato-arpeggio',
      label: `Rubato Arpeggio (${notes.join(' · ')})`,
      notes,
      stepOffsetsMs,
      durationMs: totalDurationMs,
      timestamp: performance.now(),
    };

    store.emitSerendipityEvent(payload);
  }

  /**
   * Event B (20% weight): "Modal Breeze / Root Shift"
   * Temporarily shifts the fundamental Core Drone and quantization root to the
   * Subdominant (IV) or Submediant (VI) degree for 16-24 seconds, then glides back to Home (I).
   */
  private triggerModalBreeze(): void {
    const state = store.getState();
    const { degree, shiftedRoot, homeRoot } = HarmonicEngine.resolveModalBreezeRoot(
      state.activeSeedId,
      state.macros.luminance
    );

    const holdDurationMs = Math.round(16000 + Math.random() * 8000); // 16s to 24s

    store.setModalRootOverride(shiftedRoot, degree);
    this.callbacks.onModalBreezeShift(shiftedRoot, degree, homeRoot);

    if (this.modalReturnTimeoutId !== null) {
      window.clearTimeout(this.modalReturnTimeoutId);
    }

    this.modalReturnTimeoutId = window.setTimeout(() => {
      this.modalReturnTimeoutId = null;
      const curr = store.getState();
      const restoredZone = HarmonicEngine.resolveHarmonicZone(
        curr.activeSeedId,
        curr.macros.luminance,
        null
      );
      store.setModalRootOverride(null, null);
      this.callbacks.onModalBreezeShift(null, null, restoredZone.rootNote);
    }, holdDurationMs);

    const payload: SerendipityEventPayload = {
      id: `seren-breeze-${Date.now()}`,
      kind: 'modal-breeze',
      label: `Modal Breeze · ${degree} (${shiftedRoot})`,
      notes: [shiftedRoot],
      modalDegree: degree,
      durationMs: holdDurationMs,
      timestamp: performance.now(),
    };

    store.emitSerendipityEvent(payload);
  }

  /**
   * Event C (20% weight): "High-Octave Shimmer / Ghost Echo"
   * Triggers a single, crystalline, long-decay harmonic dyad (5th or 3rd interval) in Octave 5
   * routed 100% through the wet Reverb bus.
   */
  private triggerGhostEchoShimmer(): void {
    const state = store.getState();
    const { notes, intervalLabel } = HarmonicEngine.resolveGhostEchoDyad(
      state.activeSeedId,
      state.macros.luminance,
      state.modalRootOverride
    );

    const durationSec = 5.5 + state.macros.fog * 3.5;
    const velocity = 0.24 + state.macros.luminance * 0.1;

    this.callbacks.onGhostEchoShimmer(notes, durationSec, velocity);

    const payload: SerendipityEventPayload = {
      id: `seren-shimmer-${Date.now()}`,
      kind: 'ghost-echo',
      label: `Ghost Echo · Octave 5 ${intervalLabel} (${notes.join(' + ')})`,
      notes: [...notes],
      durationMs: Math.round(durationSec * 1000),
      timestamp: performance.now(),
    };

    store.emitSerendipityEvent(payload);
  }

  public dispose(): void {
    this.stop();
  }
}
