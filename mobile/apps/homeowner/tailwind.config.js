/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./index.js",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/shared/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#D4A853",
        "primary-foreground": "#FFFFFF",
        foreground: "#1A1A1A",
        background: "#FFFFFF",
        muted: "#F5F5F5",
        "muted-foreground": "#6B7280",
        border: "#E5E7EB",
        destructive: "#EF4444",
        "destructive-foreground": "#FFFFFF",
      },
    },
  },
  plugins: [],
};
