// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Aetherium — Official Vector Emblem ("The Meridian Eclipse" // voidwave-lab)
 * Copyright (C) 2026 Voidwave Lab
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

let emblemInstanceCounter = 0;

/**
 * Returns an inline, scalable SVG string of "The Meridian Eclipse" emblem
 * with unique gradient/filter IDs so multiple instances can coexist in the DOM
 * (Onboarding Screen, Top Header Bar, Mobile Dock, and About Modal).
 */
export function renderMeridianEclipseEmblem(className = 'w-6 h-6'): string {
  emblemInstanceCounter += 1;
  const uid = `me-${emblemInstanceCounter}`;

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      class="${className} shrink-0 select-none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="${uid}-bg" cx="50%" cy="50%" r="72%" fx="50%" fy="46%">
          <stop offset="0%" stop-color="#111526"/>
          <stop offset="56%" stop-color="#07090e"/>
          <stop offset="100%" stop-color="#05070b"/>
        </radialGradient>
        <radialGradient id="${uid}-fog-v" cx="46%" cy="52%" r="44%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.38"/>
          <stop offset="50%" stop-color="#6d28d9" stop-opacity="0.26"/>
          <stop offset="100%" stop-color="#6d28d9" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${uid}-fog-c" cx="54%" cy="44%" r="42%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.34"/>
          <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${uid}-core" cx="46%" cy="42%" r="60%">
          <stop offset="0%" stop-color="#0e1322"/>
          <stop offset="72%" stop-color="#07090e"/>
          <stop offset="100%" stop-color="#04060a"/>
        </radialGradient>
        <linearGradient id="${uid}-rim" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.78"/>
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.55"/>
        </linearGradient>
        <linearGradient id="${uid}-orb1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.92"/>
          <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.60"/>
          <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.24"/>
        </linearGradient>
        <linearGradient id="${uid}-orb2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.80"/>
          <stop offset="48%" stop-color="#22d3ee" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.26"/>
        </linearGradient>
        <radialGradient id="${uid}-spark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="32%" stop-color="#fef3c7" stop-opacity="0.92"/>
          <stop offset="65%" stop-color="#22d3ee" stop-opacity="0.60"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#${uid}-bg)"/>
      <circle cx="484" cy="528" r="360" fill="url(#${uid}-fog-v)"/>
      <circle cx="542" cy="468" r="340" fill="url(#${uid}-fog-c)"/>

      <ellipse
        cx="512"
        cy="512"
        rx="376"
        ry="292"
        transform="rotate(-22 512 512)"
        fill="none"
        stroke="url(#${uid}-orb1)"
        stroke-width="22"
      />
      <ellipse
        cx="512"
        cy="512"
        rx="376"
        ry="292"
        transform="rotate(22 512 512)"
        fill="none"
        stroke="url(#${uid}-orb2)"
        stroke-width="22"
      />

      <line
        x1="512"
        y1="76"
        x2="512"
        y2="352"
        stroke="#67e8f9"
        stroke-opacity="0.75"
        stroke-width="18"
        stroke-linecap="round"
      />

      <circle
        cx="512"
        cy="512"
        r="160"
        fill="url(#${uid}-core)"
        stroke="url(#${uid}-rim)"
        stroke-width="24"
      />
      <circle cx="512" cy="512" r="22" fill="#e0f2fe" fill-opacity="0.8"/>

      <g transform="translate(512, 204)">
        <circle r="105" fill="url(#${uid}-spark)"/>
        <circle r="68" fill="none" stroke="#67e8f9" stroke-opacity="0.55" stroke-width="14"/>
        <circle r="28" fill="#ffffff" stroke="#22d3ee" stroke-width="12"/>
      </g>
    </svg>
  `;
}
