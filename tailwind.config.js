import defaultTheme from 'tailwindcss/defaultTheme'

const mono = ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono]

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // One family everywhere: a monospace with slab-serif details gives the "journal" feel.
      fontFamily: { sans: mono, mono },
      colors: {
        ink: { 900: '#0d1220', 950: '#080b14' },
        wine: { DEFAULT: '#8B2E49', 600: '#a03554', 700: '#6b2338' },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: { 'fade-in': 'fade-in 0.25s ease-out both' },
    },
  },
  plugins: [],
}
