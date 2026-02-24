import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1b21",
        mist: "#edf4f7",
        brand: {
          50: "#ecfdf7",
          100: "#d1faeb",
          500: "#12b981",
          600: "#0ea571",
          700: "#0b7f58"
        }
      },
      boxShadow: {
        card: "0 8px 30px rgba(13, 27, 33, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
