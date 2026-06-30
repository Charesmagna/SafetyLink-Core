/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Palette
        primary: {
          DEFAULT: '#0066cc',
          light: '#e6f0ff',
          dark: '#004c99',
        },
        secondary: {
          DEFAULT: '#ff6d00',
          light: '#fff0e0',
          dark: '#cc5600',
        },
        error: {
          DEFAULT: '#b3261e',
          light: '#fdf4f3',
          dark: '#8c1d18',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
