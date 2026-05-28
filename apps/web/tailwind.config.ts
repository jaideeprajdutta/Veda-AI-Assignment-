import type { Config } from "tailwindcss";

/** Tokens pulled from the VedaAI Figma file (79pdJG5tXjb70R831UH2G8). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF5623",
          light: "#FF7950",
          dark: "#E56820",
          deep: "#D45E3E",
        },
        ink: {
          DEFAULT: "#303030",
          strong: "#181818",
          soft: "#5E5E5E",
          muted: "#A9A9A9",
        },
        surface: {
          page: "#F6F6F6",
          card: "#FFFFFF",
          fill: "#F0F0F0",
          border: "#DADADA",
        },
        difficulty: {
          easy: "#1F9D55",
          moderate: "#E58A00",
          hard: "#D4373E",
        },
      },
      fontFamily: {
        // Primary typeface (Figma): Bricolage Grotesque.
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        // Figma headings: -0.96px @ 24px ≈ -0.04em.
        tighter: "-0.04em",
      },
      borderRadius: {
        pill: "100px",
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        pop: "0 8px 28px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
