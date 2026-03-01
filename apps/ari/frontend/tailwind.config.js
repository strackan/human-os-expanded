/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ari: {
          primary: '#6366f1',    // Indigo
          secondary: '#8b5cf6',  // Purple
          success: '#22c55e',    // Green
          warning: '#f59e0b',    // Amber
          danger: '#ef4444',     // Red
          dark: '#1e1b4b',       // Deep purple
        },
        // Deliverables branded palette - warm, professional
        deliverable: {
          background: '#FAF9F7',     // Warm off-white/cream
          surface: '#FFFFFF',        // Pure white for cards
          'text-primary': '#2D2A26', // Warm charcoal
          'text-secondary': '#6B6560', // Warm gray
          accent: '#7C9885',         // Soft sage green
          'accent-warm': '#C4A77D',  // Warm gold/tan
          border: '#E8E5E1',         // Subtle warm gray
          highlight: '#F5F2ED',      // Linen-like background
        },
      },
      animation: {
        'score-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'count-up': 'countUp 1.5s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
