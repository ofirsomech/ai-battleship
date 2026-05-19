/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#e8edf5",
          100: "#c5d1e5",
          200: "#9eb2d1",
          300: "#7893bd",
          400: "#5b7aad",
          500: "#3e629e",
          600: "#2d4f87",
          700: "#1f3a6b",
          800: "#0f1f38",
          900: "#060d1a",
          950: "#03060d",
        },
        brass: {
          300: "#e8d5a3",
          400: "#d4b85c",
          500: "#c4a343",
          600: "#a68632",
          700: "#8a6e29",
        },
        sonar: {
          300: "#80e8ff",
          400: "#33d9ff",
          500: "#00d4ff",
          600: "#00a8cc",
        },
        hit: {
          400: "#ff8c5a",
          500: "#ff6b35",
          600: "#e05520",
          700: "#b8431a",
        },
        miss: {
          400: "#7eb8d4",
          500: "#4da6cf",
          600: "#3385b0",
        },
        danger: {
          400: "#f06068",
          500: "#e63946",
          600: "#c62828",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"Share Tech Mono"', '"Courier New"', "monospace"],
      },
      animation: {
        "pulse-sonar": "pulse-sonar 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "hit-flash": "hit-flash 0.6s ease-out",
        "miss-ripple": "miss-ripple 0.5s ease-out",
        "slide-in-down": "slide-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-up": "slide-out-up 0.3s ease-in forwards",
        "fade-in": "fade-in 0.3s ease-out",
        "modal-enter": "modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "sunk-pulse": "sunk-pulse 0.6s ease-out 3",
        "radar-spin": "radar-spin 4s linear infinite",
        "countdown-pulse": "countdown-pulse 1s ease-in-out infinite",
        "placement-ready": "placement-ready 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-sonar": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.03)" },
        },
        "hit-flash": {
          "0%": { backgroundColor: "transparent", transform: "scale(1)" },
          "30%": { backgroundColor: "#ff6b35", transform: "scale(1.15)" },
          "60%": { backgroundColor: "#ff8c5a", transform: "scale(1.05)" },
          "100%": { backgroundColor: "#b8431a", transform: "scale(1)" },
        },
        "miss-ripple": {
          "0%": { backgroundColor: "transparent", transform: "scale(1)" },
          "50%": { backgroundColor: "#3385b0", transform: "scale(1.08)" },
          "100%": { backgroundColor: "#0f1f38", transform: "scale(1)" },
        },
        "slide-in-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "modal-enter": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(-10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "sunk-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 107, 53, 0.6)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(255, 107, 53, 0.2)" },
        },
        "radar-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "countdown-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "placement-ready": {
          "0%, 100%": { boxShadow: "0 0 4px 1px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 12px 3px rgba(0, 212, 255, 0.6)" },
        },
      },
      boxShadow: {
        "navy-glow": "0 0 30px -5px rgba(0, 212, 255, 0.12)",
        "brass-glow": "0 0 20px -5px rgba(196, 163, 67, 0.15)",
        "cell-target": "0 0 6px 2px rgba(0, 212, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
