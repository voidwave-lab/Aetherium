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

import { AudioEngine } from '../audio/AudioEngine';
import {
  AetheriumState,
  ClinicalAnchorDurationMinutes,
  evaluateIsoSessionArc,
  ISO_START_STATES,
  ISO_TARGET_STATES,
  IsoDurationMinutes,
  IsoStartStateId,
  IsoTargetStateId,
  store,
} from '../state/store';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_IPC__' in window;
}

const ISO_DURATIONS: IsoDurationMinutes[] = [20, 45, 50, 60];

export class PractitionerDock {
  private root: HTMLElement;
  private fileInput: HTMLInputElement;
  private audioEngine: AudioEngine;

  constructor(container: HTMLElement, audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.root = document.createElement('aside');
    this.root.id = 'practitioner-clinical-dock';
    this.root.setAttribute('aria-label', 'Clinical Practitioner Suite');
    container.appendChild(this.root);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,.aether.json';
    this.fileInput.className = 'hidden';
    container.appendChild(this.fileInput);

    this.render();
    this.bindEvents();

    store.subscribe((state) => {
      this.syncState(state);
    });
  }

  private render(): void {
    const startOptionsHtml = Object.values(ISO_START_STATES)
      .map(
        (st) => `<option value="${st.id}" class="bg-slate-900 text-slate-100">${st.label}</option>`
      )
      .join('');

    const targetOptionsHtml = Object.values(ISO_TARGET_STATES)
      .map(
        (st) => `<option value="${st.id}" class="bg-slate-900 text-slate-100">${st.label}</option>`
      )
      .join('');

    this.root.className =
      'fixed top-16 bottom-36 right-4 z-30 flex items-stretch pointer-events-none transition-transform duration-300';

    this.root.innerHTML = `
      <!-- Collapse / Expand Lateral Handle -->
      <div class="pointer-events-auto flex items-start pt-4 mr-1.5">
        <button
          type="button"
          id="btn-toggle-practitioner-dock"
          title="Collapse or expand Clinical Practitioner Suite"
          class="glass-pill px-2.5 py-3 rounded-l-xl rounded-r-md border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 flex flex-col items-center gap-1.5 shadow-lg"
        >
          <svg id="dock-chevron-icon" class="w-3.5 h-3.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span class="text-[9px] font-mono uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
            Clinical Suite
          </span>
        </button>
      </div>

      <!-- Main Collapsible Lateral Panel -->
      <div
        id="practitioner-dock-panel"
        class="pointer-events-auto glass-panel w-[350px] max-w-[88vw] h-full rounded-2xl border border-cyan-500/25 flex flex-col overflow-hidden shadow-2xl transition-all duration-300"
      >
        <!-- Panel Header -->
        <div class="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]"></span>
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
                Practitioner Suite
              </h2>
              <p class="text-[10px] font-mono text-cyan-300/80">
                Receptive Therapy &amp; Somatic Regulation
              </p>
            </div>
          </div>
          <span
            id="practitioner-phase-pill"
            class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/30"
          >
            Standby
          </span>
        </div>

        <!-- Scrollable Clinical Modules Container -->
        <div class="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 text-xs">

          <!-- =================================================================== -->
          <!-- MODULE 1: VOCAL-RANGE ACOUSTIC CARVING (DIALOGUE MODE)              -->
          <!-- =================================================================== -->
          <section class="rounded-xl p-3 bg-slate-900/60 border border-slate-800/90 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium text-slate-100 flex items-center gap-1.5">
                  <span>1. Vocal-Range Carving</span>
                  <span class="text-[10px] font-mono text-emerald-300/90">(Dialogue Mode)</span>
                </h3>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  Carves 1100 Hz (Q=0.7) speech pocket while preserving 40–150 Hz warmth &amp; &gt;3.5 kHz air.
                </p>
              </div>
              <button
                type="button"
                id="btn-dock-vocal-carve"
                class="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border shrink-0"
              >
                Active
              </button>
            </div>

            <!-- Visual Acoustic Pocket Curve SVG -->
            <div class="relative h-11 w-full rounded-lg bg-slate-950/70 border border-slate-800/70 px-2 py-1 flex items-center">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 260 36" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="260" y2="10" stroke="rgba(148,163,184,0.18)" stroke-dasharray="2 3" stroke-width="1" />
                <path
                  id="svg-vocal-carve-curve"
                  d="M 0 10 C 50 10, 85 10, 130 28 C 175 10, 210 10, 260 10"
                  fill="none"
                  stroke="#34d399"
                  stroke-width="1.8"
                />
              </svg>
              <div class="absolute inset-x-2 bottom-1 flex justify-between text-[8px] font-mono text-slate-500 pointer-events-none">
                <span>40–150Hz Sub</span>
                <span id="vocal-carve-pocket-label" class="text-emerald-300/90">1.1kHz (-8.5 dB)</span>
                <span>&gt;3.5kHz Air</span>
              </div>
            </div>

            <!-- Carving Depth Slider (0 dB to -12 dB) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-300">Carving Depth (1100 Hz)</span>
                <span id="val-vocal-carve-db" class="font-mono text-[10px] text-emerald-300">-8.5 dB</span>
              </div>
              <input
                type="range"
                id="slider-vocal-carve-db"
                min="-12"
                max="0"
                step="0.5"
                value="-8.5"
                class="poetic-slider"
              />
              <div class="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-12 dB (Deep Pocket)</span>
                <span>0 dB (Flat)</span>
              </div>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- MODULE 2: AUTOMATED ISO-PRINCIPLE SESSION ARC (VECTOR PACING)       -->
          <!-- =================================================================== -->
          <section class="rounded-xl p-3 bg-slate-900/60 border border-slate-800/90 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-slate-100">2. ISO-Principle Session Arc</h3>
                <p class="text-[10px] text-slate-400">
                  Mirroring → Co-Regulation (75%) → Re-Orientation (90–100%)
                </p>
              </div>
              <span id="iso-time-readout" class="font-mono text-[10px] text-cyan-300">
                00:00 / 50:00
              </span>
            </div>

            <!-- Duration Selector (20m, 45m, 50m, 60m) -->
            <div class="flex items-center justify-between gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
              <span class="text-[10px] font-mono text-slate-400 pl-1.5">Duration:</span>
              <div class="flex items-center gap-1">
                ${ISO_DURATIONS.map(
                  (mins) => `
                    <button
                      type="button"
                      data-iso-duration="${mins}"
                      class="px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
                    >
                      ${mins}m
                    </button>
                  `
                ).join('')}
              </div>
            </div>

            <!-- Phase 1: Mirroring (Start State) -->
            <div class="space-y-1">
              <label for="select-iso-start" class="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Phase 1 · Mirroring (Start State)
              </label>
              <select
                id="select-iso-start"
                class="w-full rounded-lg bg-slate-950/80 border border-slate-700/70 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                ${startOptionsHtml}
              </select>
            </div>

            <!-- Phase 2: Co-Regulation (Target State at 75%) -->
            <div class="space-y-1">
              <label for="select-iso-target" class="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Phase 2 · Co-Regulation (75% Target)
              </label>
              <select
                id="select-iso-target"
                class="w-full rounded-lg bg-slate-950/80 border border-slate-700/70 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                ${targetOptionsHtml}
              </select>
            </div>

            <!-- Visual Session Vector Timeline & Scrubbable Progress -->
            <div class="space-y-1.5 pt-1">
              <div class="relative h-14 w-full rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 overflow-hidden">
                <!-- Phase Divider Guides (75% Co-Regulation target, 90% Re-Orientation) -->
                <div class="absolute top-0 bottom-0 left-[75%] border-l border-dashed border-cyan-500/30"></div>
                <div class="absolute top-0 bottom-0 left-[90%] border-l border-dashed border-amber-400/35"></div>

                <svg class="w-full h-full overflow-visible" viewBox="0 0 260 40" preserveAspectRatio="none">
                  <!-- Vector Trajectory Curve -->
                  <path
                    id="svg-iso-vector-path"
                    d="M 0 30 Q 95 26, 195 16 L 234 16 L 260 7"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.75)"
                    stroke-width="2"
                  />
                  <!-- Playhead Marker -->
                  <circle id="svg-iso-playhead" cx="0" cy="30" r="4" fill="#fbbf24" />
                </svg>

                <div class="absolute inset-x-2 bottom-0.5 flex justify-between text-[8px] font-mono text-slate-500 pointer-events-none">
                  <span>0% Mirror</span>
                  <span class="text-cyan-400/80">75% Co-Regulate</span>
                  <span class="text-amber-300/80">90% Re-Orient</span>
                </div>
              </div>

              <!-- Timeline Scrubber -->
              <input
                type="range"
                id="slider-iso-scrub"
                min="0"
                max="100"
                step="0.5"
                value="0"
                title="Scrub or preview ISO-Principle Session Vector"
                class="poetic-slider"
              />

              <!-- ISO Serendipity Pacing Telemetry (5% Parasympathetic -> 35% Re-Orientation) -->
              <div class="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-slate-950/60 border border-slate-800/70">
                <span class="text-slate-400">Serendipity Pacing:</span>
                <span id="val-iso-serendipity-pacing" class="text-cyan-300">
                  5% (Parasympathetic Stillness)
                </span>
              </div>

              <!-- Transport Controls for ISO Arc -->
              <div class="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  id="btn-iso-start-pause"
                  class="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 transition-colors"
                >
                  Start Session Arc
                </button>
                <button
                  type="button"
                  id="btn-iso-reset"
                  class="py-1.5 px-2.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- MODULE 3: BILATERAL STIMULATION (EMDR / SOMATIC PANNER)             -->
          <!-- =================================================================== -->
          <section class="rounded-xl p-3 bg-slate-900/60 border border-slate-800/90 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium text-slate-100">3. Bilateral Grounding (EMDR)</h3>
                <p class="text-[10px] text-slate-400">
                  Sinusoidal L↔R audio panner + synchronized canvas edge luminescence.
                </p>
              </div>
              <button
                type="button"
                id="btn-dock-emdr-toggle"
                class="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border shrink-0"
              >
                Off
              </button>
            </div>

            <!-- EMDR Rate Slider (0.2 Hz to 1.5 Hz) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-300">Oscillation Rate</span>
                <span id="val-emdr-rate" class="font-mono text-[10px] text-cyan-300">0.45 Hz</span>
              </div>
              <input
                type="range"
                id="slider-emdr-rate"
                min="0.2"
                max="1.5"
                step="0.05"
                value="0.45"
                class="poetic-slider"
              />
              <div class="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.2 Hz (Meditative)</span>
                <span>1.5 Hz (Active Processing)</span>
              </div>
            </div>

            <!-- EMDR Stereo Width Slider (0% to 100%) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-300">Stereo Width</span>
                <span id="val-emdr-width" class="font-mono text-[10px] text-cyan-300">85%</span>
              </div>
              <input
                type="range"
                id="slider-emdr-width"
                min="0"
                max="1"
                step="0.05"
                value="0.85"
                class="poetic-slider"
              />
              <div class="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0% (Center)</span>
                <span>100% (Full Binaural Sweep)</span>
              </div>
            </div>

            <!-- Clinical Safety Guard Status for Serendipity during Bilateral EMDR -->
            <div
              id="emdr-serendipity-guard-badge"
              class="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-slate-950/60 border border-slate-800/70 text-slate-400"
            >
              <span>Serendipity Guard:</span>
              <span id="val-emdr-serendipity-guard">Standby (Unlocked)</span>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- MODULE 4: PSYCHOACOUSTIC SUB-BASS, BINAURAL THETA & PRESET LIBRARY  -->
          <!-- =================================================================== -->
          <section class="rounded-xl p-3 bg-slate-900/60 border border-slate-800/90 space-y-3">
            <div>
              <h3 class="font-medium text-slate-100">4. Somatic Sub-Bass &amp; Binaural Theta</h3>
              <p class="text-[10px] text-slate-400">
                Physical room grounding (40–60 Hz) &amp; 6 Hz Theta headphone entrainment.
              </p>
            </div>

            <!-- Somatic Sub-Bass Anchor (40-60 Hz) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-300">Somatic Sub-Bass Anchor (40–60 Hz)</span>
                <span id="val-somatic-sub" class="font-mono text-[10px] text-indigo-300">35%</span>
              </div>
              <input
                type="range"
                id="slider-somatic-sub"
                min="0"
                max="1"
                step="0.05"
                value="0.35"
                class="poetic-slider"
              />
            </div>

            <!-- Subtle Binaural Theta Entrainment (100 Hz L / 106 Hz R = 6 Hz Theta) -->
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/70">
              <div>
                <div class="text-[11px] text-slate-200 font-medium">
                  Binaural Theta (100Hz L / 106Hz R)
                </div>
                <div class="text-[10px] font-mono text-slate-400">
                  6 Hz Theta Beat · Headphone Mode
                </div>
              </div>
              <button
                type="button"
                id="btn-dock-binaural-theta"
                class="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border shrink-0"
              >
                Off
              </button>
            </div>

            <!-- Session Preset Save / Load (Local Library + Disk JSON) -->
            <div class="pt-2 border-t border-slate-800/70 space-y-2">
              <div class="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Clinical Session &amp; Constellation Presets
              </div>
              <div class="flex items-center gap-1.5">
                <input
                  type="text"
                  id="input-preset-name"
                  placeholder="Preset name (e.g. EMDR Phase 2)..."
                  class="flex-1 rounded-lg bg-slate-950/80 border border-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  id="btn-dock-save-local"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/35 shrink-0"
                >
                  Save Slot
                </button>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-dock-export-json"
                  class="flex-1 py-1 px-2 rounded-lg text-[11px] font-mono bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  Export JSON File
                </button>
                <button
                  type="button"
                  id="btn-dock-import-json"
                  class="flex-1 py-1 px-2 rounded-lg text-[11px] font-mono bg-slate-950/70 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  Import JSON File
                </button>
              </div>

              <div id="saved-presets-list" class="space-y-1 max-h-28 overflow-y-auto"></div>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- MODULE 5: PATIENT TAKE-HOME ANCHOR (TIMED AUDIO PRESCRIPTION)       -->
          <!-- =================================================================== -->
          <section class="rounded-xl p-3 bg-slate-900/60 border border-amber-400/25 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="font-medium text-slate-100 flex items-center gap-1.5">
                  <span>5. Patient Take-Home Anchor</span>
                </h3>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  Captures the active therapeutic state (with 2s fade-in &amp; 3s fade-out) for patient mobile listening.
                </p>
              </div>
              <span
                id="clinical-anchor-status-pill"
                class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/75 text-slate-400 border border-slate-800 shrink-0"
              >
                Ready
              </span>
            </div>

            <!-- Quick-Duration Capture Buttons -->
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                data-anchor-mins="3"
                data-anchor-label="3 Min Loop"
                class="py-1.5 px-2 rounded-lg text-[10px] font-mono text-center bg-slate-950/75 hover:bg-amber-500/20 text-slate-200 hover:text-amber-100 border border-slate-800 hover:border-amber-400/40 transition-all"
              >
                Capture 3 Min Loop
              </button>
              <button
                type="button"
                data-anchor-mins="5"
                data-anchor-label="5 Min Anchor"
                class="py-1.5 px-2 rounded-lg text-[10px] font-mono text-center bg-slate-950/75 hover:bg-amber-500/20 text-slate-200 hover:text-amber-100 border border-slate-800 hover:border-amber-400/40 transition-all"
              >
                Capture 5 Min Anchor
              </button>
              <button
                type="button"
                data-anchor-mins="10"
                data-anchor-label="10 Min Rest"
                class="py-1.5 px-2 rounded-lg text-[10px] font-mono text-center bg-slate-950/75 hover:bg-amber-500/20 text-slate-200 hover:text-amber-100 border border-slate-800 hover:border-amber-400/40 transition-all"
              >
                Capture 10 Min Rest
              </button>
            </div>

            <!-- Calm Progress Bar & Active Timed Capture Telemetry -->
            <div id="clinical-anchor-progress-container" class="hidden space-y-2 pt-1">
              <div class="flex items-center justify-between text-[10px] font-mono">
                <span id="clinical-anchor-active-label" class="text-amber-200">
                  Capturing 5 Min Anchor...
                </span>
                <span id="clinical-anchor-time-readout" class="text-amber-300">
                  00:00 / 05:00
                </span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
                <div
                  id="clinical-anchor-progress-bar"
                  class="h-full bg-gradient-to-r from-amber-400/80 via-rose-400/80 to-cyan-400/80 transition-all duration-300"
                  style="width: 0%"
                ></div>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-clinical-anchor-finish-now"
                  class="flex-1 py-1 px-2 rounded-lg text-[10px] font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-400/40 transition-colors"
                >
                  Finish &amp; Export Now
                </button>
                <button
                  type="button"
                  id="btn-clinical-anchor-cancel"
                  class="py-1 px-2.5 rounded-lg text-[10px] font-mono bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Collapse / Expand Dock
    const collapseBtn = this.root.querySelector('#btn-toggle-practitioner-dock');
    collapseBtn?.addEventListener('click', () => {
      const curr = store.getState().practitioner.isDockCollapsed;
      store.updatePractitionerConfig({ isDockCollapsed: !curr });
    });

    // 1. Vocal-Range Carving Toggle & Slider
    const vocalToggleBtn = this.root.querySelector('#btn-dock-vocal-carve');
    vocalToggleBtn?.addEventListener('click', () => {
      const curr = store.getState().practitioner.vocalCarvingEnabled;
      store.updatePractitionerConfig({ vocalCarvingEnabled: !curr });
    });

    const vocalSlider = this.root.querySelector<HTMLInputElement>('#slider-vocal-carve-db');
    vocalSlider?.addEventListener('input', () => {
      const db = parseFloat(vocalSlider.value);
      store.updatePractitionerConfig({
        vocalCarvingDepthDb: db,
        vocalCarvingEnabled: db < 0,
      });
    });

    // 2. ISO-Principle Session Arc Controls
    const durationBtns = this.root.querySelectorAll<HTMLButtonElement>('[data-iso-duration]');
    durationBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = Number(btn.getAttribute('data-iso-duration')) as IsoDurationMinutes;
        store.updatePractitionerConfig({
          isoDurationMinutes: mins,
          isoElapsedSec: 0,
          isoArcRunning: false,
        });
        store.applyIsoArcAtElapsed(0, false);
      });
    });

    const startSelect = this.root.querySelector<HTMLSelectElement>('#select-iso-start');
    startSelect?.addEventListener('change', () => {
      const val = startSelect.value as IsoStartStateId;
      store.updatePractitionerConfig({ isoStartState: val });
      store.applyIsoArcAtElapsed(store.getState().practitioner.isoElapsedSec);
    });

    const targetSelect = this.root.querySelector<HTMLSelectElement>('#select-iso-target');
    targetSelect?.addEventListener('change', () => {
      const val = targetSelect.value as IsoTargetStateId;
      store.updatePractitionerConfig({ isoTargetState: val });
      store.applyIsoArcAtElapsed(store.getState().practitioner.isoElapsedSec);
    });

    const scrubSlider = this.root.querySelector<HTMLInputElement>('#slider-iso-scrub');
    scrubSlider?.addEventListener('input', () => {
      const pct = parseFloat(scrubSlider.value) / 100;
      const totalSec = store.getState().practitioner.isoDurationMinutes * 60;
      store.applyIsoArcAtElapsed(Math.round(pct * totalSec));
    });

    const startPauseBtn = this.root.querySelector('#btn-iso-start-pause');
    startPauseBtn?.addEventListener('click', () => {
      const p = store.getState().practitioner;
      const nextRunning = !p.isoArcRunning;
      const totalSec = p.isoDurationMinutes * 60;
      const nextElapsed = p.isoElapsedSec >= totalSec ? 0 : p.isoElapsedSec;
      store.applyIsoArcAtElapsed(nextElapsed, nextRunning);
      store.showToast(
        nextRunning
          ? `ISO Session Arc Running (${p.isoDurationMinutes}m vector)`
          : 'ISO Session Arc Paused'
      );
    });

    const resetIsoBtn = this.root.querySelector('#btn-iso-reset');
    resetIsoBtn?.addEventListener('click', () => {
      store.applyIsoArcAtElapsed(0, false);
      store.showToast('ISO Session Arc reset to Phase 1 (Mirroring)');
    });

    // 3. Bilateral Grounding (EMDR) Controls
    const emdrToggleBtn = this.root.querySelector('#btn-dock-emdr-toggle');
    emdrToggleBtn?.addEventListener('click', () => {
      const curr = store.getState().practitioner.emdrBilateralEnabled;
      store.updatePractitionerConfig({ emdrBilateralEnabled: !curr });
    });

    const emdrRateSlider = this.root.querySelector<HTMLInputElement>('#slider-emdr-rate');
    emdrRateSlider?.addEventListener('input', () => {
      store.updatePractitionerConfig({ emdrRateHz: parseFloat(emdrRateSlider.value) });
    });

    const emdrWidthSlider = this.root.querySelector<HTMLInputElement>('#slider-emdr-width');
    emdrWidthSlider?.addEventListener('input', () => {
      store.updatePractitionerConfig({ emdrStereoWidth: parseFloat(emdrWidthSlider.value) });
    });

    // 4. Somatic Sub-Bass & Binaural Theta Controls
    const somaticSubSlider = this.root.querySelector<HTMLInputElement>('#slider-somatic-sub');
    somaticSubSlider?.addEventListener('input', () => {
      store.updatePractitionerConfig({
        somaticSubBassLevel: parseFloat(somaticSubSlider.value),
      });
    });

    const binauralBtn = this.root.querySelector('#btn-dock-binaural-theta');
    binauralBtn?.addEventListener('click', () => {
      const curr = store.getState().practitioner.binauralThetaEnabled;
      store.updatePractitionerConfig({ binauralThetaEnabled: !curr });
      store.showToast(
        !curr
          ? '6 Hz Theta Binaural Entrainment Active (100Hz L / 106Hz R)'
          : 'Binaural Theta Entrainment Off'
      );
    });

    // Preset Save/Load
    const saveLocalBtn = this.root.querySelector('#btn-dock-save-local');
    const nameInput = this.root.querySelector<HTMLInputElement>('#input-preset-name');
    saveLocalBtn?.addEventListener('click', () => {
      store.saveLocalPreset(nameInput?.value);
      if (nameInput) {
        nameInput.value = '';
      }
    });

    const exportJsonBtn = this.root.querySelector('#btn-dock-export-json');
    exportJsonBtn?.addEventListener('click', () => {
      void this.handleExportJson(nameInput?.value);
    });

    const importJsonBtn = this.root.querySelector('#btn-dock-import-json');
    importJsonBtn?.addEventListener('click', () => {
      void this.handleImportJson();
    });

    this.fileInput.addEventListener('change', async () => {
      const file = this.fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      store.loadConstellationFromJson(text);
      this.fileInput.value = '';
    });

    // 5. Patient Take-Home Anchor Timed Capture Controls
    const anchorBtns = this.root.querySelectorAll<HTMLButtonElement>('[data-anchor-mins]');
    anchorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = Number(btn.getAttribute('data-anchor-mins')) as ClinicalAnchorDurationMinutes;
        const label = btn.getAttribute('data-anchor-label') ?? `${mins} Min Anchor`;
        void this.audioEngine.startClinicalAnchorCapture(mins, label);
      });
    });

    const finishAnchorNowBtn = this.root.querySelector('#btn-clinical-anchor-finish-now');
    finishAnchorNowBtn?.addEventListener('click', () => {
      void this.audioEngine.recorder.stopRecording();
    });

    const cancelAnchorBtn = this.root.querySelector('#btn-clinical-anchor-cancel');
    cancelAnchorBtn?.addEventListener('click', () => {
      this.audioEngine.recorder.cancelRecording();
    });
  }

  private async handleExportJson(customName?: string): Promise<void> {
    const preset = store.getActivePreset();
    const label = customName?.trim() || `${preset.name} Clinical Session`;
    const jsonPayload = store.serializeConstellation(label);

    if (isTauriRuntime()) {
      try {
        const [{ save }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/dialog'),
          import('@tauri-apps/api/tauri'),
        ]);
        const selectedPath = await save({
          title: 'Save Aetherium Clinical Session Preset',
          defaultPath: `${preset.id}-clinical.aether.json`,
          filters: [{ name: 'Aetherium Session', extensions: ['json'] }],
        });
        if (selectedPath) {
          await invoke<string>('save_constellation_json', {
            filePath: selectedPath,
            payloadJson: jsonPayload,
          });
          store.showToast('Clinical preset saved to disk');
        }
        return;
      } catch {
        // Fallback to browser download
      }
    }

    const blob = new Blob([jsonPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.id}-clinical.aether.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    store.showToast('Clinical JSON preset exported');
  }

  private async handleImportJson(): Promise<void> {
    if (isTauriRuntime()) {
      try {
        const [{ open }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/dialog'),
          import('@tauri-apps/api/tauri'),
        ]);
        const selected = await open({
          title: 'Load Aetherium Clinical Session Preset',
          multiple: false,
          filters: [{ name: 'Aetherium Session', extensions: ['json'] }],
        });
        if (typeof selected === 'string') {
          const content = await invoke<string>('load_constellation_json', {
            filePath: selected,
          });
          store.loadConstellationFromJson(content);
        }
        return;
      } catch {
        // Fallback to browser file input
      }
    }
    this.fileInput.click();
  }

  private formatClock(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private syncState(state: AetheriumState): void {
    // Show PractitionerDock only when in 'practitioner' mode
    if (state.mode !== 'practitioner') {
      this.root.classList.add('hidden');
      return;
    }
    this.root.classList.remove('hidden');

    const p = state.practitioner;
    const panel = this.root.querySelector<HTMLElement>('#practitioner-dock-panel');
    const chevron = this.root.querySelector<HTMLElement>('#dock-chevron-icon');

    if (panel && chevron) {
      if (p.isDockCollapsed) {
        panel.classList.add('w-0', 'opacity-0', 'px-0', 'border-0', 'pointer-events-none');
        panel.classList.remove('w-[350px]');
        chevron.style.transform = 'rotate(180deg)';
      } else {
        panel.classList.remove('w-0', 'opacity-0', 'px-0', 'border-0', 'pointer-events-none');
        panel.classList.add('w-[350px]');
        chevron.style.transform = 'rotate(0deg)';
      }
    }

    // Top status pill
    const phasePill = this.root.querySelector('#practitioner-phase-pill');
    if (phasePill) {
      if (p.isoArcRunning) {
        phasePill.textContent =
          p.isoActivePhase === 'mirroring'
            ? 'Phase 1 · Mirroring'
            : p.isoActivePhase === 'co-regulation'
              ? 'Phase 2 · Co-Regulating'
              : 'Phase 3 · Re-Orienting';
      } else {
        phasePill.textContent = 'Manual / Ready';
      }
    }

    // 1. Sync Vocal-Range Carving
    const vocalBtn = this.root.querySelector('#btn-dock-vocal-carve');
    if (vocalBtn) {
      if (p.vocalCarvingEnabled) {
        vocalBtn.textContent = 'Dialogue ON';
        vocalBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shrink-0';
      } else {
        vocalBtn.textContent = 'Bypassed';
        vocalBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-slate-950/70 text-slate-400 border border-slate-800 shrink-0';
      }
    }

    const vocalDbLabel = this.root.querySelector('#val-vocal-carve-db');
    if (vocalDbLabel) {
      vocalDbLabel.textContent = `${p.vocalCarvingDepthDb.toFixed(1)} dB`;
    }
    const pocketLabel = this.root.querySelector('#vocal-carve-pocket-label');
    if (pocketLabel) {
      pocketLabel.textContent = p.vocalCarvingEnabled
        ? `1.1kHz (${p.vocalCarvingDepthDb.toFixed(1)} dB)`
        : '1.1kHz (0.0 dB Flat)';
    }
    const vocalSlider = this.root.querySelector<HTMLInputElement>('#slider-vocal-carve-db');
    if (vocalSlider && document.activeElement !== vocalSlider) {
      vocalSlider.value = String(p.vocalCarvingDepthDb);
    }

    const svgCarveCurve = this.root.querySelector('#svg-vocal-carve-curve');
    if (svgCarveCurve) {
      const depthNorm = p.vocalCarvingEnabled ? Math.abs(p.vocalCarvingDepthDb) / 12 : 0;
      const dipY = (10 + depthNorm * 24).toFixed(1);
      svgCarveCurve.setAttribute(
        'd',
        `M 0 10 C 55 10, 90 ${dipY}, 130 ${dipY} C 170 ${dipY}, 205 10, 260 10`
      );
    }

    // 2. Sync ISO-Principle Session Arc
    const totalSec = p.isoDurationMinutes * 60;
    const progress01 = totalSec > 0 ? Math.min(1, p.isoElapsedSec / totalSec) : 0;
    const timeReadout = this.root.querySelector('#iso-time-readout');
    if (timeReadout) {
      timeReadout.textContent = `${this.formatClock(p.isoElapsedSec)} / ${p.isoDurationMinutes}:00`;
    }

    const durationBtns = this.root.querySelectorAll<HTMLButtonElement>('[data-iso-duration]');
    durationBtns.forEach((btn) => {
      const mins = Number(btn.getAttribute('data-iso-duration'));
      if (mins === p.isoDurationMinutes) {
        btn.className =
          'px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-400/40';
      } else {
        btn.className =
          'px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-slate-200';
      }
    });

    const startSelect = this.root.querySelector<HTMLSelectElement>('#select-iso-start');
    if (startSelect && startSelect.value !== p.isoStartState) {
      startSelect.value = p.isoStartState;
    }

    const targetSelect = this.root.querySelector<HTMLSelectElement>('#select-iso-target');
    if (targetSelect && targetSelect.value !== p.isoTargetState) {
      targetSelect.value = p.isoTargetState;
    }

    const scrubSlider = this.root.querySelector<HTMLInputElement>('#slider-iso-scrub');
    if (scrubSlider && document.activeElement !== scrubSlider) {
      scrubSlider.value = String((progress01 * 100).toFixed(1));
    }

    // Update SVG Vector Trajectory & Playhead
    const vectorPath = this.root.querySelector('#svg-iso-vector-path');
    const playhead = this.root.querySelector('#svg-iso-playhead');
    if (vectorPath && playhead) {
      const startLum = ISO_START_STATES[p.isoStartState].vector.luminance;
      const targetLum = ISO_TARGET_STATES[p.isoTargetState].vector.luminance;
      const y0 = 35 - startLum * 28;
      const y75 = 35 - targetLum * 28;
      const y100 = 35 - 0.84 * 28;

      vectorPath.setAttribute(
        'd',
        `M 0 ${y0.toFixed(1)} C 75 ${y0.toFixed(1)}, 125 ${y75.toFixed(1)}, 195 ${y75.toFixed(1)} L 234 ${y75.toFixed(1)} L 260 ${y100.toFixed(1)}`
      );

      const evalCurr = evaluateIsoSessionArc(progress01, p.isoStartState, p.isoTargetState);
      const currX = progress01 * 260;
      const currY = 35 - evalCurr.vector.luminance * 28;
      playhead.setAttribute('cx', currX.toFixed(1));
      playhead.setAttribute('cy', currY.toFixed(1));

      const isoSerenLabel = this.root.querySelector('#val-iso-serendipity-pacing');
      if (isoSerenLabel) {
        const serenPct = Math.round(evalCurr.vector.serendipity * 100);
        isoSerenLabel.textContent =
          evalCurr.phase === 're-orientation'
            ? `${serenPct}% (Re-Orientation Awakening)`
            : evalCurr.phase === 'co-regulation'
              ? `${serenPct}% (Parasympathetic Stillness)`
              : `${serenPct}% (Phase 1 Mirroring)`;
      }
    }

    const startPauseBtn = this.root.querySelector('#btn-iso-start-pause');
    if (startPauseBtn) {
      if (p.isoArcRunning) {
        startPauseBtn.textContent = 'Pause Session Arc';
        startPauseBtn.className =
          'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/45 transition-colors';
      } else {
        startPauseBtn.textContent =
          p.isoElapsedSec > 0 && p.isoElapsedSec < totalSec
            ? 'Resume Session Arc'
            : 'Start Session Arc';
        startPauseBtn.className =
          'flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 transition-colors';
      }
    }

    // 3. Sync Bilateral Grounding (EMDR)
    const emdrBtn = this.root.querySelector('#btn-dock-emdr-toggle');
    if (emdrBtn) {
      if (p.emdrBilateralEnabled) {
        emdrBtn.textContent = 'Active';
        emdrBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shrink-0';
      } else {
        emdrBtn.textContent = 'Off';
        emdrBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-slate-950/70 text-slate-400 border border-slate-800 shrink-0';
      }
    }

    const emdrRateLabel = this.root.querySelector('#val-emdr-rate');
    if (emdrRateLabel) {
      emdrRateLabel.textContent = `${p.emdrRateHz.toFixed(2)} Hz`;
    }
    const emdrRateSlider = this.root.querySelector<HTMLInputElement>('#slider-emdr-rate');
    if (emdrRateSlider && document.activeElement !== emdrRateSlider) {
      emdrRateSlider.value = String(p.emdrRateHz);
    }

    const emdrWidthLabel = this.root.querySelector('#val-emdr-width');
    if (emdrWidthLabel) {
      emdrWidthLabel.textContent = `${Math.round(p.emdrStereoWidth * 100)}%`;
    }
    const emdrWidthSlider = this.root.querySelector<HTMLInputElement>('#slider-emdr-width');
    if (emdrWidthSlider && document.activeElement !== emdrWidthSlider) {
      emdrWidthSlider.value = String(p.emdrStereoWidth);
    }

    const emdrGuardLabel = this.root.querySelector('#val-emdr-serendipity-guard');
    if (emdrGuardLabel) {
      if (p.emdrBilateralEnabled) {
        emdrGuardLabel.textContent = 'Clamped to 0% (EMDR Active)';
        emdrGuardLabel.className = 'text-amber-300';
      } else {
        emdrGuardLabel.textContent = `Unlocked (${Math.round(state.macros.serendipity * 100)}%)`;
        emdrGuardLabel.className = 'text-slate-400';
      }
    }

    // 4. Sync Somatic Sub-Bass & Binaural Theta
    const somaticLabel = this.root.querySelector('#val-somatic-sub');
    if (somaticLabel) {
      somaticLabel.textContent = `${Math.round(p.somaticSubBassLevel * 100)}%`;
    }
    const somaticSlider = this.root.querySelector<HTMLInputElement>('#slider-somatic-sub');
    if (somaticSlider && document.activeElement !== somaticSlider) {
      somaticSlider.value = String(p.somaticSubBassLevel);
    }

    const binauralBtn = this.root.querySelector('#btn-dock-binaural-theta');
    if (binauralBtn) {
      if (p.binauralThetaEnabled) {
        binauralBtn.textContent = '6Hz ON';
        binauralBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-indigo-500/25 text-indigo-200 border border-indigo-400/45 shrink-0';
      } else {
        binauralBtn.textContent = 'Off';
        binauralBtn.className =
          'px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all bg-slate-950/70 text-slate-400 border border-slate-800 shrink-0';
      }
    }

    // 5. Render Saved Local Session Presets
    const listContainer = this.root.querySelector('#saved-presets-list');
    if (listContainer) {
      if (state.savedPresets.length === 0) {
        listContainer.innerHTML = `
          <div class="text-[10px] font-mono text-slate-500 py-1 text-center">
            No saved local slots yet
          </div>
        `;
      } else {
        listContainer.innerHTML = state.savedPresets
          .map(
            (item) => `
              <div class="flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-slate-950/65 border border-slate-800/80">
                <button
                  type="button"
                  data-load-preset-id="${item.id}"
                  class="flex-1 text-left truncate text-[11px] text-slate-200 hover:text-cyan-300 transition-colors"
                  title="Restore ${item.name}"
                >
                  ${item.name}
                  <span class="text-[9px] font-mono text-slate-500 ml-1">${item.savedAt}</span>
                </button>
                <button
                  type="button"
                  data-delete-preset-id="${item.id}"
                  title="Delete slot"
                  class="text-slate-500 hover:text-rose-400 px-1 text-xs"
                >
                  ×
                </button>
              </div>
            `
          )
          .join('');

        listContainer
          .querySelectorAll<HTMLButtonElement>('[data-load-preset-id]')
          .forEach((btn) => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-load-preset-id');
              const found = store.getState().savedPresets.find((r) => r.id === id);
              if (found) {
                store.loadConstellationFromJson(found.payloadJson);
              }
            });
          });

        listContainer
          .querySelectorAll<HTMLButtonElement>('[data-delete-preset-id]')
          .forEach((btn) => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-delete-preset-id');
              if (id) {
                store.deleteLocalPreset(id);
              }
            });
          });
      }
    }

    // 6. Sync Module 5: Patient Take-Home Anchor Progress & Status
    const rec = state.recording;
    const isAnchorRecording = rec.isRecording && rec.source === 'clinical-anchor';
    const anchorStatusPill = this.root.querySelector('#clinical-anchor-status-pill');
    const anchorProgressContainer = this.root.querySelector('#clinical-anchor-progress-container');
    const anchorActiveLabel = this.root.querySelector('#clinical-anchor-active-label');
    const anchorTimeReadout = this.root.querySelector('#clinical-anchor-time-readout');
    const anchorProgressBar = this.root.querySelector<HTMLElement>('#clinical-anchor-progress-bar');

    if (anchorStatusPill) {
      if (isAnchorRecording) {
        anchorStatusPill.textContent = 'Capturing';
        anchorStatusPill.className =
          'text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/45 shrink-0 animate-pulse';
      } else {
        anchorStatusPill.textContent = 'Ready';
        anchorStatusPill.className =
          'text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/75 text-slate-400 border border-slate-800 shrink-0';
      }
    }

    const anchorBtns = this.root.querySelectorAll<HTMLButtonElement>('[data-anchor-mins]');
    anchorBtns.forEach((btn) => {
      const mins = Number(btn.getAttribute('data-anchor-mins'));
      const isSelected =
        isAnchorRecording && rec.targetDurationSec !== null && rec.targetDurationSec === mins * 60;
      if (isSelected) {
        btn.className =
          'py-1.5 px-2 rounded-lg text-[10px] font-mono text-center bg-amber-500/25 text-amber-100 border border-amber-400/55 shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all';
      } else {
        btn.className =
          'py-1.5 px-2 rounded-lg text-[10px] font-mono text-center bg-slate-950/75 hover:bg-amber-500/20 text-slate-200 hover:text-amber-100 border border-slate-800 hover:border-amber-400/40 transition-all';
      }
    });

    if (
      anchorProgressContainer &&
      anchorActiveLabel &&
      anchorTimeReadout &&
      anchorProgressBar
    ) {
      if (isAnchorRecording && rec.targetDurationSec !== null) {
        anchorProgressContainer.classList.remove('hidden');
        anchorActiveLabel.textContent = `Capturing ${rec.anchorLabel ?? 'Anchor'}...`;
        anchorTimeReadout.textContent = `${this.formatClock(rec.elapsedSec)} / ${this.formatClock(rec.targetDurationSec)}`;
        const pct = Math.max(0, Math.min(100, (rec.elapsedSec / rec.targetDurationSec) * 100));
        anchorProgressBar.style.width = `${pct.toFixed(1)}%`;
      } else {
        anchorProgressContainer.classList.add('hidden');
      }
    }
  }
}
