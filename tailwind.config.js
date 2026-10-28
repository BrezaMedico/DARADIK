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
        },
        school: {
          bg: '#FAF8F5',
          surface: '#FFFFFF',
          sand: '#F4F1EA',
          subtle: '#EFECE4',
          border: '#E4E0D8',
          borderStrong: '#D3CEC3',
          ink: '#18181B',
          charcoal: '#232B28',
          muted: '#525E58',
          accent: '#1F5E4B',
          accentHover: '#17493A',
          accentMid: '#2E7D64',
          accentSoft: '#D5E8E1',
          accentTint: '#EEF6F3',
          amber: '#C87A28',
          amberSoft: '#FBF3E6',
          bronze: '#7C6A56',
          danger: '#C24136',
          dangerSoft: '#FDF3F2',
        }
      }
    },
  },
  plugins: [],
}
