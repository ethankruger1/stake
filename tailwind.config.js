/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0b0e14',
          card: '#1a1f2e',
          panel: '#1e2438',
          border: '#2a3045',
          hover: '#252d42',
          green: '#3bc117',
          'green-light': '#4ed629',
          'green-dark': '#2a9010',
          gold: '#f59e0b',
          red: '#ef4444',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 0.5s ease-in-out infinite',
        'bounce-once': 'bounce 0.4s ease-in-out 1',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'count-up': 'countUp 0.3s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'crash-line': 'crashLine 0.1s linear infinite',
        'flip': 'flip 0.5s ease-in-out',
        'plinko-drop': 'plinkoDrop 0.05s linear',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        countUp: {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #3bc117, 0 0 10px #3bc117' },
          '100%': { boxShadow: '0 0 15px #3bc117, 0 0 30px #3bc117, 0 0 45px #3bc11744' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
    },
  },
  plugins: [],
}
