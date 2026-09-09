import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  darkMode: ["class", '[data-theme="waplyDark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf4",
          100: "#d6f6e4",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        waplyLight: {
          "primary": "#059669",
          "primary-content": "#ffffff",
          "secondary": "#0ea5e9",
          "accent": "#6366f1",
          "neutral": "#0f172a",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#0f172a",
          "info": "#38bdf8",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
        waplyDark: {
          "primary": "#10b981",
          "primary-content": "#0f172a",
          "secondary": "#38bdf8",
          "accent": "#818cf8",
          "neutral": "#111827",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "info": "#38bdf8",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
      "light",
      "dark",
    ],
    defaultTheme: "waplyLight",
  },
};

export default config;
