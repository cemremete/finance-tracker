/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C4E538',
        'primary-dark': '#8BC34A',
        background: '#1A1F1A',
        'card-bg': '#2D3A2D',
        'card-hover': '#3D4A3D',
        'text-primary': '#E8F5E9',
        'text-secondary': '#A5D6A7',
        'text-muted': '#6B8E6B',
        accent: '#8BC34A',
        danger: '#EF4444',
        success: '#4CAF50'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
