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

import * as Tone from 'tone';
import {
  ClinicalAnchorDurationMinutes,
  RecordingSource,
  SEED_PRESETS,
  SeedId,
  store,
} from '../state/store';

export type ExportAudioFormat = 'wav' | 'webm';

const FADE_IN_DURATION_SEC = 2.0;
const FADE_OUT_DURATION_SEC = 3.0;
const COMPACT_AUDIO_BITRATE_BPS = 256000;

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_IPC__' in window;
}

/**
 * Converts a SeedId into PascalCase for poetic filenames (e.g. 'rain-on-felt' -> 'RainOnFelt').
 */
export function formatPoeticSeedSlug(seedId: SeedId): string {
  const preset = SEED_PRESETS[seedId];
  if (!preset) return 'Sanctuary';
  return preset.name.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Generates an auto-formatted poetic filename such as:
 * `Aetherium_RainOnFelt_2026-10-26.wav` or `Aetherium_RainOnFelt_2026-10-26.webm`
 */
export function buildPoeticAudioFilename(
  seedId: SeedId,
  format: ExportAudioFormat,
  anchorDurationMin?: number | null
): string {
  const seedSlug = formatPoeticSeedSlug(seedId);
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yyyy}-${mm}-${dd}`;
  const anchorTag =
    anchorDurationMin && anchorDurationMin > 0 ? `_${anchorDurationMin}MinAnchor` : '';
  return `Aetherium_${seedSlug}${anchorTag}_${datePart}.${format}`;
}

/**
 * Applies an automatic 2-second cosine fade-in at the start of the stereo buffer
 * and a 3-second cosine fade-out at the end of the buffer in-place so exported
 * audio loops seamlessly on mobile phones without clicks or pops.
 */
export function applySeamlessCosineFades(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number,
  fadeInSec = FADE_IN_DURATION_SEC,
  fadeOutSec = FADE_OUT_DURATION_SEC
): void {
  const totalSamples = Math.min(leftChannel.length, rightChannel.length);
  if (totalSamples === 0 || sampleRate <= 0) return;

  const fadeInSamples = Math.min(
    Math.floor(totalSamples * 0.45),
    Math.floor(fadeInSec * sampleRate)
  );
  const fadeOutSamples = Math.min(
    Math.floor(totalSamples * 0.45),
    Math.floor(fadeOutSec * sampleRate)
  );

  // 2-second raised-cosine fade-in: 0.0 -> 1.0
  for (let i = 0; i < fadeInSamples; i++) {
    const phase = i / fadeInSamples;
    const gain = 0.5 * (1.0 - Math.cos(Math.PI * phase));
    leftChannel[i] *= gain;
    rightChannel[i] *= gain;
  }

  // 3-second raised-cosine fade-out: 1.0 -> 0.0
  const fadeOutStart = totalSamples - fadeOutSamples;
  for (let j = 0; j < fadeOutSamples; j++) {
    const idx = fadeOutStart + j;
    const phase = j / fadeOutSamples;
    const gain = 0.5 * (1.0 + Math.cos(Math.PI * phase));
    leftChannel[idx] *= gain;
    rightChannel[idx] *= gain;
  }
}

/**
 * Pure TypeScript 44-byte RIFF/WAVE header generator and 16-bit Stereo PCM encoder.
 * Outputs a `Uint8Array` ready for Tauri's `writeBinaryFile` or browser Blob download.
 */
export function encodeWAV(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number
): Uint8Array {
  const numFrames = Math.min(leftChannel.length, rightChannel.length);
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = Math.round(sampleRate) * blockAlign;
  const dataByteLength = numFrames * blockAlign;
  const totalByteLength = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  const writeAscii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // 1. RIFF Chunk Descriptor (12 bytes)
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(8, 'WAVE');

  // 2. "fmt " Sub-chunk (24 bytes)
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for Linear PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels (2 = Stereo)
  view.setUint32(24, Math.round(sampleRate), true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign (4 bytes per stereo frame)
  view.setUint16(34, bitsPerSample, true); // BitsPerSample (16-bit)

  // 3. "data" Sub-chunk (8 bytes header + interleaved 16-bit signed PCM frames)
  writeAscii(36, 'data');
  view.setUint32(40, dataByteLength, true);

  let byteOffset = 44;
  for (let i = 0; i < numFrames; i++) {
    const rawL = leftChannel[i];
    const rawR = rightChannel[i];

    const clampedL = Math.max(-1.0, Math.min(1.0, Number.isFinite(rawL) ? rawL : 0));
    const clampedR = Math.max(-1.0, Math.min(1.0, Number.isFinite(rawR) ? rawR : 0));

    const int16L = clampedL < 0 ? Math.round(clampedL * 0x8000) : Math.round(clampedL * 0x7fff);
    const int16R = clampedR < 0 ? Math.round(clampedR * 0x8000) : Math.round(clampedR * 0x7fff);

    view.setInt16(byteOffset, int16L, true);
    view.setInt16(byteOffset + 2, int16R, true);
    byteOffset += 4;
  }

  return new Uint8Array(arrayBuffer);
}

/**
 * Dual-Format Studio Audio Recorder Engine (`src/audio/AudioRecorder.ts`).
 *
 * Taps directly after the Master Limiter/EQ in `AudioEngine.ts` and captures:
 * - Format A: Lossless 16-bit Stereo PCM `.wav` with automatic 2s cosine fade-in & 3s cosine fade-out.
 * - Format B: Compact Mobile Audio (`.webm` / `.ogg` via `MediaRecorder` at 256,000 bps).
 */
export class AudioRecorder {
  private rawContext: AudioContext | null = null;
  private nativeAudioContext: AudioContext | null = null;
  private tapGainNode: Tone.Gain | null = null;
  private nativeTapBridgeNode: GainNode | null = null;
  private silentSinkNode: GainNode | null = null;
  private scriptCollectorNode: ScriptProcessorNode | null = null;
  private mediaStreamGainNode: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderMimeType = 'audio/webm';

  private leftChunks: Float32Array[] = [];
  private rightChunks: Float32Array[] = [];
  private totalCapturedFrames = 0;
  private capturedSampleRate = 48000;

  private compactBlobs: Blob[] = [];
  private lastEncodedWav: Uint8Array | null = null;
  private lastCompactBytes: Uint8Array | null = null;
  private lastTargetMinutes: number | null = null;

  private isCapturing = false;
  private recordingStartedAtMs = 0;
  private timerIntervalId: number | null = null;

  /**
   * Attaches the recording tap right after the Master Limiter in `AudioEngine.ts`.
   * Safely bridges Tone.js / `standardized-audio-context` wrapper nodes and native WebKit
   * AudioContext nodes without throwing during `initializeDspGraph()`.
   */
  public attachToMasterBus(masterNode: Tone.ToneAudioNode): void {
    try {
      const stdCtx = Tone.getContext().rawContext as AudioContext & {
        _nativeAudioContext?: AudioContext;
        _nativeContext?: AudioContext;
      };
      if (!stdCtx) return;

      const nativeCtx: AudioContext =
        stdCtx._nativeAudioContext ?? stdCtx._nativeContext ?? stdCtx;

      this.rawContext = stdCtx;
      this.nativeAudioContext = nativeCtx;
      this.capturedSampleRate = nativeCtx.sampleRate || stdCtx.sampleRate || 48000;

      // Create a Tone.Gain tap node so `masterNode.connect(this.tapGainNode)` stays 100% within Tone.js / standardized-audio-context
      this.tapGainNode = new Tone.Gain(1.0);
      masterNode.connect(this.tapGainNode);

      // Extract the underlying native AudioNode from Tone.Gain so we can connect to native ScriptProcessorNode
      const tapInternal = (this.tapGainNode as unknown as {
        _gainNode?: { _nativeAudioNode?: AudioNode };
        input?: { _nativeAudioNode?: AudioNode };
      });
      const nativeSourceNode: AudioNode | null =
        tapInternal._gainNode?._nativeAudioNode ??
        tapInternal.input?._nativeAudioNode ??
        null;

      if (nativeSourceNode && typeof nativeCtx.createScriptProcessor === 'function') {
        this.nativeTapBridgeNode = nativeCtx.createGain();
        this.nativeTapBridgeNode.gain.value = 1.0;
        nativeSourceNode.connect(this.nativeTapBridgeNode);

        this.silentSinkNode = nativeCtx.createGain();
        this.silentSinkNode.gain.value = 0.0;
        this.silentSinkNode.connect(nativeCtx.destination);

        this.scriptCollectorNode = nativeCtx.createScriptProcessor(4096, 2, 2);
        this.scriptCollectorNode.onaudioprocess = (event: AudioProcessingEvent) => {
          if (!this.isCapturing) return;
          const inputBuffer = event.inputBuffer;
          const ch0 = inputBuffer.getChannelData(0);
          const ch1 = inputBuffer.numberOfChannels > 1 ? inputBuffer.getChannelData(1) : ch0;

          const copyL = new Float32Array(ch0.length);
          const copyR = new Float32Array(ch1.length);
          copyL.set(ch0);
          copyR.set(ch1);

          this.leftChunks.push(copyL);
          this.rightChunks.push(copyR);
          this.totalCapturedFrames += copyL.length;
        };

        this.nativeTapBridgeNode.connect(this.scriptCollectorNode);
        this.scriptCollectorNode.connect(this.silentSinkNode);
      }

      // 2. MediaStreamAudioDestinationNode for Format B (Compact 256 kbps .webm / .ogg)
      if (this.nativeTapBridgeNode && typeof nativeCtx.createMediaStreamDestination === 'function') {
        try {
          this.mediaStreamGainNode = nativeCtx.createGain();
          this.mediaStreamGainNode.gain.value = 1.0;
          this.mediaStreamDest = nativeCtx.createMediaStreamDestination();
          this.nativeTapBridgeNode.connect(this.mediaStreamGainNode);
          this.mediaStreamGainNode.connect(this.mediaStreamDest);
        } catch {
          this.mediaStreamDest = null;
        }
      }
    } catch (err) {
      // Never allow a recording tap error to block the main sanctuary DSP graph
      console.warn('[Aetherium] Recorder tap initialization skipped:', err);
    }
  }

  /**
   * Starts a live Explorer capture or a timed Practitioner "Patient Take-Home Anchor" recording.
   */
  public startRecording(
    source: RecordingSource = 'live-explorer',
    targetDurationMinutes?: ClinicalAnchorDurationMinutes,
    anchorLabel?: string
  ): void {
    if (this.isCapturing) return;

    const state = store.getState();
    this.leftChunks = [];
    this.rightChunks = [];
    this.totalCapturedFrames = 0;
    this.compactBlobs = [];
    this.lastEncodedWav = null;
    this.lastCompactBytes = null;
    this.lastTargetMinutes = targetDurationMinutes ?? null;

    const activeNativeCtx = this.nativeAudioContext ?? this.rawContext;
    if (activeNativeCtx) {
      this.capturedSampleRate = activeNativeCtx.sampleRate || 48000;
    }

    // Apply smooth 2-second fade-in on the MediaStream recording feed as well
    if (activeNativeCtx && this.mediaStreamGainNode) {
      const now = activeNativeCtx.currentTime;
      this.mediaStreamGainNode.gain.cancelScheduledValues(now);
      this.mediaStreamGainNode.gain.setValueAtTime(0.0001, now);
      this.mediaStreamGainNode.gain.linearRampToValueAtTime(1.0, now + FADE_IN_DURATION_SEC);
    }

    // Start Format B MediaRecorder at 256,000 bps if supported by the platform WebView
    this.startMediaRecorderStream();

    this.isCapturing = true;
    this.recordingStartedAtMs = performance.now();

    const targetDurationSec = targetDurationMinutes ? targetDurationMinutes * 60 : null;

    store.updateRecordingState({
      isRecording: true,
      source,
      elapsedSec: 0,
      targetDurationSec,
      anchorLabel: anchorLabel ?? null,
      hasPendingExport: false,
      lastRecordedSeedId: state.activeSeedId,
      lastRecordedSource: source,
      lastRecordedSampleRate: this.capturedSampleRate,
    });

    store.showToast(
      targetDurationMinutes
        ? `Recording ${anchorLabel ?? `${targetDurationMinutes} Min Take-Home Anchor`}...`
        : 'Capturing Sanctuary Audio (16-bit WAV & 256kbps Compact)...'
    );

    if (this.timerIntervalId !== null) {
      window.clearInterval(this.timerIntervalId);
    }

    this.timerIntervalId = window.setInterval(() => {
      if (!this.isCapturing) return;
      const elapsedSec = Math.floor((performance.now() - this.recordingStartedAtMs) / 1000);
      const currentRec = store.getState().recording;

      // Schedule smooth 3-second fade-out on the MediaStream node right before timed completion
      const tickNativeCtx = this.nativeAudioContext ?? this.rawContext;
      if (
        currentRec.targetDurationSec !== null &&
        tickNativeCtx &&
        this.mediaStreamGainNode &&
        currentRec.targetDurationSec - elapsedSec === Math.ceil(FADE_OUT_DURATION_SEC)
      ) {
        const now = tickNativeCtx.currentTime;
        this.mediaStreamGainNode.gain.cancelScheduledValues(now);
        this.mediaStreamGainNode.gain.setValueAtTime(1.0, now);
        this.mediaStreamGainNode.gain.linearRampToValueAtTime(
          0.0001,
          now + FADE_OUT_DURATION_SEC
        );
      }

      if (currentRec.targetDurationSec !== null && elapsedSec >= currentRec.targetDurationSec) {
        void this.stopRecording();
        return;
      }

      store.updateRecordingState({ elapsedSec });
    }, 250);
  }

  private startMediaRecorderStream(): void {
    this.mediaRecorder = null;
    if (!this.mediaStreamDest || typeof MediaRecorder === 'undefined') {
      return;
    }

    const candidateMimes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    let chosenMime = '';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      for (const mime of candidateMimes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          chosenMime = mime;
          break;
        }
      }
    }

    try {
      const options: MediaRecorderOptions = chosenMime
        ? { mimeType: chosenMime, audioBitsPerSecond: COMPACT_AUDIO_BITRATE_BPS }
        : { audioBitsPerSecond: COMPACT_AUDIO_BITRATE_BPS };

      const recorder = new MediaRecorder(this.mediaStreamDest.stream, options);
      this.mediaRecorderMimeType = recorder.mimeType || chosenMime || 'audio/webm';
      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          this.compactBlobs.push(ev.data);
        }
      };
      recorder.start(500);
      this.mediaRecorder = recorder;
    } catch {
      this.mediaRecorder = null;
    }
  }

  /**
   * Stops active capture, applies the 2s cosine fade-in & 3s cosine fade-out to the stereo buffer,
   * encodes the 16-bit RIFF/WAVE binary and finalizes the 256kbps compact stream, then opens the Export modal.
   */
  public async stopRecording(): Promise<void> {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    if (this.timerIntervalId !== null) {
      window.clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }

    const recState = store.getState().recording;
    const finalDurationSec = Math.max(
      1,
      recState.targetDurationSec !== null && recState.elapsedSec >= recState.targetDurationSec - 1
        ? recState.targetDurationSec
        : Math.round((performance.now() - this.recordingStartedAtMs) / 1000)
    );

    // Stop MediaRecorder and collect final compact audio bytes
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) {
          resolve();
          return;
        }
        this.mediaRecorder.onstop = () => resolve();
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Merge stereo Float32Array chunks and apply 2s cosine fade-in & 3s cosine fade-out
    const { left, right } = this.mergeCapturedStereoBuffers();
    applySeamlessCosineFades(
      left,
      right,
      this.capturedSampleRate,
      FADE_IN_DURATION_SEC,
      FADE_OUT_DURATION_SEC
    );

    // Pre-encode the 16-bit lossless WAV buffer
    this.lastEncodedWav = encodeWAV(left, right, this.capturedSampleRate);

    // Finalize compact mobile audio bytes from MediaRecorder (or fallback if unavailable)
    if (this.compactBlobs.length > 0) {
      const mergedBlob = new Blob(this.compactBlobs, { type: this.mediaRecorderMimeType });
      const arrayBuf = await mergedBlob.arrayBuffer();
      this.lastCompactBytes = new Uint8Array(arrayBuf);
    } else {
      // Fallback in restricted webviews without MediaRecorder support
      this.lastCompactBytes = this.lastEncodedWav;
    }

    // Clear raw Float32 chunks to free memory
    this.leftChunks = [];
    this.rightChunks = [];
    this.compactBlobs = [];

    store.updateRecordingState({
      isRecording: false,
      elapsedSec: finalDurationSec,
      hasPendingExport: true,
      lastRecordedDurationSec: finalDurationSec,
      lastRecordedSeedId: store.getState().activeSeedId,
      lastRecordedSampleRate: this.capturedSampleRate,
    });

    store.showToast('Sanctuary audio captured · Choose Studio WAV or Compact WebM to save');
  }

  /**
   * Cancels an active recording without opening the export modal.
   */
  public cancelRecording(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    if (this.timerIntervalId !== null) {
      window.clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore stop errors on cancel
      }
    }

    this.leftChunks = [];
    this.rightChunks = [];
    this.compactBlobs = [];

    store.updateRecordingState({
      isRecording: false,
      source: null,
      elapsedSec: 0,
      targetDurationSec: null,
      anchorLabel: null,
      hasPendingExport: false,
    });

    store.showToast('Audio capture cancelled');
  }

  private mergeCapturedStereoBuffers(): { left: Float32Array; right: Float32Array } {
    if (this.totalCapturedFrames === 0 || this.leftChunks.length === 0) {
      // Generate a short 1-second silent stereo buffer if stopped instantaneously
      const fallbackLen = this.capturedSampleRate;
      return {
        left: new Float32Array(fallbackLen),
        right: new Float32Array(fallbackLen),
      };
    }

    const left = new Float32Array(this.totalCapturedFrames);
    const right = new Float32Array(this.totalCapturedFrames);
    let offset = 0;

    for (let i = 0; i < this.leftChunks.length; i++) {
      const chunkL = this.leftChunks[i];
      const chunkR = this.rightChunks[i];
      left.set(chunkL, offset);
      right.set(chunkR, offset);
      offset += chunkL.length;
    }

    return { left, right };
  }

  /**
   * Saves the captured session in the chosen format ('wav' or 'webm') using Tauri's native
   * `dialog.save` + `fs.writeBinaryFile` (or browser `<a>` Blob download fallback in dev mode).
   */
  public async saveCapturedAudio(format: ExportAudioFormat): Promise<boolean> {
    const recState = store.getState().recording;
    const seedId = recState.lastRecordedSeedId ?? store.getState().activeSeedId;
    const bytes = format === 'wav' ? this.lastEncodedWav : this.lastCompactBytes;

    if (!bytes || bytes.byteLength === 0) {
      store.showToast('No recorded audio buffer available to export');
      return false;
    }

    const defaultFilename = buildPoeticAudioFilename(
      seedId,
      format,
      recState.lastRecordedSource === 'clinical-anchor' ? this.lastTargetMinutes : null
    );

    if (isTauriRuntime()) {
      try {
        const [{ save }, { writeBinaryFile }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/dialog'),
          import('@tauri-apps/api/fs'),
          import('@tauri-apps/api/tauri'),
        ]);

        const filterName =
          format === 'wav'
            ? 'Lossless Studio WAV Audio (16-bit PCM)'
            : 'Compact Mobile Audio (.webm)';

        const selectedPath = await save({
          title:
            recState.lastRecordedSource === 'clinical-anchor'
              ? 'Export Patient Take-Home Audio Anchor'
              : 'Save Sanctuary Audio Recording',
          defaultPath: defaultFilename,
          filters: [{ name: filterName, extensions: [format] }],
        });

        if (!selectedPath) {
          return false;
        }

        try {
          await writeBinaryFile({
            path: selectedPath,
            contents: bytes,
          });
        } catch {
          // Fallback to Rust native file writer if path is outside standard $AUDIO/$DESKTOP/$DOWNLOAD/$DOCUMENT scopes
          await invoke<string>('save_audio_binary_file', {
            filePath: selectedPath,
            bytes: Array.from(bytes),
          });
        }

        store.updateRecordingState({ hasPendingExport: false });
        store.showToast(
          `Saved ${format.toUpperCase()} recording (${this.formatByteSize(bytes.byteLength)})`
        );
        return true;
      } catch {
        // Fall through to browser Blob download if Tauri dialog/fs encountered an unexpected error
      }
    }

    // Graceful Browser `<a>` Blob download fallback (when running in `npm run dev` browser mode)
    const mimeType = format === 'wav' ? 'audio/wav' : 'audio/webm';
    const blobBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([blobBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);

    store.updateRecordingState({ hasPendingExport: false });
    store.showToast(`Downloaded ${defaultFilename} (${this.formatByteSize(bytes.byteLength)})`);
    return true;
  }

  public getEstimatedFileSizeLabel(format: ExportAudioFormat): string {
    const bytes = format === 'wav' ? this.lastEncodedWav : this.lastCompactBytes;
    if (!bytes) return '';
    return this.formatByteSize(bytes.byteLength);
  }

  private formatByteSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
