/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1210",
        panel: "#111b17",
        mint: "#79f2b2",
        muted: "#8b9c92",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 48px rgba(121, 242, 178, 0.12)",
      },
    },
  },
  plugins: [],
};
