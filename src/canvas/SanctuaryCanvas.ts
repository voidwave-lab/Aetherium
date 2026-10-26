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
import {
  MAX_SATELLITES,
  resolveSatellitePitch,
  SatelliteNode,
  SerendipityEventPayload,
  store,
} from '../state/store';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface MeridianRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  noteLabel: string;
  silenced: boolean;
  hue: number;
  createdAt: number;
}

interface DissolveBurst {
  x: number;
  y: number;
  particles: Array<{
    vx: number;
    vy: number;
    x: number;
    y: number;
    size: number;
  }>;
  alpha: number;
  hue: number;
}

interface AmbientStar {
  xNorm: number;
  yNorm: number;
  size: number;
  phase: number;
  speed: number;
  depth: number;
}

/**
 * Ephemeral Visual Phenomenon for Serendipity Event A ("Rubato Arpeggio"):
 * A delicate comet / shooting star with a soft glowing tail that glides across the outer
 * edge of the canvas in a gentle arc, pulsing softly as each note of the arpeggio sounds.
 */
interface SerendipityComet {
  id: string;
  createdAt: number;
  durationMs: number;
  startAngle: number;
  endAngle: number;
  radiusNormStart: number;
  radiusNormEnd: number;
  notes: string[];
  stepOffsetsMs: number[];
  triggeredStepIndex: number;
  notePulse: number;
  activeNoteLabel: string;
  hue: number;
  tail: Array<{ x: number; y: number }>;
  sparks: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    noteLabel: string;
  }>;
}

/**
 * Ephemeral Visual Phenomenon for Serendipity Event B ("Modal Breeze / Root Shift"):
 * A slow, aurora-like color ripple that expands outward from the Central Core across the background fog.
 */
interface ModalAuroraRipple {
  id: string;
  createdAt: number;
  durationMs: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  degreeLabel: string;
  rootLabel: string;
  hueShift: number;
}

/**
 * Ephemeral Visual Phenomenon for Serendipity Event C ("High-Octave Shimmer / Ghost Echo"):
 * A crystalline high-octave shimmer halo that blooms softly in the upper canopy and dissolves into mist.
 */
interface GhostEchoHalo {
  id: string;
  xNorm: number;
  yNorm: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  label: string;
  hue: number;
}

export class SanctuaryCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grainCanvas: HTMLCanvasElement;
  private grainCtx: CanvasRenderingContext2D;
  private audioEngine: AudioEngine;

  private width = 1280;
  private height = 800;
  private dpr = 1;
  private animationFrameId: number | null = null;
  private lastFrameTime = performance.now();

  private trails: Map<string, TrailPoint[]> = new Map();
  private ripples: MeridianRipple[] = [];
  private dissolveBursts: DissolveBurst[] = [];
  private ambientStars: AmbientStar[] = [];
  private serendipityComets: SerendipityComet[] = [];
  private modalAuroras: ModalAuroraRipple[] = [];
  private ghostHalos: GhostEchoHalo[] = [];

  // Interaction state
  private hoveredSatelliteId: string | null = null;
  private isHoveringCore = false;
  private draggingSatelliteId: string | null = null;
  private isDraggingCore = false;
  private pointerDownPos: { x: number; y: number } | null = null;
  private pointerMovedDistance = 0;

  // Long-press dissolve state
  private longPressTargetId: string | null = null;
  private longPressStartTime = 0;
  private readonly LONG_PRESS_MS = 520;

  // Meridian flash intensity (decays smoothly)
  private meridianFlash = 0;

  constructor(container: HTMLElement, audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'block w-full h-full cursor-crosshair';
    container.appendChild(this.canvas);

    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Unable to initialize 2D rendering context for SanctuaryCanvas');
    }
    this.ctx = context;

    // Pre-generate procedural analog film grain tile for the Nostalgia parameter
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 180;
    this.grainCanvas.height = 180;
    const gCtx = this.grainCanvas.getContext('2d');
    if (!gCtx) {
      throw new Error('Unable to initialize offscreen grain canvas');
    }
    this.grainCtx = gCtx;
    this.regenerateGrainTexture();

    this.initAmbientStars();
    this.handleResize();
    this.bindEvents();

    store.onSerendipityEvent((payload) => {
      this.handleSerendipityVisualEvent(payload);
    });

    this.startLoop();
  }

  private initAmbientStars(): void {
    this.ambientStars = [];
    for (let i = 0; i < 95; i++) {
      this.ambientStars.push({
        xNorm: Math.random(),
        yNorm: Math.random(),
        size: 0.6 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        depth: 0.2 + Math.random() * 0.8,
      });
    }
  }

  private regenerateGrainTexture(): void {
    const w = this.grainCanvas.width;
    const h = this.grainCanvas.height;
    const imgData = this.grainCtx.createImageData(w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const shade = Math.floor(Math.random() * 255);
      // Warm analog film tint
      data[i] = Math.min(255, shade + 18);
      data[i + 1] = shade;
      data[i + 2] = Math.max(0, shade - 16);
      data[i + 3] = 36;
    }
    this.grainCtx.putImageData(imgData, 0, 0);
  }

  private handleResize = (): void => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  private getCoreScreenCenter(): { cx: number; cy: number; maxOrbitRadius: number } {
    const state = store.getState();
    const usableHeight = this.height - 130; // Account for top HUD and bottom Poetic Dock
    // Slightly shift center left when Practitioner Dock is expanded so constellation stays balanced
    const practitionerShiftX =
      state.mode === 'practitioner' && !state.practitioner.isDockCollapsed
        ? -Math.min(140, this.width * 0.09)
        : 0;
    const baseCx = this.width * 0.5 + practitionerShiftX;
    const baseCy = Math.max(220, usableHeight * 0.5 + 18);
    const maxOrbitRadius = Math.min((this.width + practitionerShiftX) * 0.39, usableHeight * 0.42);

    const cx = baseCx + state.coreOffset.x * Math.min(180, this.width * 0.14);
    const cy = baseCy + state.coreOffset.y * Math.min(75, this.height * 0.08);
    return { cx, cy, maxOrbitRadius };
  }

  /**
   * Computes exact Keplerian elliptical screen coordinates for a SatelliteNode.
   * r(theta) = a * (1 - e^2) / (1 + e * cos(theta - omega))
   */
  private getSatelliteScreenPosition(
    sat: SatelliteNode,
    cx: number,
    cy: number,
    maxOrbitRadius: number,
    timeSec: number,
    nostalgia: number
  ): { x: number; y: number; rNorm: number; rPx: number } {
    const a = sat.semiMajorAxis;
    const e = sat.eccentricity;
    const theta = sat.angle;
    const omega = sat.argumentOfPeriapsis;

    const rNorm = (a * (1 - e * e)) / (1 + e * Math.cos(theta - omega));
    const rPx = rNorm * maxOrbitRadius;

    // Subtle organic analog jitter from Nostalgia macro parameter
    const jitterAmp = nostalgia * 2.6;
    const jitterX =
      jitterAmp > 0.01
        ? Math.sin(timeSec * 6.3 + sat.scaleDegree * 2.1) *
          Math.cos(timeSec * 11.7 + sat.octave) *
          jitterAmp
        : 0;
    const jitterY =
      jitterAmp > 0.01
        ? Math.cos(timeSec * 5.7 + sat.scaleDegree * 1.7) *
          Math.sin(timeSec * 9.3 + sat.octave) *
          jitterAmp
        : 0;

    return {
      x: cx + Math.cos(theta) * rPx + jitterX,
      y: cy + Math.sin(theta) * rPx + jitterY,
      rNorm,
      rPx,
    };
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button === 2) {
        return;
      }

      this.audioEngine.ensureStartedFromGesture();

      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      this.pointerDownPos = { x: px, y: py };
      this.pointerMovedDistance = 0;

      const hitSat = this.findSatelliteAtPoint(px, py);
      if (hitSat) {
        this.draggingSatelliteId = hitSat.id;
        this.longPressTargetId = hitSat.id;
        this.longPressStartTime = performance.now();
        this.canvas.setPointerCapture(e.pointerId);
        return;
      }

      if (this.isPointOnCore(px, py)) {
        this.isDraggingCore = true;
        this.canvas.setPointerCapture(e.pointerId);
        return;
      }
    });

    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (this.pointerDownPos) {
        const dx = px - this.pointerDownPos.x;
        const dy = py - this.pointerDownPos.y;
        this.pointerMovedDistance = Math.hypot(dx, dy);
        if (this.pointerMovedDistance > 7) {
          this.longPressTargetId = null;
        }
      }

      const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();

      if (this.draggingSatelliteId) {
        const dx = px - cx;
        const dy = py - cy;
        const distPx = Math.hypot(dx, dy);
        const newSemiMajor = distPx / maxOrbitRadius;
        const newAngle = Math.atan2(dy, dx);
        store.updateSatelliteOrbit(this.draggingSatelliteId, newSemiMajor, newAngle);
        this.canvas.style.cursor = 'grabbing';
        return;
      }

      if (this.isDraggingCore) {
        const state = store.getState();
        const practitionerShiftX =
          state.mode === 'practitioner' && !state.practitioner.isDockCollapsed
            ? -Math.min(140, this.width * 0.09)
            : 0;
        const baseCx = this.width * 0.5 + practitionerShiftX;
        const usableHeight = this.height - 130;
        const baseCy = Math.max(220, usableHeight * 0.5 + 18);
        const maxRangeX = Math.min(180, this.width * 0.14);
        const maxRangeY = Math.min(75, this.height * 0.08);

        const normX = (px - baseCx) / maxRangeX;
        const normY = (py - baseCy) / maxRangeY;
        store.setCoreOffset(normX, normY);
        this.canvas.style.cursor = 'grabbing';
        return;
      }

      // Update hover states
      const hitSat = this.findSatelliteAtPoint(px, py);
      this.hoveredSatelliteId = hitSat ? hitSat.id : null;
      this.isHoveringCore = !hitSat && this.isPointOnCore(px, py);

      if (this.hoveredSatelliteId || this.isHoveringCore) {
        this.canvas.style.cursor = 'grab';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
    });

    const handlePointerUp = (e: PointerEvent): void => {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Spawn a new Satellite if user clicked empty space without dragging
      if (
        !this.draggingSatelliteId &&
        !this.isDraggingCore &&
        this.pointerDownPos &&
        this.pointerMovedDistance < 6 &&
        e.button === 0
      ) {
        const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();
        const dx = px - cx;
        const dy = py - cy;
        const distPx = Math.hypot(dx, dy);
        const semiMajorAxis = distPx / maxOrbitRadius;

        if (semiMajorAxis >= 0.11 && semiMajorAxis <= 0.98) {
          const angle = Math.atan2(dy, dx);
          const created = store.spawnSatellite(semiMajorAxis, angle);
          if (created) {
            const payload = store.emitSatelliteTrigger(created);
            this.spawnTriggerRipple(px, py, payload.note, payload.silencedByRarity);
          }
        }
      }

      this.draggingSatelliteId = null;
      this.isDraggingCore = false;
      this.longPressTargetId = null;
      this.pointerDownPos = null;
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    };

    this.canvas.addEventListener('pointerup', handlePointerUp);
    this.canvas.addEventListener('pointercancel', handlePointerUp);

    // Right-click to dissolve/remove satellite
    this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const hitSat = this.findSatelliteAtPoint(px, py);
      if (hitSat) {
        this.dissolveSatellite(hitSat);
      }
    });
  }

  private findSatelliteAtPoint(px: number, py: number): SatelliteNode | null {
    const state = store.getState();
    const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();
    const nowSec = performance.now() * 0.001;

    for (let i = state.satellites.length - 1; i >= 0; i--) {
      const sat = state.satellites[i];
      const pos = this.getSatelliteScreenPosition(
        sat,
        cx,
        cy,
        maxOrbitRadius,
        nowSec,
        state.macros.nostalgia
      );
      const dist = Math.hypot(px - pos.x, py - pos.y);
      if (dist <= 20) {
        return sat;
      }
    }
    return null;
  }

  private isPointOnCore(px: number, py: number): boolean {
    const { cx, cy } = this.getCoreScreenCenter();
    return Math.hypot(px - cx, py - cy) <= 38;
  }

  private dissolveSatellite(sat: SatelliteNode): void {
    const state = store.getState();
    const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();
    const pos = this.getSatelliteScreenPosition(
      sat,
      cx,
      cy,
      maxOrbitRadius,
      performance.now() * 0.001,
      state.macros.nostalgia
    );

    const particles = [];
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const speed = 18 + Math.random() * 48;
      particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
      });
    }

    this.dissolveBursts.push({
      x: pos.x,
      y: pos.y,
      particles,
      alpha: 1,
      hue: this.computePrimaryHue(state.macros.luminance),
    });

    this.trails.delete(sat.id);
    store.removeSatellite(sat.id);
  }

  private spawnTriggerRipple(
    x: number,
    y: number,
    noteLabel: string,
    silenced: boolean
  ): void {
    const { luminance, fog } = store.getState().macros;
    this.ripples.push({
      x,
      y,
      radius: 8,
      maxRadius: silenced ? 38 + fog * 22 : 68 + fog * 55,
      alpha: silenced ? 0.32 : 0.92,
      noteLabel,
      silenced,
      hue: this.computeAccentHue(luminance),
      createdAt: performance.now(),
    });
    this.meridianFlash = Math.min(1, this.meridianFlash + (silenced ? 0.18 : 0.75));
  }

  private computePrimaryHue(luminance: number): number {
    return 234 - luminance * 44;
  }

  private computeAccentHue(luminance: number): number {
    if (luminance < 0.55) {
      return 245 - (luminance / 0.55) * 52;
    }
    const t = (luminance - 0.55) / 0.45;
    return 193 - t * 151;
  }

  private startLoop(): void {
    const tick = (now: number): void => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) * 0.001));
      this.lastFrameTime = now;

      this.updatePhysics(dt, now);
      this.render(now, dt);

      this.animationFrameId = window.requestAnimationFrame(tick);
    };

    this.animationFrameId = window.requestAnimationFrame(tick);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private updatePhysics(dt: number, now: number): void {
    const state = store.getState();
    const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();
    const { viscosity, nostalgia } = state.macros;

    // Check long-press satellite dissolve completion
    if (this.longPressTargetId && now - this.longPressStartTime >= this.LONG_PRESS_MS) {
      const target = state.satellites.find((s) => s.id === this.longPressTargetId);
      this.longPressTargetId = null;
      this.draggingSatelliteId = null;
      if (target) {
        this.dissolveSatellite(target);
      }
    }

    // Keplerian angular velocity factor slowed by Viscosity & paced by ISO-Principle Session Arc
    const viscositySpeedFactor = 1.0 - viscosity * 0.68;
    const isoPaceMultiplier =
      state.mode === 'practitioner' ? state.practitioner.isoOrbitalSpeedMultiplier : 1.0;
    const meridianAngle = -Math.PI / 2; // 12 o'clock North

    for (const sat of state.satellites) {
      if (sat.id === this.draggingSatelliteId) {
        continue;
      }

      const prevAngle = sat.angle;

      const e = sat.eccentricity;
      const rNorm =
        (sat.semiMajorAxis * (1 - e * e)) /
        (1 + e * Math.cos(sat.angle - sat.argumentOfPeriapsis));

      // Kepler's 2nd & 3rd law: angular velocity inversely proportional to r^(3/2)
      const baseAngularVel = 0.22 / Math.pow(Math.max(0.14, rNorm), 1.42);
      const dTheta = baseAngularVel * viscositySpeedFactor * isoPaceMultiplier * dt;

      let nextAngle = prevAngle + dTheta;

      // Detect crossing of the 12 o'clock North Meridian (-PI / 2)
      if (prevAngle < meridianAngle && nextAngle >= meridianAngle) {
        const payload = store.emitSatelliteTrigger(sat);
        const pos = this.getSatelliteScreenPosition(
          sat,
          cx,
          cy,
          maxOrbitRadius,
          now * 0.001,
          nostalgia
        );
        this.spawnTriggerRipple(pos.x, pos.y, payload.note, payload.silencedByRarity);
      }

      if (nextAngle > Math.PI) {
        nextAngle -= Math.PI * 2;
      }
      sat.angle = nextAngle;

      // Record orbital motion trail point
      const pos = this.getSatelliteScreenPosition(
        sat,
        cx,
        cy,
        maxOrbitRadius,
        now * 0.001,
        nostalgia
      );

      let trail = this.trails.get(sat.id);
      if (!trail) {
        trail = [];
        this.trails.set(sat.id, trail);
      }
      trail.push({ x: pos.x, y: pos.y, alpha: 1.0 });

      const maxTrailLength = Math.floor(14 + viscosity * 72);
      while (trail.length > maxTrailLength) {
        trail.shift();
      }
    }

    // Update Meridian Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += (r.maxRadius - r.radius) * 3.2 * dt + 18 * dt;
      r.alpha -= (0.55 - state.macros.viscosity * 0.25) * dt;
      if (r.alpha <= 0.01) {
        this.ripples.splice(i, 1);
      }
    }

    // Update Dissolve Bursts
    for (let i = this.dissolveBursts.length - 1; i >= 0; i--) {
      const b = this.dissolveBursts[i];
      b.alpha -= 1.4 * dt;
      for (const p of b.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }
      if (b.alpha <= 0.01) {
        this.dissolveBursts.splice(i, 1);
      }
    }

    this.meridianFlash = Math.max(0, this.meridianFlash - 1.6 * dt);

    // Update Serendipity Comets (Event A: Rubato Arpeggio)
    for (let i = this.serendipityComets.length - 1; i >= 0; i--) {
      const comet = this.serendipityComets[i];
      const elapsedMs = now - comet.createdAt;
      const progress = Math.min(1, elapsedMs / comet.durationMs);

      const angle =
        comet.startAngle + (comet.endAngle - comet.startAngle) * this.easeInOutSine(progress);
      const rNorm =
        comet.radiusNormStart + (comet.radiusNormEnd - comet.radiusNormStart) * progress;
      const rPx = rNorm * maxOrbitRadius;
      const headX = cx + Math.cos(angle) * rPx;
      const headY = cy + Math.sin(angle) * (rPx * 0.86);

      comet.tail.push({ x: headX, y: headY });
      while (comet.tail.length > 42) {
        comet.tail.shift();
      }

      // Check if a new note of the Rubato Arpeggio has sounded
      while (
        comet.triggeredStepIndex + 1 < comet.stepOffsetsMs.length &&
        elapsedMs >= comet.stepOffsetsMs[comet.triggeredStepIndex + 1]
      ) {
        comet.triggeredStepIndex++;
        comet.notePulse = 1.0;
        comet.activeNoteLabel = comet.notes[comet.triggeredStepIndex] ?? '';
        // Spawn a delicate stardust spark at the comet head for this arpeggio note
        for (let s = 0; s < 5; s++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const speed = 8 + Math.random() * 18;
          comet.sparks.push({
            x: headX,
            y: headY,
            vx: Math.cos(sparkAngle) * speed,
            vy: Math.sin(sparkAngle) * speed - 6,
            alpha: 0.92,
            noteLabel: s === 0 ? comet.activeNoteLabel : '',
          });
        }
      }

      comet.notePulse = Math.max(0, comet.notePulse - 2.4 * dt);

      for (let s = comet.sparks.length - 1; s >= 0; s--) {
        const sp = comet.sparks[s];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.alpha -= 0.72 * dt;
        if (sp.alpha <= 0.01) {
          comet.sparks.splice(s, 1);
        }
      }

      if (elapsedMs >= comet.durationMs + 900) {
        this.serendipityComets.splice(i, 1);
      }
    }

    // Update Modal Breeze Aurora Ripples (Event B: Modal Breeze / Root Shift)
    for (let i = this.modalAuroras.length - 1; i >= 0; i--) {
      const aurora = this.modalAuroras[i];
      aurora.radius += (aurora.maxRadius - aurora.radius) * 0.42 * dt + 22 * dt;
      aurora.alpha -= 0.14 * dt;
      if (aurora.alpha <= 0.01) {
        this.modalAuroras.splice(i, 1);
      }
    }

    // Update Ghost-Echo Shimmer Halos (Event C: High-Octave Shimmer)
    for (let i = this.ghostHalos.length - 1; i >= 0; i--) {
      const halo = this.ghostHalos[i];
      halo.radius += (halo.maxRadius - halo.radius) * 0.65 * dt + 10 * dt;
      halo.alpha -= 0.22 * dt;
      if (halo.alpha <= 0.01) {
        this.ghostHalos.splice(i, 1);
      }
    }
  }

  private render(now: number, _dt: number): void {
    const state = store.getState();
    const { luminance, fog, viscosity, nostalgia } = state.macros;
    const { cx, cy, maxOrbitRadius } = this.getCoreScreenCenter();
    const timeSec = now * 0.001;

    const primaryHue = this.computePrimaryHue(luminance);
    const accentHue = this.computeAccentHue(luminance);

    // 1. Base Celestial Background
    this.ctx.fillStyle = '#07090e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Atmospheric Nebula & Mist Layers (driven by Luminance & Fog)
    const bgRadius = Math.max(this.width, this.height) * (0.65 + fog * 0.35);
    const nebulaGrad = this.ctx.createRadialGradient(cx, cy, 12, cx, cy, bgRadius);
    const coreLightness = 10 + luminance * 16;
    const mistAlpha = 0.22 + fog * 0.42;

    nebulaGrad.addColorStop(
      0,
      `hsla(${accentHue}, ${55 + luminance * 25}%, ${coreLightness + 12}%, ${mistAlpha})`
    );
    nebulaGrad.addColorStop(
      0.38,
      `hsla(${primaryHue}, ${48 + luminance * 18}%, ${coreLightness}%, ${mistAlpha * 0.65})`
    );
    nebulaGrad.addColorStop(0.75, 'rgba(10, 14, 24, 0.35)');
    nebulaGrad.addColorStop(1, 'rgba(7, 9, 14, 0)');

    this.ctx.fillStyle = nebulaGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2b. Serendipity Event B: Slow Aurora-Like Color Ripple across the background fog
    this.renderModalAuroraRipples(cx, cy, primaryHue, accentHue, luminance);

    // 3. Deep Starfield (attenuated by Fog mist)
    const starVisibility = Math.max(0.18, 1.0 - fog * 0.68);
    for (const star of this.ambientStars) {
      const sx = star.xNorm * this.width;
      const sy = star.yNorm * this.height;
      const twinkle = 0.45 + 0.55 * Math.sin(timeSec * star.speed + star.phase);
      const alpha = twinkle * starVisibility * star.depth * (0.35 + luminance * 0.35);

      this.ctx.fillStyle = `hsla(${primaryHue + 15}, 40%, ${75 + luminance * 20}%, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Harmonic Register Reference Rings (Inner Oct 4-5, Middle Oct 3-4, Outer Oct 2-3)
    const registerRings = [0.24, 0.38, 0.54, 0.68, 0.86];
    this.ctx.save();
    for (let i = 0; i < registerRings.length; i++) {
      const rPx = registerRings[i] * maxOrbitRadius;
      this.ctx.strokeStyle = `hsla(${primaryHue}, 35%, 65%, ${0.045 + luminance * 0.035})`;
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([3, 9]);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 5. The 12 O'Clock North Meridian Line (Angular Trigger)
    this.renderMeridian(cx, cy, maxOrbitRadius, accentHue, luminance, fog);

    // 6. Stereo Balance Axis Indicator (when Core is offset or dragged)
    if (this.isDraggingCore || Math.abs(state.coreOffset.x) > 0.03 || this.isHoveringCore) {
      this.renderStereoBalanceTether(cx, cy, accentHue);
    }

    // 7. Elliptical Orbital Paths & Viscous Motion Trails for Each Satellite
    for (const sat of state.satellites) {
      this.renderSatelliteOrbitAndTrail(
        sat,
        cx,
        cy,
        maxOrbitRadius,
        primaryHue,
        accentHue,
        luminance,
        fog,
        viscosity
      );
    }

    // 8. Meridian Trigger Ripples & Note Telemetry
    this.renderTriggerRipples();

    // 9. Dissolve Particle Bursts
    this.renderDissolveBursts();

    // 9b. Serendipity Event A & C: Rubato Arpeggio Comets & Ghost-Echo Shimmer Halos
    this.renderSerendipityPhenomena(luminance);

    // 10. The Central Attractor (The Core — synchronized with Layer A 0.05-0.15Hz Breathing LFO)
    this.renderCentralCore(cx, cy, primaryHue, accentHue, luminance, fog, timeSec);

    // 11. Harmonic Satellite Nodes & Interactive Tooltips
    for (const sat of state.satellites) {
      this.renderSatelliteNode(
        sat,
        cx,
        cy,
        maxOrbitRadius,
        timeSec,
        accentHue,
        luminance,
        fog,
        nostalgia
      );
    }

    // 12. Clinical Tool 3: Bilateral Stimulation (EMDR) Horizontal Visual Glow & Tracking Orb
    const bilateralPan = this.audioEngine.getBilateralPanPosition(timeSec);
    if (bilateralPan !== null) {
      this.renderBilateralVisualGrounding(bilateralPan, cy, accentHue);
    }

    // 13. Atmospheric Fog Radial Haze Overlay
    if (fog > 0.02) {
      const fogGrad = this.ctx.createRadialGradient(
        cx,
        cy,
        maxOrbitRadius * 0.15,
        cx,
        cy,
        maxOrbitRadius * 1.25
      );
      fogGrad.addColorStop(0, `hsla(${primaryHue}, 35%, 18%, ${fog * 0.16})`);
      fogGrad.addColorStop(0.6, `hsla(${primaryHue - 12}, 30%, 10%, ${fog * 0.28})`);
      fogGrad.addColorStop(1, `rgba(7, 9, 14, ${fog * 0.42})`);
      this.ctx.fillStyle = fogGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 14. Nostalgia Warm Sepia Vignette & Procedural Film Grain
    if (nostalgia > 0.02) {
      this.renderNostalgiaAtmosphere(nostalgia, timeSec);
    }

    // 15. Subtle Canvas Guidance Watermark (bottom-left above dock)
    this.renderCanvasLegend(state.satellites.length);
  }

  /**
   * Renders the Bilateral Grounding (EMDR) visual field:
   * - Smoothly oscillating left/right edge luminescence pillars
   * - Soft horizontal eye-tracking beacon synchronized with the StereoPannerNode
   */
  private renderBilateralVisualGrounding(
    pan: number,
    cy: number,
    accentHue: number
  ): void {
    const state = store.getState();
    const rightMargin =
      state.mode === 'practitioner' && !state.practitioner.isDockCollapsed ? 360 : 0;
    const activeViewportWidth = this.width - rightMargin;

    const leftIntensity = Math.max(0, -pan);
    const rightIntensity = Math.max(0, pan);

    this.ctx.save();

    // Left Edge Bilateral Glow
    if (leftIntensity > 0.01) {
      const leftGrad = this.ctx.createRadialGradient(
        0,
        cy,
        10,
        0,
        cy,
        260 + leftIntensity * 120
      );
      leftGrad.addColorStop(0, `hsla(192, 92%, 72%, ${leftIntensity * 0.42})`);
      leftGrad.addColorStop(0.5, `hsla(${accentHue}, 85%, 60%, ${leftIntensity * 0.18})`);
      leftGrad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      this.ctx.fillStyle = leftGrad;
      this.ctx.fillRect(0, 0, activeViewportWidth * 0.5, this.height);
    }

    // Right Edge Bilateral Glow
    if (rightIntensity > 0.01) {
      const rightEdgeX = activeViewportWidth;
      const rightGrad = this.ctx.createRadialGradient(
        rightEdgeX,
        cy,
        10,
        rightEdgeX,
        cy,
        260 + rightIntensity * 120
      );
      rightGrad.addColorStop(0, `hsla(192, 92%, 72%, ${rightIntensity * 0.42})`);
      rightGrad.addColorStop(0.5, `hsla(${accentHue}, 85%, 60%, ${rightIntensity * 0.18})`);
      rightGrad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      this.ctx.fillStyle = rightGrad;
      this.ctx.fillRect(activeViewportWidth * 0.5, 0, activeViewportWidth * 0.5, this.height);
    }

    // Gentle Horizontal Bilateral Tracking Beacon
    const trackPadding = 64;
    const trackWidth = Math.max(240, activeViewportWidth - trackPadding * 2);
    const orbX = trackPadding + ((pan + 1) * 0.5) * trackWidth;
    const orbY = cy;

    const orbGlow = this.ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, 44);
    orbGlow.addColorStop(0, 'rgba(165, 243, 252, 0.85)');
    orbGlow.addColorStop(0.35, 'rgba(56, 189, 248, 0.35)');
    orbGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');

    this.ctx.fillStyle = orbGlow;
    this.ctx.beginPath();
    this.ctx.arc(orbX, orbY, 44, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.beginPath();
    this.ctx.arc(orbX, orbY, 5.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderMeridian(
    cx: number,
    cy: number,
    maxOrbitRadius: number,
    accentHue: number,
    luminance: number,
    fog: number
  ): void {
    const topY = cy - maxOrbitRadius * 1.02;
    const bottomY = cy - 28;

    this.ctx.save();
    const glowWidth = 10 + fog * 22 + this.meridianFlash * 18;
    const glowGrad = this.ctx.createLinearGradient(cx, bottomY, cx, topY);
    const baseAlpha = 0.18 + luminance * 0.16 + this.meridianFlash * 0.35;
    glowGrad.addColorStop(0, `hsla(${accentHue}, 85%, 70%, ${baseAlpha * 0.25})`);
    glowGrad.addColorStop(0.5, `hsla(${accentHue}, 90%, 75%, ${baseAlpha})`);
    glowGrad.addColorStop(1, `hsla(${accentHue}, 85%, 70%, 0.02)`);

    this.ctx.strokeStyle = glowGrad;
    this.ctx.lineWidth = glowWidth;
    this.ctx.lineCap = 'round';
    this.ctx.filter = `blur(${4 + fog * 8}px)`;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, bottomY);
    this.ctx.lineTo(cx, topY);
    this.ctx.stroke();

    this.ctx.filter = 'none';
    const coreGrad = this.ctx.createLinearGradient(cx, bottomY, cx, topY);
    coreGrad.addColorStop(0, `hsla(${accentHue}, 80%, 82%, 0.15)`);
    coreGrad.addColorStop(
      0.5,
      `hsla(${accentHue}, 95%, 88%, ${0.42 + this.meridianFlash * 0.5})`
    );
    coreGrad.addColorStop(1, `hsla(${accentHue}, 80%, 82%, 0.08)`);

    this.ctx.strokeStyle = coreGrad;
    this.ctx.lineWidth = 1.4;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, bottomY);
    this.ctx.lineTo(cx, topY);
    this.ctx.stroke();

    this.ctx.fillStyle = `hsla(${accentHue}, 60%, 82%, ${0.45 + this.meridianFlash * 0.4})`;
    this.ctx.font = '500 10px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MERIDIAN · XII', cx, topY - 10);
    this.ctx.restore();
  }

  private renderStereoBalanceTether(cx: number, cy: number, accentHue: number): void {
    const state = store.getState();
    const practitionerShiftX =
      state.mode === 'practitioner' && !state.practitioner.isDockCollapsed
        ? -Math.min(140, this.width * 0.09)
        : 0;
    const baseCx = this.width * 0.5 + practitionerShiftX;
    const usableHeight = this.height - 130;
    const baseCy = Math.max(220, usableHeight * 0.5 + 18);

    this.ctx.save();
    this.ctx.strokeStyle = `hsla(${accentHue}, 75%, 72%, 0.32)`;
    this.ctx.setLineDash([4, 4]);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(baseCx - 160, baseCy);
    this.ctx.lineTo(baseCx + 160, baseCy);
    this.ctx.stroke();

    const panPct = Math.round(state.coreOffset.x * 100);
    const panText =
      Math.abs(panPct) <= 2
        ? 'STEREO CENTER'
        : panPct < 0
          ? `STEREO BALANCE · ${Math.abs(panPct)}% L`
          : `STEREO BALANCE · ${panPct}% R`;

    this.ctx.fillStyle = `hsla(${accentHue}, 85%, 82%, 0.8)`;
    this.ctx.font = '500 10px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(panText, cx, cy + 54);
    this.ctx.restore();
  }

  private renderSatelliteOrbitAndTrail(
    sat: SatelliteNode,
    cx: number,
    cy: number,
    maxOrbitRadius: number,
    primaryHue: number,
    accentHue: number,
    luminance: number,
    fog: number,
    viscosity: number
  ): void {
    const isHoveredOrDragged =
      sat.id === this.hoveredSatelliteId || sat.id === this.draggingSatelliteId;

    this.ctx.save();
    this.ctx.beginPath();
    const steps = 90;
    const a = sat.semiMajorAxis;
    const e = sat.eccentricity;
    const omega = sat.argumentOfPeriapsis;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const rNorm = (a * (1 - e * e)) / (1 + e * Math.cos(theta - omega));
      const rPx = rNorm * maxOrbitRadius;
      const ox = cx + Math.cos(theta) * rPx;
      const oy = cy + Math.sin(theta) * rPx;
      if (i === 0) {
        this.ctx.moveTo(ox, oy);
      } else {
        this.ctx.lineTo(ox, oy);
      }
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = isHoveredOrDragged
      ? `hsla(${accentHue}, 85%, 75%, 0.42)`
      : `hsla(${primaryHue}, 50%, 68%, ${0.09 + luminance * 0.08})`;
    this.ctx.lineWidth = isHoveredOrDragged ? 1.4 : 0.9;
    this.ctx.stroke();
    this.ctx.restore();

    const trail = this.trails.get(sat.id);
    if (trail && trail.length > 2) {
      this.ctx.save();
      if (fog > 0.35) {
        this.ctx.filter = `blur(${fog * 3.5}px)`;
      }
      for (let i = 1; i < trail.length; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const progress = i / trail.length;
        const alpha = progress * progress * (0.24 + viscosity * 0.52);

        this.ctx.strokeStyle = `hsla(${accentHue}, 85%, ${66 + luminance * 20}%, ${alpha})`;
        this.ctx.lineWidth = 1.0 + progress * (2.5 + viscosity * 2.5);
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(prev.x, prev.y);
        this.ctx.lineTo(curr.x, curr.y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  private renderCentralCore(
    cx: number,
    cy: number,
    primaryHue: number,
    accentHue: number,
    luminance: number,
    fog: number,
    timeSec: number
  ): void {
    const state = store.getState();
    const breath = this.audioEngine.getBreathingModulation(timeSec);
    const somaticBoost =
      state.mode === 'practitioner' ? state.practitioner.somaticSubBassLevel * 4.5 : 0;
    const coreRadius = 20 + breath * 7.0 + somaticBoost;
    const bloomRadius = 76 + fog * 68 + breath * 24 + somaticBoost * 5;

    this.ctx.save();

    const outerGrad = this.ctx.createRadialGradient(cx, cy, coreRadius * 0.25, cx, cy, bloomRadius);
    outerGrad.addColorStop(
      0,
      `hsla(${accentHue}, 92%, ${68 + luminance * 22}%, ${0.55 + luminance * 0.25})`
    );
    outerGrad.addColorStop(
      0.35,
      `hsla(${primaryHue}, 80%, ${52 + luminance * 20}%, ${0.28 + fog * 0.2})`
    );
    outerGrad.addColorStop(1, 'rgba(7, 9, 14, 0)');

    this.ctx.fillStyle = outerGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, bloomRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Resonant Concentric Corona Rings
    const ringCount =
      state.mode === 'practitioner' && state.practitioner.binauralThetaEnabled ? 3 : 2;
    for (let ring = 1; ring <= ringCount; ring++) {
      const ringR = coreRadius + ring * 11 + breath * (ring * 4);
      this.ctx.strokeStyle = `hsla(${accentHue}, 85%, 78%, ${0.24 / ring})`;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    const nucleusGrad = this.ctx.createRadialGradient(
      cx - 4,
      cy - 4,
      2,
      cx,
      cy,
      coreRadius
    );
    nucleusGrad.addColorStop(0, '#ffffff');
    nucleusGrad.addColorStop(0.45, `hsl(${accentHue}, 90%, ${74 + luminance * 16}%)`);
    nucleusGrad.addColorStop(1, `hsla(${primaryHue}, 85%, 48%, 0.85)`);

    this.ctx.fillStyle = nucleusGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // If a Serendipity "Modal Breeze" (IV or VI root shift) is active, display a subtle glowing badge
    if (state.modalRootOverride && state.modalRootDegree) {
      this.ctx.font = '500 10px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `hsla(${(accentHue + 38) % 360}, 92%, 85%, ${0.65 + breath * 0.25})`;
      this.ctx.fillText(
        `MODAL BREEZE · ${state.modalRootDegree} (${state.modalRootOverride})`,
        cx,
        cy + coreRadius + 24
      );
    }

    this.ctx.restore();
  }

  private renderSatelliteNode(
    sat: SatelliteNode,
    cx: number,
    cy: number,
    maxOrbitRadius: number,
    timeSec: number,
    accentHue: number,
    luminance: number,
    fog: number,
    nostalgia: number
  ): void {
    const pos = this.getSatelliteScreenPosition(
      sat,
      cx,
      cy,
      maxOrbitRadius,
      timeSec,
      nostalgia
    );

    const sinceTriggerMs = performance.now() - sat.lastTriggeredAt;
    const rawPulse =
      sinceTriggerMs >= 0 && sinceTriggerMs < 950
        ? Math.pow(1 - sinceTriggerMs / 950, 2)
        : 0;

    const isSilencedFlash = Boolean(sat.lastTriggerSilenced);
    const triggerPulse = isSilencedFlash ? rawPulse * 0.35 : rawPulse;

    const baseRadius = 5.5 + (5 - sat.octave) * 1.3;
    const nodeRadius = baseRadius + triggerPulse * 4.5;
    const satHue = (accentHue + (sat.octave - 2) * 16) % 360;

    this.ctx.save();

    const meridianDist = Math.abs(sat.angle - -Math.PI / 2);
    if (meridianDist < 0.25) {
      const proximity = 1 - meridianDist / 0.25;
      this.ctx.strokeStyle = `hsla(${satHue}, 95%, 80%, ${proximity * 0.45})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.lineTo(cx, cy - pos.rPx);
      this.ctx.stroke();
    }

    const haloRadius = nodeRadius * (2.8 + fog * 2.4 + triggerPulse * 2.5);
    const haloGrad = this.ctx.createRadialGradient(
      pos.x,
      pos.y,
      nodeRadius * 0.4,
      pos.x,
      pos.y,
      haloRadius
    );
    const haloAlpha = isSilencedFlash && rawPulse > 0.1 ? 0.32 : 0.65 + triggerPulse * 0.35;
    haloGrad.addColorStop(
      0,
      `hsla(${satHue}, ${isSilencedFlash ? 30 : 95}%, ${74 + luminance * 18}%, ${haloAlpha})`
    );
    haloGrad.addColorStop(1, `hsla(${satHue}, 90%, 60%, 0)`);

    this.ctx.fillStyle = haloGrad;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
    this.ctx.fill();

    if (isSilencedFlash && rawPulse > 0.15) {
      this.ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
    } else if (triggerPulse > 0.2) {
      this.ctx.fillStyle = '#ffffff';
    } else {
      this.ctx.fillStyle = `hsl(${satHue}, 92%, ${78 + luminance * 16}%)`;
    }
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.longPressTargetId === sat.id) {
      const progress = Math.min(
        1,
        (performance.now() - this.longPressStartTime) / this.LONG_PRESS_MS
      );
      this.ctx.strokeStyle = 'rgba(251, 113, 133, 0.92)';
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.arc(
        pos.x,
        pos.y,
        nodeRadius + 7,
        -Math.PI / 2,
        -Math.PI / 2 + progress * Math.PI * 2
      );
      this.ctx.stroke();
    }

    const isHovered = sat.id === this.hoveredSatelliteId;
    const isDragged = sat.id === this.draggingSatelliteId;
    if (isHovered || isDragged) {
      const state = store.getState();
      const { note, frequency, registerLabel } = resolveSatellitePitch(
        sat,
        state.activeSeedId,
        state.macros.luminance
      );
      const label = `${note} · ${Math.round(frequency)}Hz · ${registerLabel}`;

      this.ctx.font = '500 11px "JetBrains Mono", monospace';
      const textWidth = this.ctx.measureText(label).width;
      const boxX = pos.x - textWidth * 0.5 - 8;
      const boxY = pos.y - nodeRadius - 30;

      this.ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
      this.ctx.strokeStyle = `hsla(${satHue}, 80%, 72%, 0.45)`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(boxX, boxY, textWidth + 16, 20, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#f1f5f9';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(label, pos.x, boxY + 13.5);
    }

    this.ctx.restore();
  }

  private renderTriggerRipples(): void {
    this.ctx.save();
    for (const r of this.ripples) {
      this.ctx.strokeStyle = r.silenced
        ? `rgba(148, 163, 184, ${r.alpha * 0.45})`
        : `hsla(${r.hue}, 92%, 78%, ${r.alpha})`;
      this.ctx.lineWidth = r.silenced ? 1 : 1.8;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = r.silenced
        ? `rgba(148, 163, 184, ${r.alpha * 0.7})`
        : `hsla(${r.hue}, 95%, 88%, ${r.alpha})`;
      this.ctx.font = '500 10px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      const floatOffset = (r.radius - 8) * 0.42;
      this.ctx.fillText(
        r.silenced ? `${r.noteLabel} · silence` : r.noteLabel,
        r.x,
        r.y - 12 - floatOffset
      );
    }
    this.ctx.restore();
  }

  private renderDissolveBursts(): void {
    this.ctx.save();
    for (const b of this.dissolveBursts) {
      this.ctx.fillStyle = `hsla(${b.hue}, 85%, 78%, ${b.alpha})`;
      for (const p of b.particles) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * b.alpha, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * Math.max(0, Math.min(1, t))) - 1) * 0.5;
  }

  /**
   * Spawns the corresponding Ephemeral Visual Phenomenon when SerendipityEngine fires an event:
   * - 'rubato-arpeggio' -> Delicate comet / shooting star gliding across the outer arc & pulsing per note
   * - 'modal-breeze'    -> Slow aurora-like color ripple expanding outward from the Central Core
   * - 'ghost-echo'      -> Crystalline high-octave shimmer halo in the upper canopy
   */
  private handleSerendipityVisualEvent(payload: SerendipityEventPayload): void {
    const state = store.getState();
    const { maxOrbitRadius } = this.getCoreScreenCenter();
    const accentHue = this.computeAccentHue(state.macros.luminance);

    if (payload.kind === 'rubato-arpeggio') {
      const direction = Math.random() < 0.5 ? 1 : -1;
      const baseStart = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.1;
      const arcSpan = (0.75 + Math.random() * 0.45) * direction;
      const firstNote = payload.notes[0] ?? '';

      this.serendipityComets.push({
        id: payload.id,
        createdAt: performance.now(),
        durationMs: payload.durationMs,
        startAngle: baseStart - arcSpan * 0.5,
        endAngle: baseStart + arcSpan * 0.5,
        radiusNormStart: 0.92 + Math.random() * 0.1,
        radiusNormEnd: 0.84 + Math.random() * 0.12,
        notes: payload.notes,
        stepOffsetsMs: payload.stepOffsetsMs ?? [0],
        triggeredStepIndex: 0,
        notePulse: 1.0,
        activeNoteLabel: firstNote,
        hue: (accentHue + 28) % 360,
        tail: [],
        sparks: [],
      });
      return;
    }

    if (payload.kind === 'modal-breeze') {
      this.modalAuroras.push({
        id: payload.id,
        createdAt: performance.now(),
        durationMs: payload.durationMs,
        radius: 26,
        maxRadius: maxOrbitRadius * 1.38,
        alpha: 0.85,
        degreeLabel: payload.modalDegree ?? 'IV',
        rootLabel: payload.notes[0] ?? '',
        hueShift: payload.modalDegree === 'IV' ? 36 : -34,
      });
      return;
    }

    if (payload.kind === 'ghost-echo') {
      this.ghostHalos.push({
        id: payload.id,
        xNorm: 0.28 + Math.random() * 0.44,
        yNorm: 0.16 + Math.random() * 0.22,
        radius: 14,
        maxRadius: 110 + state.macros.fog * 65,
        alpha: 0.78,
        label: payload.notes.join(' · '),
        hue: (accentHue + 18) % 360,
      });
    }
  }

  /**
   * Renders Serendipity Event B: Slow, aurora-like color ripples expanding outward
   * from the Central Core across the background fog.
   */
  private renderModalAuroraRipples(
    cx: number,
    cy: number,
    primaryHue: number,
    accentHue: number,
    luminance: number
  ): void {
    if (this.modalAuroras.length === 0) return;

    this.ctx.save();
    for (const aurora of this.modalAuroras) {
      const innerR = Math.max(8, aurora.radius * 0.35);
      const outerR = Math.max(innerR + 20, aurora.radius);
      const auroraHue1 = (accentHue + aurora.hueShift + 360) % 360;
      const auroraHue2 = (primaryHue - aurora.hueShift + 360) % 360;

      const grad = this.ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      grad.addColorStop(0, 'rgba(7, 9, 14, 0)');
      grad.addColorStop(
        0.45,
        `hsla(${auroraHue1}, 85%, ${55 + luminance * 20}%, ${aurora.alpha * 0.24})`
      );
      grad.addColorStop(
        0.75,
        `hsla(${auroraHue2}, 80%, ${62 + luminance * 18}%, ${aurora.alpha * 0.32})`
      );
      grad.addColorStop(1, 'rgba(7, 9, 14, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      this.ctx.fill();

      // Delicate iridescent aurora crest ring
      this.ctx.strokeStyle = `hsla(${auroraHue1}, 90%, 78%, ${aurora.alpha * 0.38})`;
      this.ctx.lineWidth = 2.0;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, aurora.radius * 0.74, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  /**
   * Renders Serendipity Event A (Rubato Arpeggio Comets) and Event C (Ghost-Echo Shimmer Halos).
   */
  private renderSerendipityPhenomena(luminance: number): void {
    this.ctx.save();

    // 1. Render Ghost-Echo Shimmer Halos (Event C)
    for (const halo of this.ghostHalos) {
      const hx = halo.xNorm * this.width;
      const hy = halo.yNorm * this.height;
      const grad = this.ctx.createRadialGradient(hx, hy, 2, hx, hy, halo.radius);
      grad.addColorStop(
        0,
        `hsla(${halo.hue}, 95%, ${82 + luminance * 14}%, ${halo.alpha * 0.52})`
      );
      grad.addColorStop(
        0.5,
        `hsla(${(halo.hue + 24) % 360}, 85%, 72%, ${halo.alpha * 0.22})`
      );
      grad.addColorStop(1, 'rgba(7, 9, 14, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, halo.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = `hsla(${halo.hue}, 92%, 86%, ${halo.alpha * 0.45})`;
      this.ctx.lineWidth = 1.1;
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, halo.radius * 0.58, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = `hsla(${halo.hue}, 90%, 88%, ${halo.alpha * 0.75})`;
      this.ctx.font = '500 9.5px "JetBrains Mono", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`✧ ${halo.label}`, hx, hy - halo.radius * 0.58 - 7);
    }

    // 2. Render Rubato Arpeggio Comets / Shooting Stars (Event A)
    const now = performance.now();
    for (const comet of this.serendipityComets) {
      const elapsed = now - comet.createdAt;
      const fadeIn = Math.min(1, elapsed / 320);
      const fadeOut = Math.max(0, 1 - Math.max(0, elapsed - comet.durationMs) / 900);
      const envelopeAlpha = fadeIn * fadeOut;
      if (envelopeAlpha <= 0.01 || comet.tail.length === 0) continue;

      // Glowing comet tail segments
      for (let i = 1; i < comet.tail.length; i++) {
        const p0 = comet.tail[i - 1];
        const p1 = comet.tail[i];
        const frac = i / comet.tail.length;
        const segAlpha = frac * frac * envelopeAlpha * (0.55 + comet.notePulse * 0.35);

        this.ctx.strokeStyle = `hsla(${comet.hue}, 95%, ${76 + luminance * 18}%, ${segAlpha})`;
        this.ctx.lineWidth = 0.8 + frac * (3.2 + comet.notePulse * 2.2);
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(p0.x, p0.y);
        this.ctx.lineTo(p1.x, p1.y);
        this.ctx.stroke();
      }

      // Comet head pulsing softly on each arpeggio note
      const head = comet.tail[comet.tail.length - 1];
      const headRadius = 3.2 + comet.notePulse * 4.2;
      const haloRadius = 16 + comet.notePulse * 24;

      const headGlow = this.ctx.createRadialGradient(
        head.x,
        head.y,
        1,
        head.x,
        head.y,
        haloRadius
      );
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${envelopeAlpha * 0.95})`);
      headGlow.addColorStop(
        0.35,
        `hsla(${comet.hue}, 95%, 80%, ${envelopeAlpha * (0.55 + comet.notePulse * 0.35)})`
      );
      headGlow.addColorStop(1, 'rgba(7, 9, 14, 0)');

      this.ctx.fillStyle = headGlow;
      this.ctx.beginPath();
      this.ctx.arc(head.x, head.y, haloRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // Stardust sparks & note labels shed at each arpeggio note pulse
      for (const sp of comet.sparks) {
        this.ctx.fillStyle = `hsla(${comet.hue}, 95%, 88%, ${sp.alpha * envelopeAlpha})`;
        this.ctx.beginPath();
        this.ctx.arc(sp.x, sp.y, 1.6, 0, Math.PI * 2);
        this.ctx.fill();

        if (sp.noteLabel) {
          this.ctx.font = '500 9.5px "JetBrains Mono", monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(sp.noteLabel, sp.x, sp.y - 8);
        }
      }
    }

    this.ctx.restore();
  }

  private renderNostalgiaAtmosphere(nostalgia: number, timeSec: number): void {
    this.ctx.save();

    const outerRadius = Math.hypot(this.width * 0.5, this.height * 0.5);
    const vigGrad = this.ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      outerRadius * 0.35,
      this.width * 0.5,
      this.height * 0.5,
      outerRadius
    );
    vigGrad.addColorStop(0, 'rgba(42, 28, 14, 0)');
    vigGrad.addColorStop(0.65, `rgba(38, 24, 12, ${nostalgia * 0.22})`);
    vigGrad.addColorStop(1, `rgba(18, 11, 5, ${nostalgia * 0.62})`);

    this.ctx.fillStyle = vigGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const pattern = this.ctx.createPattern(this.grainCanvas, 'repeat');
    if (pattern) {
      const shiftX = Math.floor((timeSec * 97) % this.grainCanvas.width);
      const shiftY = Math.floor((timeSec * 73) % this.grainCanvas.height);
      this.ctx.translate(shiftX, shiftY);
      this.ctx.globalAlpha = nostalgia * 0.38;
      this.ctx.fillStyle = pattern;
      this.ctx.fillRect(
        -shiftX,
        -shiftY,
        this.width + this.grainCanvas.width,
        this.height + this.grainCanvas.height
      );
    }

    this.ctx.restore();
  }

  private renderCanvasLegend(satelliteCount: number): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.46)';
    this.ctx.font = '400 11px Inter, sans-serif';
    this.ctx.textAlign = 'left';
    const legendY = this.height - 152;
    this.ctx.fillText(
      `Click space to spawn satellite (${satelliteCount}/${MAX_SATELLITES})  ·  Drag node: Inner (Oct 4-5) ↔ Mid (Oct 3-4) ↔ Outer (Oct 2-3)  ·  Right-click or hold node to dissolve`,
      24,
      legendY
    );
    this.ctx.restore();
  }
}
