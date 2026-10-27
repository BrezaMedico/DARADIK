/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        civic: {
          cream: '#F4F1EA',
          alabaster: '#FAF8F5',
          sandstone: '#F2EFE9',
          mint: '#C8DFDC',
          teal: '#629BB5',
          ocean: '#2E6496',
          border: '#E4E0D8',
          ink: '#18181B',
          slate: '#1E293B',
          muted: '#475569',
        }
      }
    },
  },
  plugins: [],
}
