import { AudioEngine } from '../audio/AudioEngine';
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

        <!-- Bottom Row: 4 Macro Poetic Sliders + Rarity (Silence Probability) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-0.5">
          ${slidersHtml}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const seedButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-seed-id]');
    seedButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const seedId = btn.getAttribute('data-seed-id') as SeedId;
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

    for (const ctrl of MACRO_CONTROLS) {
      const val = state.macros[ctrl.key];
      const slider = this.root.querySelector<HTMLInputElement>(
        `[data-macro-slider="${ctrl.key}"]`
      );
      if (slider && document.activeElement !== slider) {
        slider.value = String(val);
      }
      const labelEl = this.root.querySelector(`#macro-val-${ctrl.key}`);
      if (labelEl) {
        labelEl.textContent = `${Math.round(val * 100)}%`;
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
  }
}
