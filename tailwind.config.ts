import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#111827",
          900: "#172033",
          800: "#243044",
          700: "#344155",
        },
        cloud: {
          50: "#f7f9fc",
          100: "#eef3f8",
          200: "#dde7f1",
        },
        brand: {
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        panel: "0 1px 2px rgba(15, 23, 42, 0.06), 0 14px 30px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
