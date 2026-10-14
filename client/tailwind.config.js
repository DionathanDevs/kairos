/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0c0e12',
          card: '#15181e',
          cardHover: '#1a1e26',
          border: '#232732',
          subtle: '#2a303e'
        },
        brand: {
          green: '#10b981',
          greenLight: '#34d399',
          greenDark: '#047857',
          cyan: '#7dd3fc',
          cyanLight: '#93c5fd'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
