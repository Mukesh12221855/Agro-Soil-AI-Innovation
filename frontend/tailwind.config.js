/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edfcf5',
          100: '#d3f9e5',
          200: '#aaf0d0',
          300: '#73e3b4',
          400: '#3ace93',
          500: '#1D9E75',
          600: '#0f915e',
          700: '#0d744d',
          800: '#399b77ff',
          900: '#3d846aff',
          950: '#1a7659ff',
        },
        dark: {
          50: '#ebf7f0',
          100: '#d0eddb',
          200: '#a1d7b6',
          300: '#73be90',
          400: '#4ba371',
          500: '#368e5e',
          600: '#2a704b',
          700: '#20563a',
          800: '#18c76dff',
          900: '#236e4fff',
          950: '#113927ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { 'text-shadow': '0 0 10px rgba(68, 232, 180, 0.3)' },
          '100%': { 'text-shadow': '0 0 30px rgba(29,158,117,0.8), 0 0 60px rgba(29,158,117,0.4)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
