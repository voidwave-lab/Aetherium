// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Aetherium Pocket — Mobile / PWA / Capacitor Entrypoint (iOS, Android & GitHub Pages)
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

import './styles/main.css';
import { AudioEngine } from './audio/AudioEngine';
import { HarmonicEngine } from './audio/HarmonicEngine';
import { MobileAudioBridge } from './audio/MobileAudioBridge';
import { SanctuaryCanvas } from './canvas/SanctuaryCanvas';
import { AboutModal } from './components/AboutModal';
import { renderMeridianEclipseEmblem } from './components/AppEmblem';
import { MobileDock } from './components/MobileDock';
import { store } from './state/store';

function createPocketAwakenOverlay(
  container: HTMLElement,
  mobileAudioBridge: MobileAudioBridge
): void {
  const overlay = document.createElement('div');
  overlay.id = 'pocket-awaken-overlay';
  overlay.className =
    'fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-center bg-[#07090e]/92 backdrop-blur-2xl transition-opacity duration-700 select-none cursor-pointer';

  overlay.innerHTML = `
    <div class="relative flex flex-col items-center max-w-xs">
      <div class="relative w-24 h-24 mb-7 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full bg-sky-500/15 animate-ping" style="animation-duration: 3.4s;"></div>
        ${renderMeridianEclipseEmblem('w-20 h-20 rounded-2xl shadow-[0_0_32px_rgba(34,211,238,0.35)]')}
      </div>

      <span class="text-[10px] font-mono uppercase tracking-[0.28em] text-sky-300/85 mb-2">
        voidwave-lab // open sanctuary
      </span>

      <h1 class="text-xl font-light tracking-[0.14em] uppercase text-slate-100 mb-2.5">
        Aetherium Pocket
      </h1>

      <p class="text-xs leading-relaxed text-slate-400 mb-7">
        Generative Keplerian ambient sanctuary. Tap space to spawn orbiting notes, drag to shift octave, double-tap a satellite to dissolve.
      </p>

      <button
        id="pocket-awaken-btn"
        type="button"
        class="px-7 py-3.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-[0.98] border border-sky-400/50 text-sky-100 text-xs font-mono uppercase tracking-[0.2em] shadow-[0_0_35px_rgba(56,189,248,0.25)] transition-all"
      >
        Touch to Awaken
      </button>

      <div class="mt-6 flex items-center gap-3 text-[10px] font-mono text-slate-500">
        <span>100% Offline</span>
        <span>·</span>
        <span>GPLv3 Libre</span>
        <span>·</span>
        <button
          id="pocket-awaken-about-btn"
          type="button"
          class="text-indigo-300/80 underline underline-offset-4"
        >
          Ethics &amp; Pledge
        </button>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  let awakened = false;
  const awaken = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('#pocket-awaken-about-btn')) {
      e.stopPropagation();
      store.setAboutOpen(true);
      return;
    }
    if (awakened) return;
    awakened = true;

    await mobileAudioBridge.unlockAndStart();
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    window.setTimeout(() => {
      overlay.remove();
    }, 720);
  };

  overlay.addEventListener('click', (e) => {
    void awaken(e);
  });
  overlay.addEventListener(
    'touchend',
    (e) => {
      void awaken(e);
    },
    { passive: true }
  );
}

function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Ignore service worker registration errors in dev or restricted webviews
      });
    });
  }
}

function bootstrapAetheriumPocket(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Root #app element not found');
  }

  // Boot directly into Solo Explorer mode with mobile battery/thermal limit of 8 satellites
  store.setMode('explorer');
  store.setMaxSatellites(8);

  const audioEngine = new AudioEngine();
  const mobileAudioBridge = new MobileAudioBridge(audioEngine);

  new SanctuaryCanvas(appContainer, audioEngine, {
    maxSatellites: 8,
    isPocketMode: true,
  });

  new MobileDock(appContainer, audioEngine);
  new AboutModal(appContainer);
  createPocketAwakenOverlay(appContainer, mobileAudioBridge);

  registerServiceWorker();

  // Expose lightweight debug handle
  (window as unknown as Record<string, unknown>).__AETHERIUM_POCKET__ = {
    store,
    audioEngine,
    mobileAudioBridge,
    harmonicEngine: HarmonicEngine,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAetheriumPocket);
} else {
  bootstrapAetheriumPocket();
}
