/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: "#f9f7f5",
          100: "#f1eeea",
          200: "#e2ddd6",
          300: "#d3cdc2",
          400: "#b5ab99",
          500: "#9c9080",
          600: "#857a6a",
          700: "#6d6557",
          800: "#5a5348",
          900: "#4a453c",
          950: "#292620",
        },
        primary: {
          50: "#f4f7f2",
          100: "#e6ece1",
          200: "#cedbc5",
          300: "#aec099",
          400: "#8ca474",
          500: "#6d8b59",
          600: "#577045",
          700: "#475939",
          800: "#3c4732",
          900: "#333c2c",
          950: "#1a1f15",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          50: "#f9f6f3",
          100: "#f0ebe4",
          200: "#e0d3c7",
          300: "#ceb6a3",
          400: "#b99176",
          500: "#a97c5e",
          600: "#97674c",
          700: "#7d5440",
          800: "#674639",
          900: "#553c32",
          950: "#2d1e19",
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-noto-sans-jp)",
          "var(--font-inter)",
          ...defaultTheme.fontFamily.sans,
        ],
        quicksand: ["var(--font-quicksand)", ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        soft: "0.375rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
        medium:
          "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
