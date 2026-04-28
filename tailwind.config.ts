import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "liquid-left": {
          "0%": {
            transform: "translate3d(-10%, 4.8em, 0) rotate(330deg)",
            opacity: "1",
          },
          "100%": {
            transform: "translate3d(-10%, -1em, 0) rotate(100deg)",
            opacity: "1",
          },
        },
        "liquid-right": {
          "0%": {
            transform: "translate3d(10%, 4.8em, 0) rotate(0deg)",
            opacity: "1",
          },
          "100%": {
            transform: "translate3d(10%, -1em, 0) rotate(180deg)",
            opacity: "1",
          },
        },
      },
      animation: {
        "liquid-left": "liquid-left 1.5s ease forwards",
        "liquid-right": "liquid-right 1.5s ease forwards",
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
    },
  },
  plugins: [],
}

export default config
