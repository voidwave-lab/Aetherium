// SPDX-License-Identifier: GPL-3.0-or-later
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
import { HarmonicEngine } from '../audio/HarmonicEngine';
import {
  AetheriumState,
  MacroParams,
  SEED_PRESETS,
  SeedId,
  SleepTimerDuration,
  store,
} from '../state/store';
import { renderMeridianEclipseEmblem } from './AppEmblem';

interface MacroControlMeta {
  key: keyof MacroParams;
  label: string;
  leftPole: string;
  rightPole: string;
  accent: string;
}

const MACRO_CONTROLS: MacroControlMeta[] = [
  {
    key: 'luminance',
    label: 'Luminance',
    leftPole: 'Shadow',
    rightPole: 'Light',
    accent: 'accent-amber-400',
  },
  {
    key: 'fog',
    label: 'Fog',
    leftPole: 'Clarity',
    rightPole: 'Mist',
    accent: 'accent-sky-400',
  },
  {
    key: 'viscosity',
    label: 'Viscosity',
    leftPole: 'Crystalline',
    rightPole: 'Dense',
    accent: 'accent-indigo-400',
  },
  {
    key: 'nostalgia',
    label: 'Nostalgia',
    leftPole: 'Pristine',
    rightPole: 'Worn',
    accent: 'accent-amber-500',
  },
  {
    key: 'rarity',
    label: 'Rarity',
    leftPole: 'Present',
    rightPole: 'Silence',
    accent: 'accent-slate-300',
  },
  {
    key: 'serendipity',
    label: 'Serendipity',
    leftPole: 'Stillness',
    rightPole: 'Sparks',
    accent: 'accent-teal-400',
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

const TIMER_DURATIONS: SleepTimerDuration[] = [0, 15, 30, 45, 60];

export class MobileDock {
  private topBar: HTMLElement;
  private sheetContainer: HTMLElement;
  private audioEngine: AudioEngine;
  private isExpanded = false;
  private gyroEnabled = false;
  private touchStartY: number | null = null;

  constructor(container: HTMLElement, audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;

    this.topBar = document.createElement('header');
    this.topBar.className =
      'fixed top-0 left-0 right-0 z-30 px-3.5 pt-[calc(env(safe-area-inset-top,0px)+0.65rem)] pb-2 pointer-events-none flex items-center justify-between gap-2';
    container.appendChild(this.topBar);

    this.sheetContainer = document.createElement('footer');
    this.sheetContainer.className =
      'fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex flex-col justify-end';
    container.appendChild(this.sheetContainer);

    this.buildDOM();
    this.bindEvents();

    store.subscribe((state) => {
      this.syncUI(state);
    });
  }

  private buildDOM(): void {
    this.topBar.innerHTML = `
      <div class="pointer-events-auto flex items-center gap-2.5 bg-slate-950/75 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-3 py-1.5 shadow-lg">
        ${renderMeridianEclipseEmblem('w-6 h-6 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.3)]')}
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-100">Aetherium</span>
            <span class="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/25">Pocket</span>
          </div>
          <span id="mobile-active-zone-label" class="text-[10px] font-mono text-slate-400 truncate max-w-[165px]">D Dorian · Felt Piano</span>
        </div>
      </div>

      <div class="pointer-events-auto flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-2.5 py-1.5 shadow-lg">
        <span id="mobile-sat-counter" class="text-[10px] font-mono text-slate-400 px-1.5">3/8 Orbits</span>
        <button
          id="mobile-clear-orbits-btn"
          type="button"
          class="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 active:text-slate-100 bg-slate-900/80 border border-slate-800/70"
          title="Dissolve all satellites"
        >
          Clear
        </button>
        <button
          id="mobile-about-btn"
          type="button"
          class="px-2 py-1 rounded-lg text-[10px] font-medium text-indigo-200/90 bg-indigo-950/45 border border-indigo-500/30 active:bg-indigo-900/60"
          title="Ethics, Transparency &amp; Bibliography"
        >
          ⓘ Ethics
        </button>
      </div>
    `;

    const seedPillsHtml = SEED_ORDER.map((id) => {
      const preset = SEED_PRESETS[id];
      return `
        <button
          type="button"
          data-mobile-seed-id="${id}"
          class="mobile-seed-pill shrink-0 px-3 py-1.5 rounded-xl text-left border transition-all duration-200 flex flex-col gap-0.5"
        >
          <span class="text-[11px] font-medium tracking-wide whitespace-nowrap">${preset.name}</span>
          <span class="text-[9px] font-mono opacity-75 whitespace-nowrap">${preset.subtitle.split('·')[0].trim()}</span>
        </button>
      `;
    }).join('');

    const slidersHtml = MACRO_CONTROLS.map(
      (ctrl) => `
        <div class="flex flex-col gap-1 bg-slate-900/55 border border-slate-800/70 rounded-xl px-3 py-2">
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-slate-400">${ctrl.leftPole}</span>
            <div class="flex items-center gap-1.5">
              <span class="font-medium uppercase tracking-wider text-slate-200">${ctrl.label}</span>
              <span id="mobile-macro-val-${ctrl.key}" class="font-mono text-[10px] text-sky-300/90">50%</span>
            </div>
            <span class="text-slate-400">${ctrl.rightPole}</span>
          </div>
          <input
            id="mobile-macro-slider-${ctrl.key}"
            data-mobile-macro-key="${ctrl.key}"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="0.5"
            class="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer ${ctrl.accent}"
          />
        </div>
      `
    ).join('');

    const timerPillsHtml = TIMER_DURATIONS.map(
      (mins) => `
        <button
          type="button"
          data-mobile-timer-mins="${mins}"
          class="mobile-timer-pill flex-1 py-1.5 rounded-lg text-[10px] font-mono border transition-all"
        >
          ${mins === 0 ? 'Off' : `${mins}m`}
        </button>
      `
    ).join('');

    this.sheetContainer.innerHTML = `
      <div
        id="mobile-bottom-sheet"
        class="pointer-events-auto w-full max-w-lg mx-auto bg-slate-950/88 backdrop-blur-2xl border-t border-x border-slate-800/85 rounded-t-3xl shadow-[0_-16px_50px_rgba(0,0,0,0.75)] transition-all duration-300 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)]"
      >
        <!-- Swipe / Tap Handle Bar -->
        <div
          id="mobile-sheet-handle"
          class="w-full py-1.5 flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div class="w-10 h-1 rounded-full bg-slate-700/90 mb-1"></div>
          <span id="mobile-sheet-hint" class="text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500">
            Swipe up or tap for Poetic Controls &amp; Sleep Timer
          </span>
        </div>

        <!-- Primary Compact Bar: Play/Pause + Seed Scroller -->
        <div class="flex items-center gap-2.5 mt-1">
          <button
            id="mobile-play-btn"
            type="button"
            class="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-md"
            aria-label="Toggle Sanctuary Playback"
          >
            <span id="mobile-play-icon" class="text-sm font-semibold">▶</span>
          </button>

          <div
            id="mobile-seed-scroller"
            class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-1"
            style="scrollbar-width: none; -ms-overflow-style: none;"
          >
            ${seedPillsHtml}
          </div>
        </div>

        <!-- Expandable Drawer: 6 Poetic Touch Sliders, Sleep Timer & Gyroscope Tilt -->
        <div
          id="mobile-sheet-drawer"
          class="overflow-hidden transition-all duration-300 max-h-0 opacity-0 mt-0 space-y-3"
        >
          <div class="pt-2.5 border-t border-slate-800/75 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[44vh] overflow-y-auto pr-0.5">
            ${slidersHtml}
          </div>

          <!-- Sleep Timer + Gyroscope + Master Volume Row -->
          <div class="pt-1 flex flex-col gap-2.5 border-t border-slate-800/75">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Sleep Timer</span>
                <span id="mobile-timer-countdown" class="text-[10px] font-mono text-amber-300/90 hidden"></span>
              </div>
              <div class="flex items-center gap-1 flex-1 max-w-[230px]">
                ${timerPillsHtml}
              </div>
            </div>

            <div class="flex items-center justify-between gap-3">
              <button
                id="mobile-gyro-btn"
                type="button"
                class="px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 bg-slate-900/70 text-slate-400 border-slate-800"
              >
                <span>◎</span>
                <span id="mobile-gyro-label">Gyro Tilt: Off</span>
              </button>

              <div class="flex items-center gap-2 flex-1 max-w-[180px]">
                <span class="text-[10px] uppercase tracking-wider text-slate-400">Vol</span>
                <input
                  id="mobile-master-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value="0.82"
                  class="w-full h-1.5 bg-slate-800 rounded-lg accent-sky-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const playBtn = this.sheetContainer.querySelector<HTMLButtonElement>('#mobile-play-btn');
    playBtn?.addEventListener('click', async () => {
      await this.audioEngine.togglePlayback();
    });

    const handle = this.sheetContainer.querySelector<HTMLElement>('#mobile-sheet-handle');
    handle?.addEventListener('click', () => {
      this.setExpanded(!this.isExpanded);
    });

    handle?.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          this.touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    handle?.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (this.touchStartY === null || e.changedTouches.length === 0) return;
        const dy = e.changedTouches[0].clientY - this.touchStartY;
        this.touchStartY = null;
        if (dy < -24) {
          this.setExpanded(true);
        } else if (dy > 24) {
          this.setExpanded(false);
        }
      },
      { passive: true }
    );

    // Seed selection pills
    const seedBtns = this.sheetContainer.querySelectorAll<HTMLButtonElement>('[data-mobile-seed-id]');
    seedBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const seedId = btn.dataset.mobileSeedId as SeedId;
        if (seedId) {
          store.selectSeed(seedId);
          if (!store.getState().isPlaying) {
            await this.audioEngine.start();
          }
        }
      });
    });

    // Macro sliders
    const macroSliders = this.sheetContainer.querySelectorAll<HTMLInputElement>(
      '[data-mobile-macro-key]'
    );
    macroSliders.forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.mobileMacroKey as keyof MacroParams;
        const val = parseFloat(input.value);
        if (key && !Number.isNaN(val)) {
          store.setMacro(key, val);
        }
      });
    });

    // Sleep timer buttons
    const timerBtns = this.sheetContainer.querySelectorAll<HTMLButtonElement>(
      '[data-mobile-timer-mins]'
    );
    timerBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = Number(btn.dataset.mobileTimerMins) as SleepTimerDuration;
        store.setSleepTimer(mins);
      });
    });

    // Master Volume
    const volSlider = this.sheetContainer.querySelector<HTMLInputElement>('#mobile-master-volume');
    volSlider?.addEventListener('input', () => {
      const v = parseFloat(volSlider.value);
      if (!Number.isNaN(v)) {
        store.setMasterVolume(v);
      }
    });

    // Clear satellites
    const clearBtn = this.topBar.querySelector<HTMLButtonElement>('#mobile-clear-orbits-btn');
    clearBtn?.addEventListener('click', () => {
      store.clearSatellites();
    });

    // About / Ethics modal
    const aboutBtn = this.topBar.querySelector<HTMLButtonElement>('#mobile-about-btn');
    aboutBtn?.addEventListener('click', () => {
      store.setAboutOpen(true);
    });

    // Optional Gyroscope Tilt modulation
    const gyroBtn = this.sheetContainer.querySelector<HTMLButtonElement>('#mobile-gyro-btn');
    gyroBtn?.addEventListener('click', () => {
      void this.toggleGyroscope();
    });
  }

  private setExpanded(expanded: boolean): void {
    this.isExpanded = expanded;
    const drawer = this.sheetContainer.querySelector<HTMLElement>('#mobile-sheet-drawer');
    const hint = this.sheetContainer.querySelector<HTMLElement>('#mobile-sheet-hint');
    if (!drawer || !hint) return;

    if (expanded) {
      drawer.className =
        'overflow-hidden transition-all duration-300 max-h-[64vh] opacity-100 mt-2.5 space-y-3';
      hint.textContent = 'Swipe down or tap to collapse controls';
    } else {
      drawer.className =
        'overflow-hidden transition-all duration-300 max-h-0 opacity-0 mt-0 space-y-3';
      hint.textContent = 'Swipe up or tap for Poetic Controls & Sleep Timer';
    }
  }

  private handleDeviceOrientation = (event: DeviceOrientationEvent): void => {
    if (!this.gyroEnabled) return;
    const gamma = event.gamma ?? 0; // Left/Right tilt (-90 to +90)
    const beta = event.beta ?? 45; // Front/Back tilt (-180 to +180, ~45 when held naturally)

    const normX = Math.max(-0.85, Math.min(0.85, gamma / 42));
    const normY = Math.max(-0.85, Math.min(0.85, (beta - 45) / 48));

    store.setCoreOffset(normX, normY);
  };

  private async toggleGyroscope(): Promise<void> {
    if (this.gyroEnabled) {
      this.gyroEnabled = false;
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
      store.setCoreOffset(0, 0);
      this.updateGyroButtonUI();
      return;
    }

    // iOS 13+ requires explicit permission on DeviceOrientationEvent
    const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEventTyped.requestPermission();
        if (result !== 'granted') {
          store.showToast('Gyroscope permission declined');
          return;
        }
      } catch {
        store.showToast('Gyroscope unavailable on this device');
        return;
      }
    }

    this.gyroEnabled = true;
    window.addEventListener('deviceorientation', this.handleDeviceOrientation, { passive: true });
    this.updateGyroButtonUI();
  }

  private updateGyroButtonUI(): void {
    const gyroBtn = this.sheetContainer.querySelector<HTMLButtonElement>('#mobile-gyro-btn');
    const gyroLabel = this.sheetContainer.querySelector<HTMLElement>('#mobile-gyro-label');
    if (!gyroBtn || !gyroLabel) return;

    if (this.gyroEnabled) {
      gyroBtn.className =
        'px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 bg-sky-500/20 text-sky-200 border-sky-400/50';
      gyroLabel.textContent = 'Gyro Tilt: Active';
    } else {
      gyroBtn.className =
        'px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 bg-slate-900/70 text-slate-400 border-slate-800';
      gyroLabel.textContent = 'Gyro Tilt: Off';
    }
  }

  private syncUI(state: AetheriumState): void {
    // Update Top Bar Zone & Satellite Counter
    const zoneLabel = this.topBar.querySelector<HTMLElement>('#mobile-active-zone-label');
    if (zoneLabel) {
      const zone = HarmonicEngine.resolveHarmonicZone(
        state.activeSeedId,
        state.macros.luminance,
        state.modalRootOverride
      );
      const preset = SEED_PRESETS[state.activeSeedId];
      zoneLabel.textContent = `${preset.name} · ${zone.label}`;
    }

    const satCounter = this.topBar.querySelector<HTMLElement>('#mobile-sat-counter');
    if (satCounter) {
      satCounter.textContent = `${state.satellites.length}/${state.maxSatellites} Orbits`;
    }

    // Play/Pause Button
    const playBtn = this.sheetContainer.querySelector<HTMLButtonElement>('#mobile-play-btn');
    const playIcon = this.sheetContainer.querySelector<HTMLElement>('#mobile-play-icon');
    if (playBtn && playIcon) {
      if (state.isPlaying) {
        playBtn.className =
          'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-md bg-sky-500/20 border-sky-400/60 text-sky-200 shadow-sky-950/50';
        playIcon.textContent = '❚❚';
      } else {
        playBtn.className =
          'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border transition-all shadow-md bg-slate-900/90 border-slate-700/80 text-slate-200';
        playIcon.textContent = '▶';
      }
    }

    // Seed Pills
    const seedBtns = this.sheetContainer.querySelectorAll<HTMLButtonElement>('[data-mobile-seed-id]');
    seedBtns.forEach((btn) => {
      const id = btn.dataset.mobileSeedId as SeedId;
      const isActive = id === state.activeSeedId;
      btn.className = isActive
        ? 'mobile-seed-pill shrink-0 px-3 py-1.5 rounded-xl text-left border transition-all duration-200 flex flex-col gap-0.5 bg-indigo-500/20 border-indigo-400/60 text-indigo-100 shadow-sm'
        : 'mobile-seed-pill shrink-0 px-3 py-1.5 rounded-xl text-left border transition-all duration-200 flex flex-col gap-0.5 bg-slate-900/75 border-slate-800/80 text-slate-400';
    });

    // Macro Sliders
    for (const ctrl of MACRO_CONTROLS) {
      const val = state.macros[ctrl.key];
      const slider = this.sheetContainer.querySelector<HTMLInputElement>(
        `#mobile-macro-slider-${ctrl.key}`
      );
      const valLabel = this.sheetContainer.querySelector<HTMLElement>(
        `#mobile-macro-val-${ctrl.key}`
      );
      if (slider && document.activeElement !== slider) {
        slider.value = val.toFixed(2);
      }
      if (valLabel) {
        valLabel.textContent = `${Math.round(val * 100)}%`;
      }
    }

    // Sleep Timer Pills & Countdown
    const timerBtns = this.sheetContainer.querySelectorAll<HTMLButtonElement>(
      '[data-mobile-timer-mins]'
    );
    timerBtns.forEach((btn) => {
      const mins = Number(btn.dataset.mobileTimerMins) as SleepTimerDuration;
      const active = state.sleepTimerMinutes === mins;
      btn.className = active
        ? 'mobile-timer-pill flex-1 py-1.5 rounded-lg text-[10px] font-mono border transition-all bg-amber-500/20 border-amber-400/60 text-amber-200'
        : 'mobile-timer-pill flex-1 py-1.5 rounded-lg text-[10px] font-mono border transition-all bg-slate-900/70 border-slate-800 text-slate-400';
    });

    const countdownEl = this.sheetContainer.querySelector<HTMLElement>('#mobile-timer-countdown');
    if (countdownEl) {
      if (state.sleepTimerRemainingSec !== null && state.sleepTimerRemainingSec > 0) {
        const m = Math.floor(state.sleepTimerRemainingSec / 60);
        const s = state.sleepTimerRemainingSec % 60;
        countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        countdownEl.classList.remove('hidden');
      } else {
        countdownEl.classList.add('hidden');
      }
    }

    // Master Volume
    const volSlider = this.sheetContainer.querySelector<HTMLInputElement>('#mobile-master-volume');
    if (volSlider && document.activeElement !== volSlider) {
      volSlider.value = state.masterVolume.toFixed(2);
    }
  }
}
