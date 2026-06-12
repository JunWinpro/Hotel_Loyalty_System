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
          DEFAULT: '#1B3A6B', // Navy
          light: '#2B5292',
          dark: '#0F2344',
        },
        accent: {
          DEFAULT: '#C9A84C', // Gold
          light: '#DEC176',
          dark: '#A68430',
        },
        silver: {
          DEFAULT: '#8A9A86',
          light: '#C0C0C0',
        },
        platinum: {
          DEFAULT: '#8E9AA6',
          light: '#E5E4E2',
        }
      }
    },
  },
  plugins: [],
}
