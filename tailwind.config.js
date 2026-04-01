/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{svelte,js,ts,svx,md}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#030712',
          925: '#0a0e1b',
          900: '#0f172a',
          850: '#172038',
        },
        cyan: {
          400: '#22d3ee',
          350: '#35d9f0',
        },
        emerald: {
          400: '#34d399',
          350: '#45dba8',
        },
        amber: {
          400: '#fbbf24',
          350: '#fcc642',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          '"Fira Code"',
          '"Courier New"',
          'monospace',
        ],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.3)',
      },
    },
  },
  plugins: [],
};
