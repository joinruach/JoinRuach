import preset from "@ruach/tailwind-preset";
import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  presets: [preset],
  theme: { extend: {} },
  plugins: [typography],
};

export default config;
