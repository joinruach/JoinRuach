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
        ruachSoft: "#F8F8F6",
        ruachGold: "#D8A85E",
        ruachDark: "#1A1A1A",
      },
    },
  },
  plugins: [typography],
};

export default config;
