/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'slide-blue': '#3B82F6',
        'slide-orange': '#F97316', 
        'slide-green': '#10B981',
        'slide-red': '#EF4444',
        'slide-purple': '#8B5CF6'
      },
      animation: {
        'bounce-subtle': 'bounce 1s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite'
      },
      spacing: {
        'safe': 'env(safe-area-inset-top)'
      },
      backdropBlur: {
        'xs': '2px'
      }
    }
  },
  plugins: []
};