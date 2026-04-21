/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#04071a',
          900: '#0a0f1e',
          800: '#0f1629',
          700: '#162038',
          600: '#1e2d4a',
        },
        gold: {
          300: '#fcd683',
          400: '#f9c34a',
          500: '#f5a623',
          600: '#e08c0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
  plugins: [],
}
