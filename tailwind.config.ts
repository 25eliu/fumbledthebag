import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-fredoka)", "system-ui", "sans-serif"] },
      colors: {
        cream: "#FFFDF7",
        ink: "#2B2A33",
        gain: "#16B364",
        loss: "#E5685C",
        accent: "#FFD43B",
      },
      borderRadius: { xl2: "1.75rem" },
      boxShadow: { soft: "0 12px 40px -12px rgba(43,42,51,0.18)" },
    },
  },
  plugins: [],
};
export default config;
