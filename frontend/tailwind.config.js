/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-olive': '#3D4A1F',
        'medium-olive': '#556B2F',
        'lime-green': '#C5E86C',
        'mint-green': '#A8E6A3',
        'dashboard-bg': '#2D3A1A',
        'dashboard-card': '#3D4A1F',
        'expense-red': '#EF4444',
      },
      fontFamily: {
        'manrope': ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        'pill': '24px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
