import type { Config } from "tailwindcss";

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
          bg: "#070B18",
          surface: "#0C1424",
          elevated: "#111B2E",
          navy: "#1A1040",
          "navy-deep": "#142238",
          gold: "#F5C518",
          cyan: "#22D3EE",
          red: "#FF3355",
          success: "#34D399",
          warning: "#FBBF24",
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
