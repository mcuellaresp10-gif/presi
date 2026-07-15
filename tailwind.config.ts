import type { Config } from "tailwindcss";

/**
 * PRESI palette (neon + happy hybrid):
 * #47F5D7 cyan · #F5F147 gold · #9247F5 violet · #F57847 coral · #8C955D olive · #E0CBB2 sand
 * Dark purple bases + sand-tinted surfaces + neon accents.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        presi: {
          bg: "#0E0718",
          surface: "#1A1028",
          elevated: "#26183A",
          navy: "#3B1D6E",
          "navy-deep": "#1A0B2E",
          violet: "#9247F5",
          gold: "#F5F147",
          cyan: "#47F5D7",
          coral: "#F57847",
          red: "#F57847",
          olive: "#8C955D",
          sand: "#E0CBB2",
          success: "#8C955D",
          warning: "#F57847",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        peel: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(-180deg)" },
        },
        holo: {
          "0%, 100%": { filter: "hue-rotate(0deg)" },
          "50%": { filter: "hue-rotate(90deg)" },
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(20px) rotateX(-15deg)" },
          "100%": { opacity: "1", transform: "translateY(0) rotateX(0)" },
        },
      },
      animation: {
        peel: "peel 0.6s ease-in-out forwards",
        holo: "holo 3s linear infinite",
        reveal: "reveal 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
