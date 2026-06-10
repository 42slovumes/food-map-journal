/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 暖紙感色票
        paper: "#FBF7F0",
        card: "#FFFFFF",
        line: "#ECE3D6",
        ink: {
          DEFAULT: "#211C18",
          soft: "#6F665C",
          faint: "#A99F92",
        },
        brand: {
          50: "#FFF4EC",
          100: "#FFE7D5",
          200: "#FFD0AE",
          300: "#FCB07C",
          400: "#F98C45",
          500: "#F2701A", // 主橘
          600: "#DD5C0C",
          700: "#B7470C",
          800: "#923A12",
          900: "#763212",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: [
          '"Noto Sans TC"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,28,24,0.04), 0 8px 24px -12px rgba(33,28,24,0.18)",
        lift: "0 2px 6px rgba(33,28,24,0.06), 0 18px 40px -16px rgba(33,28,24,0.28)",
        sheet: "0 -8px 40px -12px rgba(33,28,24,0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "marker-pop": {
          "0%": { transform: "scale(0) translateY(6px)", opacity: "0" },
          "70%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 0.25s ease-out both",
        "marker-pop": "marker-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [],
};
