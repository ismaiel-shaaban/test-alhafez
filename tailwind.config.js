/** @type {import('tailwindcss').Config} */

/*
 * ===================================================
 * IMPORTANT: Colors must match app/globals.css
 * ===================================================
 * 
 * When changing colors, update BOTH:
 * 1. app/globals.css (CSS variables)
 * 2. This file (Tailwind config)
 * 
 * Components use Tailwind classes that reference these colors.
 */

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3f0',
          100: '#e6e0d8',
          200: '#d4c9bc',
          300: '#b8a896',
          400: '#9d8a70',
          500: '#7a6b56',
          600: '#5a4d3d',
          700: '#3d3328',
          800: '#2a2118',
          900: '#1E0A00',
          950: '#0f0500',
        },
        secondary: {
          DEFAULT: '#b09851',
          light: '#c4a96a',
          dark: '#8d783f',
        },
        accent: {
          green: '#4A9B7E',
          'green-light': '#5fb89a',
          'green-dark': '#1B5E4A',
          gold: '#B8860B',
          'gold-light': '#d4a017',
          'gold-medium': '#B8860B',
          amber: '#ea580c',
          red: '#E81123',
        },
        background: {
          DEFAULT: '#F8F6F0',
          beige: '#F5F1E8',
          features: '#ebe4d1',
        },
      },
      fontFamily: {
        arabic: ['var(--font-tajawal)', 'Tajawal', 'Arial', 'sans-serif'],
        english: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
