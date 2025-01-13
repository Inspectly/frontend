/** @type {import('tailwindcss').Config} */
import aspectRatio from "@tailwindcss/aspect-ratio";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        slideInFromBottomAndFade: {
          "0%": {
            transform: "translateY(100%)", // Start off-screen
            opacity: "0",                // Fully transparent
          },
          "50%": {
            transform: "translateY(50%)", // Mostly in position
            opacity: "0",                // Still transparent
          },
          "100%": {
            transform: "translateY(0)",  // Final position
            opacity: "1",                // Fully visible
          },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(0)",  // Neutral position
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(-10px)", // Bounce up
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },
      animation: {
        slideInFromBottomAndFade: "slideInFromBottomAndFade 1s ease-out forwards",
        bounce: "bounce 2s infinite",
        slideInThenBounce: "slideInFromBottomAndFade 1s ease-out forwards, bounce 2s infinite 1s",
      },
    },
  },
  plugins: [aspectRatio],
}

