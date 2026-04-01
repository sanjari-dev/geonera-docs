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
          900: '#0f172a',
        },
        cyan: {
          400: '#22d3ee',
        },
        emerald: {
          400: '#34d399',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
