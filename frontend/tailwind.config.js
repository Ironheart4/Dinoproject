export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F1F8F5',
          100: '#E0F2EB',
          500: '#4CAF50',
          700: '#1B5E20',
        },
        accent: {
          400: '#FFB300',
          500: '#29B6F6',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      backgroundColor: {
        base: '#F5F5F5',
      },
    },
  },
  plugins: [],
}
