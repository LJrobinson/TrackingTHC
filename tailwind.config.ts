import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        moss: "#356859",
        mint: "#8cc7a1",
        clay: "#b66a50",
        cream: "#f7f3ea"
      }
    }
  },
  plugins: []
};

export default config;
