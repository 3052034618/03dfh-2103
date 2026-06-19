/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          gold: '#e2a04a',
          dark: '#0f0f1a',
          surface: '#16162a',
          border: '#2a2a40',
          danger: '#c84b31',
          success: '#33b89a',
          muted: '#8b8ba3',
        },
      },
      fontFamily: {
        display: ['"ZCOOL QingKe HuangYou"', 'cursive'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
