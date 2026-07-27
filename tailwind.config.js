/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-0': 'rgb(var(--surface-0) / <alpha-value>)',
        'surface-1': 'rgb(var(--surface-1) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'content': 'rgb(var(--content) / <alpha-value>)',
        'content-dim': 'rgb(var(--content-dim) / <alpha-value>)',
        'border': 'rgb(var(--border) / <alpha-value>)',
        'brand': {
          DEFAULT: '#FF7F27', // Logonun turuncusu
          dark: '#E66F20',    // Biraz daha koyu turuncu (hover için)
        },
        'success': '#22C55E', // Logonun yeşili
        'danger': 'rgb(239 68 68 / <alpha-value>)',
        'warning': 'rgb(234 179 8 / <alpha-value>)',
      },
      boxShadow: {
        'card-lg': '0 10px 30px -10px rgb(0 0 0 / 0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-in',
      },
    },
  },
  plugins: [],
};