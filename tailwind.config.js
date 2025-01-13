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
          "100%": {
            transform: "translateY(0)",  // Final position
            opacity: "1",                // Fully visible
          },
        },
        bounceFluid: {
          "0%": {
            transform: "translateY(0)",  // Neutral position
          },
          "50%": {
            transform: "translateY(-10px)", // Peak of the bounce
          },
          "100%": {
            transform: "translateY(0)",  // Back to neutral position
          },
        },
        bounceInSequence: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-20px)", // Adjust bounce height
          },
        },
      },
      animation: {
        slideInFromBottomAndFade: "slideInFromBottomAndFade 1s ease-out forwards",
        bounceFluid: "bounceFluid 2s ease-out infinite",
        slideInThenBounce: "slideInFromBottomAndFade 1s ease-out forwards, bounceFluid 2s ease-out infinite 1s",
        bounceInSequence: "bounceInSequence 0.3s ease-in-out forwards",
      },
    },
  },
  plugins: [aspectRatio],
};
