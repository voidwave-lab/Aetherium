// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Aetherium — Generative Ambient Soundscape & Receptive Music Therapy Sanctuary
 * Copyright (C) 2026 Voidwave Lab
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

import { store } from '../state/store';
import { renderMeridianEclipseEmblem } from './AppEmblem';

type AboutTabId = 'all' | 'commons' | 'transparency' | 'opensource' | 'bibliography' | 'license';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_IPC__' in window;
}

export class AboutModal {
  private root: HTMLElement;
  private activeTab: AboutTabId = 'all';

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'aetherium-about-ethics-modal';
    container.appendChild(this.root);

    this.render();
    this.bindEvents();

    store.subscribe((state) => {
      this.updateVisibility(state.isAboutOpen);
    });
  }

  private render(): void {
    this.root.className =
      'fixed inset-0 z-[60] hidden items-center justify-center p-4 md:p-6 bg-[#07090e]/85 backdrop-blur-xl transition-opacity duration-300';

    this.root.innerHTML = `
      <div
        class="glass-panel relative max-w-4xl w-full max-h-[88vh] rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <!-- Top Ambient Glow -->
        <div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-48 rounded-full bg-indigo-500/15 blur-3xl"></div>

        <!-- Modal Header -->
        <div class="relative px-6 py-4 border-b border-slate-800/85 flex items-center justify-between gap-4 bg-slate-950/50">
          <div class="flex items-center gap-3.5">
            ${renderMeridianEclipseEmblem('w-9 h-9 rounded-xl shadow-[0_0_18px_rgba(34,211,238,0.3)]')}
            <div>
              <div class="flex items-center gap-2">
                <h2 id="about-modal-title" class="text-sm md:text-base font-semibold tracking-wide text-slate-100">
                  About, Ethical AI Attribution, Open-Source Credits &amp; Academic Bibliography
                </h2>
                <span class="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  GPL-3.0-or-later
                </span>
              </div>
              <p class="text-[11px] font-mono text-slate-400 mt-0.5">
                100% Offline Sanctuary · Zero Telemetry · Zero External Audio Samples · Returned to the Commons
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-about-modal"
            title="Close Ethics, Credits & Bibliography (ESC)"
            class="px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 transition-colors shrink-0"
          >
            ✕ Close
          </button>
        </div>

        <!-- Quick Section Filter Tabs -->
        <div class="relative px-6 py-2.5 border-b border-slate-800/75 bg-slate-950/35 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <button type="button" data-about-tab="all" class="px-3 py-1 rounded-full transition-colors">
            All Sections
          </button>
          <button type="button" data-about-tab="commons" class="px-3 py-1 rounded-full transition-colors">
            A. Commons &amp; Ethical AI
          </button>
          <button type="button" data-about-tab="transparency" class="px-3 py-1 rounded-full transition-colors">
            Zero-Profit &amp; Transparency
          </button>
          <button type="button" data-about-tab="opensource" class="px-3 py-1 rounded-full transition-colors">
            B. Open-Source Ecosystem
          </button>
          <button type="button" data-about-tab="bibliography" class="px-3 py-1 rounded-full transition-colors">
            C. Academic Bibliography
          </button>
          <button type="button" data-about-tab="license" class="px-3 py-1 rounded-full transition-colors">
            D &amp; E. Clinical Notice &amp; GPLv3
          </button>
        </div>

        <!-- Scrollable Content Body -->
        <div class="relative flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs md:text-sm text-slate-300 leading-relaxed">

          <!-- =================================================================== -->
          <!-- SECTION A: THE COMMONS PHILOSOPHY & ETHICAL AI ATTRIBUTION          -->
          <!-- =================================================================== -->
          <section data-about-section="commons" class="rounded-2xl p-5 bg-slate-900/60 border border-indigo-500/25 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-200">
                A. The Commons Philosophy &amp; Ethical AI Attribution
              </h3>
              <span class="text-[10px] font-mono text-indigo-300/80 uppercase">Human Vision · Shared Knowledge</span>
            </div>
            <p class="text-slate-300">
              While the artistic direction, non-linear Keplerian orbital concept, psychoacoustic mapping, and receptive music therapy workflows of <strong>Aetherium</strong> were human-conceived, its engineering implementation was accelerated with AI assistance trained on the collective work of thousands of open-source developers, mathematicians, music theorists, and audio DSP engineers.
            </p>
            <p class="text-slate-300">
              Because this sanctuary stands on the shoulders of decades of shared human scholarship and open-source code, releasing Aetherium under the strict copyleft <strong>GNU General Public License v3.0 (GPL-3.0-or-later)</strong> is our moral commitment to return this work to the commons—ensuring <strong>100% offline privacy</strong>, <strong>zero telemetry</strong>, <strong>zero subscriptions</strong>, and permanent immunity to proprietary enclosure.
            </p>
          </section>

          <!-- =================================================================== -->
          <!-- ZERO-PROFIT & RADICAL TRANSPARENCY PLEDGE (VOIDWAVE-LAB)            -->
          <!-- =================================================================== -->
          <section data-about-section="transparency" class="rounded-2xl p-5 bg-slate-900/60 border border-emerald-500/30 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Zero-Profit &amp; Radical Financial Transparency Pledge (voidwave-lab)
              </h3>
              <span class="text-[10px] font-mono text-emerald-300/85 uppercase">100% Surplus Donated Forward</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="rounded-xl p-3.5 bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div class="font-semibold text-emerald-300">1. The Zero-Profit Pledge</div>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Aetherium</strong> (Desktop &amp; Pocket) is 100% free and libre forever. There are zero ads, zero subscriptions, zero locked seeds, and <strong>$0.00 personal profit</strong> taken by <code>voidwave-lab</code>.
                </p>
              </div>

              <div class="rounded-xl p-3.5 bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div class="font-semibold text-sky-300">2. Community Support &amp; Annual Audit</div>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  Optional community contributions strictly cover mandatory distribution infrastructure (such as the <strong>$99/year Apple Developer Program fee</strong> for iOS App Store &amp; TestFlight signing). <strong>100% of surplus funds</strong> are audited annually in <code>TRANSPARENCY.md</code> and donated forward to mental health non-profits and open-source foundations.
                </p>
              </div>

              <div class="rounded-xl p-3.5 bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div class="font-semibold text-indigo-300">3. GPLv3 App Store Exception</div>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  Under <strong>GPLv3 Section 7</strong>, <code>voidwave-lab</code> grants explicit additional permission in <code>LICENSE</code> to distribute compiled binaries of Aetherium via the Apple App Store, TestFlight, Google Play, and F-Droid while keeping the full source code strictly copyleft.
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href="https://patreon.com/voidwavelab"
                data-external-link="https://patreon.com/voidwavelab"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-mono text-[11px] transition-all inline-flex items-center gap-2"
              >
                <span>♥ Community Infrastructure Support</span>
                <span class="opacity-80">patreon.com/voidwavelab ↗</span>
              </a>

              <a
                href="https://github.com/voidwave-lab/Aetherium/blob/main/TRANSPARENCY.md"
                data-external-link="https://github.com/voidwave-lab/Aetherium/blob/main/TRANSPARENCY.md"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 font-mono text-[11px] transition-all inline-flex items-center gap-2"
              >
                <span>Inspect Public Audit Ledger (TRANSPARENCY.md) ↗</span>
              </a>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- SECTION B: OPEN-SOURCE ECOSYSTEM & DIRECT REPOSITORY LINKS          -->
          <!-- =================================================================== -->
          <section data-about-section="opensource" class="rounded-2xl p-5 bg-slate-900/60 border border-cyan-500/25 space-y-3.5">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">
                B. Open-Source Ecosystem &amp; Direct Repository Links
              </h3>
              <span class="text-[10px] font-mono text-cyan-300/80 uppercase">Standing on Open Giants</span>
            </div>
            <p class="text-xs text-slate-400">
              Deep gratitude to the maintainers and contributors of the open-source projects that make Aetherium possible:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <a
                href="https://github.com/tauri-apps/tauri"
                data-external-link="https://github.com/tauri-apps/tauri"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">Tauri</span>
                  <span class="font-mono text-[10px] text-cyan-400">github.com/tauri-apps/tauri ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Rust-based cross-platform native desktop application framework with minimal memory &amp; binary footprint.
                </span>
              </a>

              <a
                href="https://github.com/Tonejs/Tone.js"
                data-external-link="https://github.com/Tonejs/Tone.js"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">Tone.js</span>
                  <span class="font-mono text-[10px] text-cyan-400">github.com/Tonejs/Tone.js ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Web Audio framework for interactive music, polyphonic FM/AM synthesis, and procedural DSP in the browser.
                </span>
              </a>

              <a
                href="https://github.com/tonaljs/tonal"
                data-external-link="https://github.com/tonaljs/tonal"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">Tonal</span>
                  <span class="font-mono text-[10px] text-cyan-400">github.com/tonaljs/tonal ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Functional music theory library for harmonic scales, modal pitch quantization, and chord voicings.
                </span>
              </a>

              <a
                href="https://github.com/vitejs/vite"
                data-external-link="https://github.com/vitejs/vite"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">Vite</span>
                  <span class="font-mono text-[10px] text-cyan-400">github.com/vitejs/vite ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Next-generation frontend build tooling and instantaneous module bundling.
                </span>
              </a>

              <a
                href="https://github.com/microsoft/TypeScript"
                data-external-link="https://github.com/microsoft/TypeScript"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">TypeScript</span>
                  <span class="font-mono text-[10px] text-cyan-400">github.com/microsoft/TypeScript ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Strict static type safety for deterministic real-time audio scheduling and orbital physics.
                </span>
              </a>

              <a
                href="https://www.rust-lang.org"
                data-external-link="https://www.rust-lang.org"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl p-3 bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/45 transition-all flex flex-col justify-between gap-1 group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-100 group-hover:text-cyan-300">Rust Language &amp; Ecosystem</span>
                  <span class="font-mono text-[10px] text-cyan-400">rust-lang.org ↗</span>
                </div>
                <span class="text-slate-400 text-[11px]">
                  Memory-safe systems programming foundation powering Aetherium's native OS shell and file persistence.
                </span>
              </a>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- SECTION C: FOUNDATIONAL BIBLIOGRAPHY (DSP, AMBIENT & CLINICAL)      -->
          <!-- =================================================================== -->
          <section data-about-section="bibliography" class="rounded-2xl p-5 bg-slate-900/60 border border-amber-400/25 space-y-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-amber-200">
                C. Foundational Bibliography (DSP, Generative Music &amp; Psychoacoustics)
              </h3>
              <span class="text-[10px] font-mono text-amber-300/80 uppercase">Theoretical Pillars</span>
            </div>

            <!-- 1. DSP & Physical Modeling Synthesis -->
            <div class="space-y-2">
              <h4 class="text-xs font-mono uppercase tracking-wider text-indigo-300">
                1. Digital Signal Processing &amp; Physical Modeling Synthesis
              </h4>
              <ul class="space-y-2 text-xs text-slate-300 pl-3 border-l-2 border-indigo-500/40">
                <li>
                  <strong class="text-slate-100">Karplus, K., &amp; Strong, A. (1983).</strong>
                  &ldquo;Digital Synthesis of Plucked-String and Drum Timbres.&rdquo;
                  <em>Computer Music Journal</em>, 7(2), 43–55.
                  <span class="text-slate-400 block text-[11px]">
                    — Foundation for Aetherium's sympathetic plucked string and harp synthesis in <em>Bowed Glass &amp; Strings</em>.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Smith, J. O. (2010).</strong>
                  <em>Physical Audio Signal Processing: For Virtual Musical Instruments and Audio Effects.</em>
                  W3K Publishing / CCRMA Stanford.
                  <span class="text-slate-400 block text-[11px]">
                    — Foundation for waveguide delay networks, Euler-Bernoulli metallic modal resonance (<em>Singing Bowls</em>), and formant filter banks (<em>Cathedral Choir</em>).
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Farnell, A. (2010).</strong>
                  <em>Designing Sound.</em> MIT Press.
                  <span class="text-slate-400 block text-[11px]">
                    — Foundation for procedural soundscaping—synthesizing rain on felt, wind through pines, and vinyl micro-impulses purely from mathematical noise and filters without external audio samples.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Roads, C. (2001).</strong>
                  <em>Microsound.</em> MIT Press.
                  <span class="text-slate-400 block text-[11px]">
                    — Theoretical foundation for granular, stochastic, and cloud-based ambient micro-events.
                  </span>
                </li>
              </ul>
            </div>

            <!-- 2. Generative & Ambient Music Theory -->
            <div class="space-y-2 pt-1">
              <h4 class="text-xs font-mono uppercase tracking-wider text-amber-300">
                2. Generative &amp; Ambient Music Theory
              </h4>
              <ul class="space-y-2 text-xs text-slate-300 pl-3 border-l-2 border-amber-500/40">
                <li>
                  <strong class="text-slate-100">Eno, B. (1978).</strong>
                  <em>Ambient 1: Music for Airports</em> (Liner Notes &amp; Generative Music Manifesto).
                  <span class="text-slate-400 block text-[11px]">
                    — Defining ambient music as &ldquo;able to accommodate many levels of listening attention without enforcing one in particular; as ignorable as it is interesting.&rdquo;
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Basinski, W. (2002).</strong>
                  <em>The Disintegration Loops.</em>
                  <span class="text-slate-400 block text-[11px]">
                    — Conceptual inspiration for Aetherium's <em>Nostalgia</em> macro, analog tape wow &amp; flutter drift, and organic entropy mechanics (<em>Rarity</em>).
                  </span>
                </li>
              </ul>
            </div>

            <!-- 3. Receptive Music Therapy, ISO Principle & Clinical Psychoacoustics -->
            <div class="space-y-2 pt-1">
              <h4 class="text-xs font-mono uppercase tracking-wider text-emerald-300">
                3. Receptive Music Therapy, ISO Principle &amp; Clinical Psychoacoustics
              </h4>
              <ul class="space-y-2 text-xs text-slate-300 pl-3 border-l-2 border-emerald-500/40">
                <li>
                  <strong class="text-slate-100">Altshuler, I. M. (1948).</strong>
                  &ldquo;A Psychiatrist's Experience with Music as a Therapeutic Agent.&rdquo; In <em>Music and Medicine</em>.
                  <span class="text-slate-400 block text-[11px]">
                    — Origin of the clinical <strong>ISO Principle</strong>: matching a patient's initial affective/autonomic state before gradually vectoring toward parasympathetic regulation.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Grocke, D., &amp; Wigram, T. (2007).</strong>
                  <em>Receptive Methods in Music Therapy: Techniques and Clinical Applications for Music Therapy Clinicians, Educators and Students.</em>
                  Jessica Kingsley Publishers.
                  <span class="text-slate-400 block text-[11px]">
                    — Clinical methodology for receptive soundscaping, autonomic pacing, and session re-orientation.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Porges, S. W. (2011).</strong>
                  <em>The Polyvagal Theory: Neurophysiological Foundations of Emotions, Attachment, Communication, and Self-Regulation.</em>
                  W. W. Norton &amp; Company.
                  <span class="text-slate-400 block text-[11px]">
                    — Scientific basis for Aetherium's 1100 Hz <strong>Vocal-Range Acoustic Carving</strong> (preserving the prosodic human speech band) and vagal safety cues.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Shapiro, F. (2018).</strong>
                  <em>Eye Movement Desensitization and Reprocessing (EMDR) Therapy: Basic Principles, Protocols, and Procedures.</em>
                  Guilford Press.
                  <span class="text-slate-400 block text-[11px]">
                    — Clinical basis for Aetherium's 0.2–1.5 Hz <strong>Bilateral Auditory &amp; Visual Stimulation</strong> panner and Serendipity distraction guard.
                  </span>
                </li>
                <li>
                  <strong class="text-slate-100">Oster, G. (1973).</strong>
                  &ldquo;Auditory Beats in the Brain.&rdquo; <em>Scientific American</em>, 229(4), 94–102.
                  <span class="text-slate-400 block text-[11px]">
                    — Neuroacoustic foundation for low-frequency 6 Hz Theta binaural perceptual entrainment (100 Hz L / 106 Hz R).
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <!-- =================================================================== -->
          <!-- SECTION D & E: CLINICAL DISCLAIMER & FREE FOREVER GPLv3 GUARANTEE   -->
          <!-- =================================================================== -->
          <section data-about-section="license" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- D. Clinical & Therapeutic Disclaimer -->
            <div class="rounded-2xl p-4 bg-slate-900/60 border border-slate-700/60 space-y-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
                D. Clinical &amp; Therapeutic Disclaimer
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                <strong>Practitioner / Guide</strong> mode is a receptive music therapy and psychoacoustic co-regulation aid designed to support qualified mental health professionals, music therapists, and personal nervous-system self-regulation. It is <strong>not</strong> a medical device nor a substitute for professional medical diagnosis, psychotherapy, or psychiatric treatment.
              </p>
            </div>

            <!-- E. Free Forever Guarantee (GPLv3 Summary) -->
            <div class="rounded-2xl p-4 bg-slate-900/60 border border-emerald-500/30 space-y-2">
              <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                E. Free Forever Guarantee (GNU GPL v3.0)
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                Aetherium is free software licensed under the <strong>GNU General Public License v3.0 (or later)</strong>. You have the irrevocable freedom to <strong>run</strong>, <strong>study</strong>, <strong>share</strong>, and <strong>modify</strong> this software, under the strict copyleft condition that any derivative work or redistribution remains open-source under the same GPLv3 license.
              </p>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const closeBtn = this.root.querySelector('#btn-close-about-modal');
    closeBtn?.addEventListener('click', () => {
      store.setAboutOpen(false);
    });

    this.root.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.root) {
        store.setAboutOpen(false);
      }
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.getState().isAboutOpen) {
        store.setAboutOpen(false);
      }
    });

    const tabButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-about-tab]');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-about-tab') as AboutTabId;
        this.activeTab = tab;
        this.syncTabs();
      });
    });

    // External link handler: uses Tauri shell API if available, otherwise standard browser tab
    const externalLinks = this.root.querySelectorAll<HTMLAnchorElement>('[data-external-link]');
    externalLinks.forEach((link) => {
      link.addEventListener('click', (e: MouseEvent) => {
        const url = link.getAttribute('data-external-link');
        if (!url) return;
        if (isTauriRuntime()) {
          e.preventDefault();
          void import('@tauri-apps/api/shell')
            .then(({ open }) => open(url))
            .catch(() => {
              window.open(url, '_blank', 'noopener,noreferrer');
            });
        }
      });
    });

    this.syncTabs();
  }

  private syncTabs(): void {
    const tabButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-about-tab]');
    tabButtons.forEach((btn) => {
      const tab = btn.getAttribute('data-about-tab');
      if (tab === this.activeTab) {
        btn.className =
          'px-3 py-1 rounded-full transition-colors bg-indigo-500/25 text-indigo-100 border border-indigo-400/45';
      } else {
        btn.className =
          'px-3 py-1 rounded-full transition-colors text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800';
      }
    });

    const sections = this.root.querySelectorAll<HTMLElement>('[data-about-section]');
    sections.forEach((sec) => {
      const id = sec.getAttribute('data-about-section');
      if (this.activeTab === 'all' || id === this.activeTab) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    });
  }

  private updateVisibility(isOpen: boolean): void {
    if (isOpen) {
      this.root.classList.remove('hidden');
      this.root.classList.add('flex');
    } else {
      this.root.classList.add('hidden');
      this.root.classList.remove('flex');
    }
  }
}
