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

import './styles/main.css';
import { AudioEngine } from './audio/AudioEngine';
import { HarmonicEngine } from './audio/HarmonicEngine';
import { SanctuaryCanvas } from './canvas/SanctuaryCanvas';
import { AboutModal } from './components/AboutModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PoeticDock } from './components/PoeticDock';
import { PractitionerDock } from './components/PractitionerDock';
import { TopBar } from './components/TopBar';
import { SatelliteTriggerPayload, store } from './state/store';

declare global {
  interface Window {
    __AETHERIUM__?: {
      store: typeof store;
      audioEngine: AudioEngine;
      harmonicEngine: typeof HarmonicEngine;
      canvas: SanctuaryCanvas;
      practitionerDock: PractitionerDock;
    };
    onSatelliteTrigger?: (payload: SatelliteTriggerPayload) => void;
  }
}

function bootstrapAetherium(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Root #app element not found');
  }

  const audioEngine = new AudioEngine();
  const canvas = new SanctuaryCanvas(appContainer, audioEngine);
  new TopBar(appContainer);
  const practitionerDock = new PractitionerDock(appContainer, audioEngine);
  new PoeticDock(appContainer, audioEngine);
  new OnboardingModal(appContainer, audioEngine);
  new AboutModal(appContainer);

  // Forward custom event to optional global callback handler if attached by external scripts/tests
  window.addEventListener('onSatelliteTrigger', (event: Event) => {
    const customEvent = event as CustomEvent<SatelliteTriggerPayload>;
    if (typeof window.onSatelliteTrigger === 'function') {
      window.onSatelliteTrigger(customEvent.detail);
    }
  });

  window.__AETHERIUM__ = {
    store,
    audioEngine,
    harmonicEngine: HarmonicEngine,
    canvas,
    practitionerDock,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAetherium);
} else {
  bootstrapAetherium();
}
