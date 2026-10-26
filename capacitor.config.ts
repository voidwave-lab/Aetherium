// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Aetherium Pocket — Capacitor Native Mobile Configuration (iOS & Android)
 * Copyright (C) 2026 Voidwave Lab
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  backgroundColor?: string;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
    hostname?: string;
    errorPath?: string;
  };
  ios?: {
    contentInset?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
    allowsLinkPreview?: boolean;
    backgroundColor?: string;
  };
  android?: {
    backgroundColor?: string;
    allowMixedContent?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: 'org.voidwavelab.aetherium',
  appName: 'Aetherium',
  webDir: 'dist',
  backgroundColor: '#07090e',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    hostname: 'aetherium.voidwavelab.org',
    errorPath: 'pocket.html',
  },
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    backgroundColor: '#07090e',
  },
  android: {
    backgroundColor: '#07090e',
    allowMixedContent: false,
  },
};

export default config;
