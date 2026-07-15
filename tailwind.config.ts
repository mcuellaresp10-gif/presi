import type { Config } from "tailwindcss";

/**
 * PRESI palette (neon hybrid, CTA accent):
 * #F5F147 gold · #F57847 coral (login CTA gradient)
 * Former cyan/pink slots map to gold so accents match the CTA.
 */
const GOLD = "#F5F147";
const CORAL = "#F57847";

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
          gold: GOLD,
          /** Legacy cyan/pink → gold (CTA yellow) */
          cyan: GOLD,
          pink: GOLD,
          coral: CORAL,
          maroon: CORAL,
          red: CORAL,
          olive: "#8C955D",
          sand: "#E0CBB2",
          ivory: "#E0CBB2",
          success: "#8C955D",
          warning: CORAL,
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
