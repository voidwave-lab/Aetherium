/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aether: {
          void: '#07090e',
          deep: '#0b0f17',
          surface: '#111726',
          border: 'rgba(148, 163, 184, 0.14)',
          indigo: '#6366f1',
          cyan: '#38bdf8',
          amber: '#f59e0b',
          rose: '#fb7185',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
