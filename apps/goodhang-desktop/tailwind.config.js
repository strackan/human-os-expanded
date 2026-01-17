/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Good Hang brand colors
        'gh-purple': {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        'gh-dark': {
          600: '#3d3854',
          700: '#2d2942',
          800: '#1e1b2e',
          900: '#0f0d1a',
        },
        // Progress indicator colors
        'progress': {
          complete: '#22c55e', // green-500
          partial: '#3b82f6',  // blue-500
          pending: '#6b7280',  // gray-500
        },
      },
    },
  },
  plugins: [],
};
