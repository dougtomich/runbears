/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#050d05',
          900: '#0a150a',
          800: '#0d1f0d',
          700: '#1A2E1A',
          600: '#243324',
          500: '#2A4A2A',
        },
        alert: '#FF4C00',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ring': 'ring 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
