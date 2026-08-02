/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(222.2 84% 4.9% / <alpha-value>)",
        foreground: "hsl(210 40% 98% / <alpha-value>)",
        border: "hsl(214.3 31.8% 91.4% / <alpha-value>)",
        input: "hsl(214.3 31.8% 91.4% / <alpha-value>)",
        ring: "hsl(221.2 83.2% 53.3% / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(221.2 83.2% 53.3%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(214 100% 97%)",
          100: "hsl(214 95% 93%)",
          200: "hsl(213 97% 87%)",
          300: "hsl(212 96% 78%)",
          400: "hsl(213 94% 68%)",
          500: "hsl(217 91% 60%)",
          600: "hsl(221.2 83.2% 53.3%)",
          700: "hsl(224 76% 48%)",
          800: "hsl(226 71% 40%)",
          900: "hsl(224 64% 33%)",
          950: "hsl(226 57% 21%)",
        },
        sidebar: {
          DEFAULT: "hsl(222.2 47.4% 11.2%)",
          foreground: "hsl(210 40% 98%)",
          accent: "hsl(217.2 32.6% 17.5%)",
          "accent-foreground": "hsl(210 40% 98%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
