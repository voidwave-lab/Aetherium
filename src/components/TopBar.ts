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

import {
  AetheriumState,
  MAX_SATELLITES,
  store,
} from '../state/store';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_IPC__' in window;
}

export class TopBar {
  private root: HTMLElement;
  private fileInput: HTMLInputElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('header');
    this.root.className =
      'fixed top-0 left-0 right-0 z-30 px-5 pt-4 pb-2 pointer-events-none flex flex-col gap-2';
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
    this.root.innerHTML = `
      <div class="w-full flex items-center justify-between gap-3">
        <!-- Brand & Harmonic Telemetry -->
        <div class="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            id="btn-open-space-modal"
            title="Open Space Selector"
            class="glass-pill flex items-center gap-2.5 px-3.5 py-2 rounded-full text-left group"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.85)] group-hover:scale-110 transition-transform"></span>
            <span class="text-xs font-semibold tracking-[0.18em] uppercase text-slate-100">Aetherium</span>
            <span id="topbar-scale-badge" class="hidden sm:inline-block text-[11px] font-mono text-slate-400 border-l border-slate-700/70 pl-2.5">
              D Dorian (min7/add9)
            </span>
          </button>

          <!-- Live Meridian Note & Node Count Telemetry -->
          <div class="glass-pill hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-full text-[11px] font-mono text-slate-400">
            <span>Nodes: <strong id="topbar-node-count" class="text-slate-200 font-normal">5/12</strong></span>
            <span class="text-slate-700">·</span>
            <span>Meridian: <strong id="topbar-last-note" class="text-indigo-300 font-normal">—</strong></span>
          </div>
        </div>

        <!-- Center Practitioner Clinical Status Pill (Visible in Practitioner / Guide Mode) -->
        <div
          id="practitioner-status-ribbon"
          class="pointer-events-auto hidden items-center gap-2.5 glass-pill px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-[11px] font-mono"
        >
          <span class="text-cyan-300 uppercase tracking-wider">Clinical Active</span>
          <span class="text-slate-700">·</span>
          <span id="ribbon-vocal-status" class="text-emerald-300">Dialogue -8.5dB</span>
          <span class="text-slate-700">·</span>
          <span id="ribbon-emdr-status" class="text-slate-400">EMDR Off</span>
          <span class="text-slate-700">·</span>
          <span id="ribbon-theta-status" class="text-slate-400">Theta Off</span>
        </div>

        <!-- Right Controls: Constellation Save/Load & Subtle Mode Switcher Pill -->
        <div class="pointer-events-auto flex items-center gap-2">
          <!-- Save / Load Constellation JSON -->
          <div class="glass-pill flex items-center rounded-full p-0.5">
            <button
              type="button"
              id="btn-save-constellation"
              title="Save Constellation Preset (.aether.json)"
              class="px-2.5 py-1.5 rounded-full text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
              </svg>
              <span class="hidden sm:inline">Save</span>
            </button>
            <button
              type="button"
              id="btn-load-constellation"
              title="Load Constellation Preset (.aether.json)"
              class="px-2.5 py-1.5 rounded-full text-[11px] text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span class="hidden sm:inline">Load</span>
            </button>
          </div>

          <!-- Ethics, Credits & Academic Bibliography Button -->
          <button
            type="button"
            id="btn-open-about-modal"
            title="Open Ethics, Open-Source Credits & Academic Bibliography"
            class="glass-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono text-slate-300 hover:text-indigo-200 transition-colors"
          >
            <span class="text-indigo-400">ⓘ</span>
            <span class="hidden md:inline">Ethics, Credits &amp; Bibliography</span>
          </button>

          <!-- Top-Right Mode Switcher Pill Button -->
          <button
            type="button"
            id="btn-mode-switcher-pill"
            title="Switch between Solo Explorer and Practitioner / Guide mode"
            class="glass-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
          >
            <span id="mode-pill-dot" class="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span id="mode-pill-label" class="text-slate-200">Solo Explorer</span>
            <span class="text-[10px] font-mono text-slate-400 border-l border-slate-700/70 pl-2">Switch</span>
          </button>
        </div>
      </div>

      <!-- Ephemeral Toast Notification -->
      <div class="w-full flex justify-center pointer-events-none">
        <div
          id="topbar-toast"
          class="opacity-0 -translate-y-1 transition-all duration-300 glass-pill px-4 py-1.5 rounded-full text-xs font-mono text-indigo-200 border border-indigo-400/30 shadow-lg"
        ></div>
      </div>
    `;
  }

  private bindEvents(): void {
    const openModalBtn = this.root.querySelector('#btn-open-space-modal');
    openModalBtn?.addEventListener('click', () => {
      store.setOnboardingOpen(true);
    });

    const openAboutBtn = this.root.querySelector('#btn-open-about-modal');
    openAboutBtn?.addEventListener('click', () => {
      store.setAboutOpen(true);
    });

    const modeSwitchBtn = this.root.querySelector('#btn-mode-switcher-pill');
    modeSwitchBtn?.addEventListener('click', () => {
      store.toggleMode();
    });

    const saveBtn = this.root.querySelector('#btn-save-constellation');
    saveBtn?.addEventListener('click', () => {
      void this.handleSaveConstellation();
    });

    const loadBtn = this.root.querySelector('#btn-load-constellation');
    loadBtn?.addEventListener('click', () => {
      void this.handleLoadConstellation();
    });

    this.fileInput.addEventListener('change', async () => {
      const file = this.fileInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      store.loadConstellationFromJson(text);
      this.fileInput.value = '';
    });
  }

  private async handleSaveConstellation(): Promise<void> {
    const preset = store.getActivePreset();
    const jsonPayload = store.serializeConstellation(`${preset.name} Constellation`);

    if (isTauriRuntime()) {
      try {
        const [{ save }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/dialog'),
          import('@tauri-apps/api/tauri'),
        ]);
        const selectedPath = await save({
          title: 'Save Aetherium Constellation',
          defaultPath: `${preset.id}-constellation.aether.json`,
          filters: [{ name: 'Aetherium Constellation', extensions: ['json'] }],
        });
        if (selectedPath) {
          await invoke<string>('save_constellation_json', {
            filePath: selectedPath,
            payloadJson: jsonPayload,
          });
          store.showToast('Constellation saved to disk');
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
    link.download = `${preset.id}-constellation.aether.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    store.showToast('Constellation JSON exported');
  }

  private async handleLoadConstellation(): Promise<void> {
    if (isTauriRuntime()) {
      try {
        const [{ open }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/dialog'),
          import('@tauri-apps/api/tauri'),
        ]);
        const selected = await open({
          title: 'Load Aetherium Constellation',
          multiple: false,
          filters: [{ name: 'Aetherium Constellation', extensions: ['json'] }],
        });
        if (typeof selected === 'string') {
          const content = await invoke<string>('load_constellation_json', {
            filePath: selected,
          });
          store.loadConstellationFromJson(content);
        }
        return;
      } catch {
        // Fallback to file input
      }
    }

    this.fileInput.click();
  }

  private syncState(state: AetheriumState): void {
    const harmonicZone = store.getActiveHarmonicZone();
    const scaleBadge = this.root.querySelector('#topbar-scale-badge');
    if (scaleBadge) {
      scaleBadge.textContent = harmonicZone.label;
    }

    const nodeCountEl = this.root.querySelector('#topbar-node-count');
    if (nodeCountEl) {
      nodeCountEl.textContent = `${state.satellites.length}/${MAX_SATELLITES}`;
    }

    const lastNoteEl = this.root.querySelector('#topbar-last-note');
    if (lastNoteEl && state.lastTriggerEvent) {
      lastNoteEl.textContent = state.lastTriggerEvent.silencedByRarity
        ? `${state.lastTriggerEvent.note} (Silence)`
        : `${state.lastTriggerEvent.note} · ${Math.round(state.lastTriggerEvent.frequency)}Hz`;
    }

    // Mode pill & status ribbon update
    const modeDot = this.root.querySelector('#mode-pill-dot');
    const modeLabel = this.root.querySelector('#mode-pill-label');
    const statusRibbon = this.root.querySelector('#practitioner-status-ribbon');

    if (state.mode === 'practitioner') {
      if (modeDot) {
        modeDot.className =
          'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]';
      }
      if (modeLabel) {
        modeLabel.textContent = 'Practitioner / Guide';
      }
      if (statusRibbon) {
        statusRibbon.classList.remove('hidden');
        statusRibbon.classList.add('hidden', 'xl:flex');
      }

      const p = state.practitioner;
      const vocalStatus = this.root.querySelector('#ribbon-vocal-status');
      if (vocalStatus) {
        vocalStatus.textContent = p.vocalCarvingEnabled
          ? `Dialogue ${p.vocalCarvingDepthDb.toFixed(1)}dB`
          : 'Dialogue Flat';
        vocalStatus.className = p.vocalCarvingEnabled ? 'text-emerald-300' : 'text-slate-500';
      }

      const emdrStatus = this.root.querySelector('#ribbon-emdr-status');
      if (emdrStatus) {
        emdrStatus.textContent = p.emdrBilateralEnabled
          ? `EMDR ${p.emdrRateHz.toFixed(2)}Hz (${Math.round(p.emdrStereoWidth * 100)}%)`
          : 'EMDR Off';
        emdrStatus.className = p.emdrBilateralEnabled ? 'text-cyan-300' : 'text-slate-500';
      }

      const thetaStatus = this.root.querySelector('#ribbon-theta-status');
      if (thetaStatus) {
        thetaStatus.textContent = p.binauralThetaEnabled ? '6Hz Theta ON' : 'Theta Off';
        thetaStatus.className = p.binauralThetaEnabled ? 'text-indigo-300' : 'text-slate-500';
      }
    } else {
      if (modeDot) {
        modeDot.className =
          'w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)]';
      }
      if (modeLabel) {
        modeLabel.textContent = 'Solo Explorer';
      }
      if (statusRibbon) {
        statusRibbon.className = 'pointer-events-auto hidden items-center gap-2.5 glass-pill px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-[11px] font-mono';
      }
    }

    // Toast visibility
    const toastEl = this.root.querySelector('#topbar-toast');
    if (toastEl) {
      if (state.statusToast) {
        toastEl.textContent = state.statusToast;
        toastEl.classList.remove('opacity-0', '-translate-y-1');
        toastEl.classList.add('opacity-100', 'translate-y-0');
      } else {
        toastEl.classList.add('opacity-0', '-translate-y-1');
        toastEl.classList.remove('opacity-100', 'translate-y-0');
      }
    }
  }
}
