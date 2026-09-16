export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sl: {
          red: '#dc2626',
          dark: '#06080f',
          navy: '#0d1117',
          panel: '#0d1117',
          card: '#161b22',
          border: '#21262d',
          accent: '#ef4444',
          blue: '#1d6ae5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #dc2626, 0 0 10px #dc2626' },
          '100%': { boxShadow: '0 0 10px #dc2626, 0 0 30px #dc2626, 0 0 60px #dc262633' },
        }
      }
    }
  },
  plugins: [],
};
