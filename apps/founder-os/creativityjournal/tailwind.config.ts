import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'quicksand': ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'handwriting': ['Shadows Into Light', 'cursive'],
        'serif': ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        'core-green': '#656839',
        'main-bg': '#CBD0B9',
      },
    },
  },
  plugins: [],
}

export default config
