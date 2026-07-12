import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        border: "#1E1E1E",
        "border-subtle": "#161616",
        foreground: "#F5F5F5",
        muted: "#888888",
        "muted-dark": "#555555",
        blue: {
          DEFAULT: "#378ADD",
          hover: "#4B9AED",
          dim: "rgba(55,138,221,0.12)",
          border: "rgba(55,138,221,0.3)",
        },
        green: {
          DEFAULT: "#22C55E",
          dim: "rgba(34,197,94,0.12)",
        },
        yellow: {
          DEFAULT: "#F59E0B",
          dim: "rgba(245,158,11,0.12)",
        },
        red: {
          DEFAULT: "#EF4444",
          dim: "rgba(239,68,68,0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "monospace"],
        display: ["var(--font-sora)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
