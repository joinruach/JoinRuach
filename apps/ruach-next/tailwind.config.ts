import preset from "@ruach/tailwind-preset";
import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  presets: [preset],
  theme: {
    extend: {
      colors: {
        ruachSoft: "#F8F5F1",
        ruachGold: "#D4B58A",
        ruachDark: "#2B2B2B",
      },
    },
  },
  plugins: [typography],
};

export default config;
