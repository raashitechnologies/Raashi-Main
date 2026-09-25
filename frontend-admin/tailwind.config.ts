import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          blue: "#0560DF",
          royal: "#0E2F9D",
          navy: "#17285E",
          orange: "#F94F0E",
          red: "#EE3128",
          magenta: "#D11753",
          surface: "#F8FAFC",
          sidebar: "#0f1729",
          "sidebar-light": "#162044",
          "sidebar-active": "#1e3a6e",
        },
        // ── Warm editorial palette (complementary, not a replacement) ──────
        warm: {
          beige: "#F5F0E6",          // primary light page canvas
          gray: "#F1F1EE",           // selected tile backgrounds
          blue: "#174A7E",           // tile text on warm surfaces
          "lighter-blue": "#4A90D9", // secondary icons, hover states
          orange: "#E98A3A",         // tile borders, subtle warm accents
        },
        primary: {
          DEFAULT: "#0560DF",
          foreground: "#FFFFFF",
          hover: "#0E2F9D",
        },
        secondary: {
          DEFAULT: "#FFFFFF",
          foreground: "#17285E",
        },
        accent: {
          DEFAULT: "#F94F0E",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EE3128",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8FAFC",
          foreground: "#17285E",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#17285E",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#17285E",
        },
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "Manrope", "sans-serif"],
      },
      backgroundImage: {
        "cognitive-gradient":
          "linear-gradient(135deg, #0560DF 0%, #7A1FD0 50%, #EE3128 100%)",
        "motion-gradient": "linear-gradient(135deg, #0560DF 0%, #F94F0E 100%)",
        "navy-gradient": "linear-gradient(135deg, #17285E 0%, #0E2F9D 100%)",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(23, 40, 94, 0.06)",
        "soft-hover": "0 10px 30px -4px rgba(23, 40, 94, 0.12)",
        floating: "0 20px 40px -8px rgba(23, 40, 94, 0.16)",
        card: "0 4px 20px -2px rgba(23, 40, 94, 0.06)",
        // Warm editorial shadows (orange tint — barely noticeable)
        "warm-card": "0 4px 20px -2px rgba(233, 138, 58, 0.08)",
        "warm-hover": "0 10px 30px -4px rgba(233, 138, 58, 0.13)",
        glass: "inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 20px 40px -8px rgba(23, 40, 94, 0.16)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
