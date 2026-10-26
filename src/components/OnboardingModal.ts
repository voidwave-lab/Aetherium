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
import { OperatingMode, store } from '../state/store';

export class OnboardingModal {
  private root: HTMLElement;
  private audioEngine: AudioEngine;

  constructor(container: HTMLElement, audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.root = document.createElement('div');
    this.root.id = 'aetherium-onboarding-modal';
    container.appendChild(this.root);

    this.render();
    store.subscribe((state) => {
      this.updateVisibility(state.isOnboardingOpen, state.mode);
    });
  }

  private render(): void {
    this.root.className =
      'fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#07090e]/80 backdrop-blur-xl transition-opacity duration-500';

    this.root.innerHTML = `
      <div class="glass-panel relative max-w-3xl w-full rounded-3xl p-8 md:p-11 border border-slate-700/40 shadow-2xl overflow-hidden">
        <!-- Ambient top glow -->
        <div class="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[480px] h-56 rounded-full bg-indigo-500/15 blur-3xl"></div>

        <!-- Header -->
        <div class="relative text-center mb-9">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 text-[11px] font-mono uppercase tracking-[0.22em] text-indigo-300/90 mb-4">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Aetherium Orbital Sanctuary
          </div>
          <h1 class="text-2xl md:text-3xl font-light tracking-wide text-slate-100">
            Select Your Space
          </h1>
          <p class="mt-2.5 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Choose the environment tailored to your intention. You can seamlessly switch between spaces at any time from the top-right sanctuary pill.
          </p>
        </div>

        <!-- Mode Selection Cards -->
        <div class="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Card 1: Solo Explorer -->
          <button
            type="button"
            data-mode-select="explorer"
            class="group relative text-left rounded-2xl p-6 bg-slate-900/65 hover:bg-slate-900/95 border border-slate-700/40 hover:border-indigo-400/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 2a10 10 0 1 0 10 10" stroke-linecap="round" />
                  <circle cx="19" cy="5" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span
                data-badge="explorer"
                class="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25"
              >
                Personal Sanctuary
              </span>
            </div>

            <h2 class="text-lg font-medium text-slate-100 group-hover:text-indigo-200 transition-colors">
              Solo Explorer
            </h2>
            <p class="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
              Self-regulation, deep drift, and personal ambient soundscaping. Pure tactile interaction without technical distractions.
            </p>

            <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-300">
              <span>Enter Solo Sanctuary</span>
              <span class="transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          <!-- Card 2: Practitioner / Guide -->
          <button
            type="button"
            data-mode-select="practitioner"
            class="group relative text-left rounded-2xl p-6 bg-slate-900/65 hover:bg-slate-900/95 border border-slate-700/40 hover:border-cyan-400/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M2 12h4l3-7 4 14 3-7h6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <span
                data-badge="practitioner"
                class="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/25"
              >
                Clinical &amp; Guided
              </span>
            </div>

            <h2 class="text-lg font-medium text-slate-100 group-hover:text-cyan-200 transition-colors">
              Practitioner / Guide
            </h2>
            <p class="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
              Receptive music therapy, ISO-principle session arcs, bilateral EMDR grounding, and vocal-range acoustic carving.
            </p>

            <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-300">
              <span>Enter Clinical Suite</span>
              <span class="transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        <!-- Subtle footer note, GPLv3 Legal Notice & Ethics / Bibliography Button -->
        <div class="mt-7 text-center text-[11px] text-slate-500 font-mono space-y-2">
          <div>Keplerian Harmonic Engine · Zero-Telemetry Local Execution · Press ESC to dismiss</div>
          <div class="text-[10px] text-slate-600">
            Copyright (C) 2026 Voidwave Lab · Free Software under GNU GPL v3.0 (No Warranty)
          </div>
          <div class="pt-1">
            <button
              type="button"
              id="btn-onboarding-open-about"
              class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/75 hover:bg-slate-800/90 text-[11px] font-mono text-indigo-300 hover:text-indigo-100 border border-slate-700/60 hover:border-indigo-400/40 transition-colors"
            >
              <span>ⓘ Ethics, Credits &amp; Bibliography</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const modeButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-mode-select]');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-mode-select') as OperatingMode;
        store.setMode(selected, true);
        this.audioEngine.ensureStartedFromGesture();
      });
    });

    const openAboutBtn = this.root.querySelector('#btn-onboarding-open-about');
    openAboutBtn?.addEventListener('click', () => {
      store.setAboutOpen(true);
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.getState().isOnboardingOpen) {
        store.setOnboardingOpen(false);
      }
    });
  }

  private updateVisibility(isOpen: boolean, activeMode: OperatingMode): void {
    if (isOpen) {
      this.root.classList.remove('opacity-0', 'pointer-events-none');
      this.root.classList.add('opacity-100');
    } else {
      this.root.classList.add('opacity-0', 'pointer-events-none');
      this.root.classList.remove('opacity-100');
    }

    const buttons = this.root.querySelectorAll<HTMLButtonElement>('[data-mode-select]');
    buttons.forEach((btn) => {
      const cardMode = btn.getAttribute('data-mode-select');
      if (cardMode === activeMode) {
        btn.classList.add('ring-1', 'ring-indigo-400/40');
      } else {
        btn.classList.remove('ring-1', 'ring-indigo-400/40');
      }
    });
  }
}
