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

import { SEED_PRESETS, SeedId, store } from '../state/store';
import { AudioEngine } from './AudioEngine';
import { HarmonicEngine } from './HarmonicEngine';

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

/**
 * Tiny 100ms 8kHz mono silent PCM WAV encoded as a base64 data URI.
 * Playing this looped in an `<audio playsinline>` element on first user touch
 * activates the native iOS AVAudioSession (Playback category) and Android media session
 * so Web Audio synthesis continues uninterrupted when the device screen is locked.
 */
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * MobileAudioBridge:
 * - Unlocks a persistent background audio stream on first user touch so Web Audio synthesis
 *   continues uninterrupted when the iOS or Android screen is locked.
 * - Integrates the W3C `navigator.mediaSession` API, displaying the active Seed title,
 *   Harmonic Zone, and Artist (`"Aetherium // voidwave-lab"`) on the Lock Screen / Control Center,
 *   and wiring Lock Screen `play`, `pause`, `stop`, `previoustrack`, and `nexttrack` controls
 *   directly to `AudioEngine` and `store`.
 */
export class MobileAudioBridge {
  private audioEngine: AudioEngine;
  private keepAliveAudioEl: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private lastSeedId = '';
  private lastLuminanceBucket = -1;
  private lastIsPlaying: boolean | null = null;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.createKeepAliveAudioElement();
    this.setupMediaSessionHandlers();
    this.bindStoreUpdates();
  }

  /**
   * Creates a hidden, inline, looping `<audio>` element with near-zero volume
   * that keeps mobile OS media playback sessions active while `isPlaying` is true.
   */
  private createKeepAliveAudioElement(): void {
    if (typeof document === 'undefined') return;

    const el = document.createElement('audio');
    el.src = SILENT_WAV_DATA_URI;
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0.01;
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.style.display = 'none';
    document.body.appendChild(el);
    this.keepAliveAudioEl = el;
  }

  /**
   * Must be invoked inside a direct user touch/click gesture handler.
   * Starts the AudioEngine and unlocks the persistent background audio keep-alive stream.
   */
  public async unlockAndStart(): Promise<void> {
    await this.audioEngine.start();

    if (this.keepAliveAudioEl) {
      try {
        await this.keepAliveAudioEl.play();
        this.isUnlocked = true;
      } catch {
        // Ignore if autoplay policy defers until next interaction
      }
    }

    this.syncMediaSessionMetadata(true);
  }

  /**
   * Wires Lock Screen / Control Center / Notification Shade transport buttons
   * (`play`, `pause`, `stop`, `previoustrack`, `nexttrack`) to `AudioEngine` and `store`.
   */
  private setupMediaSessionHandlers(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const ms = navigator.mediaSession;

    const safeSetHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ): void => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Action not supported on this browser/OS version
      }
    };

    safeSetHandler('play', async () => {
      await this.audioEngine.start();
      if (this.keepAliveAudioEl && this.keepAliveAudioEl.paused) {
        this.keepAliveAudioEl.play().catch(() => {});
      }
      this.syncMediaSessionMetadata(true);
    });

    safeSetHandler('pause', () => {
      this.audioEngine.stop();
      if (this.keepAliveAudioEl && !this.keepAliveAudioEl.paused) {
        this.keepAliveAudioEl.pause();
      }
      this.syncMediaSessionMetadata(true);
    });

    safeSetHandler('stop', () => {
      this.audioEngine.stop();
      if (this.keepAliveAudioEl && !this.keepAliveAudioEl.paused) {
        this.keepAliveAudioEl.pause();
      }
      this.syncMediaSessionMetadata(true);
    });

    safeSetHandler('previoustrack', () => {
      const currentSeed = store.getState().activeSeedId;
      const idx = SEED_ORDER.indexOf(currentSeed);
      const prevIdx = (idx - 1 + SEED_ORDER.length) % SEED_ORDER.length;
      store.selectSeed(SEED_ORDER[prevIdx]);
    });

    safeSetHandler('nexttrack', () => {
      const currentSeed = store.getState().activeSeedId;
      const idx = SEED_ORDER.indexOf(currentSeed);
      const nextIdx = (idx + 1) % SEED_ORDER.length;
      store.selectSeed(SEED_ORDER[nextIdx]);
    });
  }

  private bindStoreUpdates(): void {
    store.subscribe((state) => {
      if (this.isUnlocked && this.keepAliveAudioEl) {
        if (state.isPlaying && this.keepAliveAudioEl.paused) {
          this.keepAliveAudioEl.play().catch(() => {});
        } else if (!state.isPlaying && !this.keepAliveAudioEl.paused) {
          this.keepAliveAudioEl.pause();
        }
      }

      const lumBucket = Math.floor(state.macros.luminance * 4);
      if (
        state.activeSeedId !== this.lastSeedId ||
        lumBucket !== this.lastLuminanceBucket ||
        state.isPlaying !== this.lastIsPlaying
      ) {
        this.syncMediaSessionMetadata();
      }
    });

    // When waking or locking the screen, ensure background audio keep-alive remains active if playing
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const state = store.getState();
        if (state.isPlaying && this.keepAliveAudioEl && this.keepAliveAudioEl.paused) {
          this.keepAliveAudioEl.play().catch(() => {});
        }
      });
    }
  }

  private syncMediaSessionMetadata(force = false): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const state = store.getState();
    const lumBucket = Math.floor(state.macros.luminance * 4);
    if (
      !force &&
      state.activeSeedId === this.lastSeedId &&
      lumBucket === this.lastLuminanceBucket &&
      state.isPlaying === this.lastIsPlaying
    ) {
      return;
    }

    this.lastSeedId = state.activeSeedId;
    this.lastLuminanceBucket = lumBucket;
    this.lastIsPlaying = state.isPlaying;

    const preset = SEED_PRESETS[state.activeSeedId];
    const zone = HarmonicEngine.resolveHarmonicZone(
      state.activeSeedId,
      state.macros.luminance,
      state.modalRootOverride
    );

    try {
      if (typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: preset.name,
          artist: 'Aetherium // voidwave-lab',
          album: `${preset.subtitle} · ${zone.label}`,
          artwork: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'app-icon.svg',
              sizes: '1024x1024',
              type: 'image/svg+xml',
            },
          ],
        });
      }
      navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignore MediaMetadata errors on older WebViews
    }
  }
}
