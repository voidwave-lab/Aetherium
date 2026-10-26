import './styles/main.css';
import { AudioEngine } from './audio/AudioEngine';
import { HarmonicEngine } from './audio/HarmonicEngine';
import { SanctuaryCanvas } from './canvas/SanctuaryCanvas';
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
  const practitionerDock = new PractitionerDock(appContainer);
  new PoeticDock(appContainer, audioEngine);
  new OnboardingModal(appContainer, audioEngine);

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
