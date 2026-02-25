/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'block-cyan': '#00d9ff',
        'block-purple': '#a855f7',
        'block-orange': '#f97316',
        'block-green': '#22c55e',
        'block-pink': '#ec4899',
        'block-yellow': '#fbbf24',
      }
    },
  },
  plugins: [],
}
