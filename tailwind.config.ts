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
        // ASUR Brand Colors - Dark, Premium, Athletic
        asur: {
          black: "#0A0A0A",
          carbon: "#141414",
          graphite: "#1A1A1A",
          steel: "#2A2A2A",
          iron: "#3A3A3A",
          slate: "#6B6B6B",
          silver: "#9A9A9A",
          ash: "#C4C4C4",
          bone: "#E8E5E0",
          cream: "#F5F3F0",
          white: "#FAFAFA",
        },
        accent: {
          primary: "#D4A574", // Warm gold/bronze - subtle Nepali warmth
          secondary: "#8B7355", // Deep bronze
          highlight: "#E8C9A0", // Light gold
        },
        status: {
          success: "#2D8B4E",
          warning: "#D4890A",
          error: "#C43E3E",
          info: "#3B7DD8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // Type scale - premium fashion e-commerce
        "display-xl": ["4.5rem", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["3.5rem", { lineHeight: "0.95", letterSpacing: "-0.025em" }],
        "display-md": ["2.5rem", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        "display-sm": ["2rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "heading-lg": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "heading-md": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.005em" }],
        "heading-sm": ["1.125rem", { lineHeight: "1.4", letterSpacing: "0" }],
        "body-lg": ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-md": ["0.9375rem", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        "overline": ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.1em" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
