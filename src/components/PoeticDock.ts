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
import { buildPoeticAudioFilename } from '../audio/AudioRecorder';
import {
  AetheriumState,
  MacroParams,
  SEED_PRESETS,
  SeedId,
  SleepTimerDuration,
  store,
} from '../state/store';

interface MacroControlMeta {
  key: keyof MacroParams;
  label: string;
  leftPole: string;
  rightPole: string;
}

const MACRO_CONTROLS: MacroControlMeta[] = [
  {
    key: 'luminance',
    label: 'Luminance',
    leftPole: 'Shadow',
    rightPole: 'Light',
  },
  {
    key: 'fog',
    label: 'Fog',
    leftPole: 'Clarity',
    rightPole: 'Mist',
  },
  {
    key: 'viscosity',
    label: 'Viscosity',
    leftPole: 'Crystalline',
    rightPole: 'Dense',
  },
  {
    key: 'nostalgia',
    label: 'Nostalgia',
    leftPole: 'Pristine',
    rightPole: 'Worn',
  },
  {
    key: 'rarity',
    label: 'Rarity',
    leftPole: 'Present',
    rightPole: 'Silence',
  },
  {
    key: 'serendipity',
    label: 'Serendipity',
    leftPole: 'Stillness',
    rightPole: 'Sparks',
  },
];

const SEED_ORDER: SeedId[] = [
  'rain-on-felt',
  'deep-drift',
  'subterranean',
  'solar-wind',
  'midnight-vinyl',
  'singing-bowls',
  'cathedral-choir',
  'bowed-glass-strings',
];

const TIMER_DURATIONS: SleepTimerDuration[] = [0, 15, 30, 60];

export class PoeticDock {
  private root: HTMLElement;
  private audioEngine: AudioEngine;

  constructor(container: HTMLElement, audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.root = document.createElement('footer');
    this.root.className =
      'fixed bottom-0 left-0 right-0 z-30 px-4 pb-3.5 pt-2 pointer-events-none flex justify-center';
    container.appendChild(this.root);

    this.render();
    this.bindEvents();

    store.subscribe((state) => {
      this.syncState(state);
    });
  }

  private render(): void {
    const seedPillsHtml = SEED_ORDER.map((id) => {
      const preset = SEED_PRESETS[id];
      return `
        <button
          type="button"
          data-seed-id="${preset.id}"
          title="${preset.subtitle} — ${preset.description}"
          class="px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border whitespace-nowrap"
        >
          ${preset.name}
        </button>
      `;
    }).join('');

    const slidersHtml = MACRO_CONTROLS.map((ctrl) => {
      return `
        <div class="flex flex-col gap-1.5 min-w-[130px] flex-1">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-medium text-slate-200 tracking-wide">${ctrl.label}</span>
            <span
              id="macro-val-${ctrl.key}"
              class="font-mono text-[10px] text-slate-400"
            >50%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="0.5"
            data-macro-slider="${ctrl.key}"
            aria-label="${ctrl.label} (${ctrl.leftPole} to ${ctrl.rightPole})"
            class="poetic-slider"
          />
          <div class="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-500">
            <span>${ctrl.leftPole}</span>
            <span>${ctrl.rightPole}</span>
          </div>
        </div>
      `;
    }).join('');

    this.root.innerHTML = `
      <div class="pointer-events-auto glass-panel w-full max-w-6xl rounded-2xl px-5 py-3 flex flex-col gap-2.5">
        <!-- Top Row: 8 Procedural Seed Selector Pills + Master Audio & Sleep Timer Controls -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2">
          <!-- Seed Presets -->
          <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Poetic Seed Presets">
            <span class="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 mr-1">
              Seeds
            </span>
            ${seedPillsHtml}
          </div>

          <!-- Transport & Crescent Sleep Timer -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Crescent Moon Fade-to-Silence Timer -->
            <div class="flex items-center gap-1 bg-slate-900/75 border border-slate-800/90 rounded-full px-2.5 py-1">
              <svg
                class="w-3.5 h-3.5 text-amber-300/85 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span class="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline">Fade:</span>
              ${TIMER_DURATIONS.map(
                (mins) => `
                  <button
                    type="button"
                    data-sleep-mins="${mins}"
                    class="px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors"
                  >
                    ${mins === 0 ? 'Off' : `${mins}m`}
                  </button>
                `
              ).join('')}
              <span
                id="sleep-timer-countdown"
                class="hidden ml-1.5 pl-1.5 border-l border-slate-700/70 text-[10px] font-mono text-amber-300"
              ></span>
            </div>

            <!-- Live Session Capture ("Capture Sanctuary") Button -->
            <button
              type="button"
              id="btn-capture-sanctuary"
              title="Capture Sanctuary Audio (16-bit Lossless WAV & 256kbps Compact WebM)"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border"
            >
              <span id="capture-sanctuary-icon" class="flex items-center justify-center"></span>
              <span id="capture-sanctuary-label">Capture Sanctuary</span>
              <span
                id="capture-sanctuary-timer"
                class="hidden font-mono text-[11px] text-amber-200 pl-1 border-l border-rose-400/40"
              >00:00</span>
            </button>

            <!-- Master Play / Mute Button -->
            <button
              type="button"
              id="btn-master-audio"
              class="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border"
            >
              <span id="master-audio-icon" class="flex items-center justify-center"></span>
              <span id="master-audio-label">Awaken Audio</span>
            </button>
          </div>
        </div>

        <!-- Bottom Row: 4 Macro Poetic Sliders + Rarity + Serendipity (Stillness <-> Sparks) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-0.5">
          ${slidersHtml}
        </div>
      </div>

      <!-- Studio Audio Export Modal (Lossless 16-bit .wav or Compact 256kbps .webm) -->
      <div
        id="modal-export-audio"
        class="hidden fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-slate-950/75 backdrop-blur-md px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-export-audio-title"
      >
        <div class="glass-panel max-w-md w-full rounded-2xl border border-amber-400/30 p-5 shadow-2xl space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span
                id="export-modal-badge"
                class="inline-block text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 mb-1.5"
              >
                Sanctuary Capture Ready
              </span>
              <h3 id="modal-export-audio-title" class="text-sm font-semibold text-slate-100">
                Save Recorded Sanctuary Audio
              </h3>
              <p id="export-modal-subtitle" class="text-xs text-slate-400 mt-0.5">
                Processed with a 2s cosine fade-in &amp; 3s cosine fade-out for seamless mobile looping.
              </p>
            </div>
            <button
              type="button"
              id="btn-close-export-modal"
              title="Close export dialog"
              class="text-slate-400 hover:text-slate-200 px-2 py-1 text-sm font-mono"
            >
              ✕
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-[11px] font-mono bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div>
              <span class="text-slate-500 block text-[9px] uppercase">Duration</span>
              <span id="export-modal-duration" class="text-slate-200">00:00</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9px] uppercase">Master Format</span>
              <span id="export-modal-samplerate" class="text-emerald-300">48.0 kHz · 16-bit Stereo</span>
            </div>
          </div>

          <div class="space-y-2.5">
            <!-- Format A: Lossless Studio (.wav) -->
            <button
              type="button"
              id="btn-save-format-wav"
              class="w-full text-left rounded-xl p-3.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 transition-all flex items-center justify-between gap-3 group"
            >
              <div>
                <div class="text-xs font-semibold text-indigo-100 flex items-center gap-2">
                  <span>Lossless Studio (.wav)</span>
                  <span id="export-size-wav" class="text-[10px] font-mono text-indigo-300/90"></span>
                </div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  Pure 16-bit Stereo PCM · Seamless Loop Fades · Archival &amp; Studio Quality
                </div>
                <div id="export-filename-wav" class="text-[10px] font-mono text-indigo-300/80 mt-1 truncate"></div>
              </div>
              <span class="px-3 py-1.5 rounded-lg text-[11px] font-mono bg-indigo-500/30 text-indigo-100 border border-indigo-400/40 shrink-0 group-hover:bg-indigo-500/45">
                Save .WAV
              </span>
            </button>

            <!-- Format B: Mobile Compact (.webm) -->
            <button
              type="button"
              id="btn-save-format-webm"
              class="w-full text-left rounded-xl p-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 transition-all flex items-center justify-between gap-3 group"
            >
              <div>
                <div class="text-xs font-semibold text-emerald-100 flex items-center gap-2">
                  <span>Mobile Compact (.webm)</span>
                  <span id="export-size-webm" class="text-[10px] font-mono text-emerald-300/90"></span>
                </div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  256 kbps Compact Stream · Lightweight Sharing (WhatsApp / Email Friendly)
                </div>
                <div id="export-filename-webm" class="text-[10px] font-mono text-emerald-300/80 mt-1 truncate"></div>
              </div>
              <span class="px-3 py-1.5 rounded-lg text-[11px] font-mono bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 shrink-0 group-hover:bg-emerald-500/45">
                Save .WEBM
              </span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const seedButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-seed-id]');
    seedButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const seedId = btn.getAttribute('data-seed-id') as SeedId;
        this.audioEngine.ensureStartedFromGesture();
        store.selectSeed(seedId);
      });
    });

    const sliders = this.root.querySelectorAll<HTMLInputElement>('[data-macro-slider]');
    sliders.forEach((slider) => {
      slider.addEventListener('input', () => {
        const key = slider.getAttribute('data-macro-slider') as keyof MacroParams;
        const val = parseFloat(slider.value);
        store.setMacro(key, val);
      });
    });

    const sleepButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-sleep-mins]');
    sleepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = Number(btn.getAttribute('data-sleep-mins')) as SleepTimerDuration;
        store.setSleepTimer(mins);
      });
    });

    const masterAudioBtn = this.root.querySelector('#btn-master-audio');
    masterAudioBtn?.addEventListener('click', () => {
      void this.audioEngine.togglePlayback();
    });

    const captureSanctuaryBtn = this.root.querySelector('#btn-capture-sanctuary');
    captureSanctuaryBtn?.addEventListener('click', () => {
      void this.audioEngine.toggleLiveCapture();
    });

    const closeExportModalBtn = this.root.querySelector('#btn-close-export-modal');
    closeExportModalBtn?.addEventListener('click', () => {
      store.updateRecordingState({ hasPendingExport: false });
    });

    const saveWavBtn = this.root.querySelector('#btn-save-format-wav');
    saveWavBtn?.addEventListener('click', () => {
      void this.audioEngine.recorder.saveCapturedAudio('wav');
    });

    const saveWebmBtn = this.root.querySelector('#btn-save-format-webm');
    saveWebmBtn?.addEventListener('click', () => {
      void this.audioEngine.recorder.saveCapturedAudio('webm');
    });
  }

  private formatRemainingTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private syncState(state: AetheriumState): void {
    const seedButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-seed-id]');
    seedButtons.forEach((btn) => {
      const id = btn.getAttribute('data-seed-id');
      if (id === state.activeSeedId) {
        btn.className =
          'px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 bg-indigo-500/25 text-indigo-100 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.25)] whitespace-nowrap';
      } else {
        btn.className =
          'px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 bg-slate-900/55 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap';
      }
    });

    const emdrClamped =
      state.mode === 'practitioner' && state.practitioner.emdrBilateralEnabled;

    for (const ctrl of MACRO_CONTROLS) {
      const val =
        ctrl.key === 'serendipity' && emdrClamped ? 0 : state.macros[ctrl.key];
      const slider = this.root.querySelector<HTMLInputElement>(
        `[data-macro-slider="${ctrl.key}"]`
      );
      if (slider) {
        if (document.activeElement !== slider) {
          slider.value = String(val);
        }
        if (ctrl.key === 'serendipity') {
          slider.disabled = emdrClamped;
          slider.title = emdrClamped
            ? 'Clinical Safety Guard: Serendipity is clamped to 0% while Bilateral EMDR is active'
            : 'Serendipity (Stillness to Sparks)';
        }
      }
      const labelEl = this.root.querySelector(`#macro-val-${ctrl.key}`);
      if (labelEl) {
        labelEl.textContent =
          ctrl.key === 'serendipity' && emdrClamped
            ? '0% (EMDR)'
            : `${Math.round(val * 100)}%`;
      }
    }

    const sleepButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-sleep-mins]');
    sleepButtons.forEach((btn) => {
      const mins = Number(btn.getAttribute('data-sleep-mins'));
      if (mins === state.sleepTimerMinutes) {
        btn.className =
          'px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-200 border border-amber-400/40';
      } else {
        btn.className =
          'px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 hover:text-slate-200';
      }
    });

    const countdownEl = this.root.querySelector('#sleep-timer-countdown');
    if (countdownEl) {
      if (state.sleepTimerRemainingSec !== null && state.sleepTimerMinutes > 0) {
        countdownEl.textContent = this.formatRemainingTime(state.sleepTimerRemainingSec);
        countdownEl.classList.remove('hidden');
      } else {
        countdownEl.classList.add('hidden');
      }
    }

    const masterBtn = this.root.querySelector('#btn-master-audio');
    const iconEl = this.root.querySelector('#master-audio-icon');
    const labelEl = this.root.querySelector('#master-audio-label');

    if (masterBtn && iconEl && labelEl) {
      if (state.isPlaying) {
        masterBtn.className =
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.28)]';
        iconEl.innerHTML = `
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        `;
        labelEl.textContent = 'Sanctuary Resonating';
      } else {
        masterBtn.className =
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border border-indigo-400/40';
        iconEl.innerHTML = `
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        `;
        labelEl.textContent = 'Awaken Audio';
      }
    }

    // Sync Live Session Capture ("Capture Sanctuary") Button & Elapsed Timer
    const captureBtn = this.root.querySelector('#btn-capture-sanctuary');
    const captureIconEl = this.root.querySelector('#capture-sanctuary-icon');
    const captureLabelEl = this.root.querySelector('#capture-sanctuary-label');
    const captureTimerEl = this.root.querySelector('#capture-sanctuary-timer');
    const rec = state.recording;

    if (captureBtn && captureIconEl && captureLabelEl && captureTimerEl) {
      if (rec.isRecording) {
        captureBtn.className =
          'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 bg-rose-500/20 text-amber-100 border border-amber-400/60 shadow-[0_0_22px_rgba(244,63,94,0.45)]';
        captureIconEl.innerHTML = `
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
            <span class="relative inline-flex rounded-sm h-2.5 w-2.5 bg-amber-400"></span>
          </span>
        `;
        captureLabelEl.textContent =
          rec.source === 'clinical-anchor' && rec.anchorLabel
            ? `Stop (${rec.anchorLabel})`
            : 'Stop Capture';
        captureTimerEl.textContent =
          rec.targetDurationSec !== null
            ? `${this.formatRemainingTime(rec.elapsedSec)}/${this.formatRemainingTime(rec.targetDurationSec)}`
            : this.formatRemainingTime(rec.elapsedSec);
        captureTimerEl.classList.remove('hidden');
      } else {
        captureBtn.className =
          'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 bg-slate-900/75 hover:bg-rose-500/15 text-slate-200 hover:text-amber-100 border border-slate-700/80 hover:border-amber-400/45';
        captureIconEl.innerHTML = `
          <span class="inline-flex rounded-full h-2.5 w-2.5 bg-rose-400/90 shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span>
        `;
        captureLabelEl.textContent = 'Capture Sanctuary';
        captureTimerEl.classList.add('hidden');
      }
    }

    // Sync Studio Audio Export Modal
    const exportModal = this.root.querySelector('#modal-export-audio');
    if (exportModal) {
      if (rec.hasPendingExport) {
        exportModal.classList.remove('hidden');
        const seedId = rec.lastRecordedSeedId ?? state.activeSeedId;
        const targetMins =
          rec.lastRecordedSource === 'clinical-anchor' && rec.targetDurationSec
            ? Math.round(rec.targetDurationSec / 60)
            : null;

        const badgeEl = this.root.querySelector('#export-modal-badge');
        if (badgeEl) {
          badgeEl.textContent =
            rec.lastRecordedSource === 'clinical-anchor'
              ? 'Patient Take-Home Anchor Ready'
              : 'Sanctuary Capture Ready';
        }

        const durEl = this.root.querySelector('#export-modal-duration');
        if (durEl) {
          durEl.textContent = `${this.formatRemainingTime(rec.lastRecordedDurationSec)} (${SEED_PRESETS[seedId].name})`;
        }

        const srEl = this.root.querySelector('#export-modal-samplerate');
        if (srEl) {
          srEl.textContent = `${(rec.lastRecordedSampleRate / 1000).toFixed(1)} kHz · 16-bit Stereo`;
        }

        const wavNameEl = this.root.querySelector('#export-filename-wav');
        if (wavNameEl) {
          wavNameEl.textContent = buildPoeticAudioFilename(seedId, 'wav', targetMins);
        }

        const webmNameEl = this.root.querySelector('#export-filename-webm');
        if (webmNameEl) {
          webmNameEl.textContent = buildPoeticAudioFilename(seedId, 'webm', targetMins);
        }

        const wavSizeEl = this.root.querySelector('#export-size-wav');
        if (wavSizeEl) {
          const sizeStr = this.audioEngine.recorder.getEstimatedFileSizeLabel('wav');
          wavSizeEl.textContent = sizeStr ? `· ${sizeStr}` : '';
        }

        const webmSizeEl = this.root.querySelector('#export-size-webm');
        if (webmSizeEl) {
          const sizeStr = this.audioEngine.recorder.getEstimatedFileSizeLabel('webm');
          webmSizeEl.textContent = sizeStr ? `· ${sizeStr}` : '';
        }
      } else {
        exportModal.classList.add('hidden');
      }
    }
  }
}
