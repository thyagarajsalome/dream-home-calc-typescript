// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // I've mapped your global.css variables here for easier use
      colors: {
        primary: '#d9a443',
        secondary: '#59483b',
        accent: '#8c6a4e',
        danger: '#e74c3c',
        warning: '#f39c12',
        success: '#2ecc71',
      },
      fontFamily: {
        body: ['Roboto', 'sans-serif'],
        heading: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}