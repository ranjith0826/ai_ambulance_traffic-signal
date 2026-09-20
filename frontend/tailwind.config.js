/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: "#FFFFFF", // Pure white background
          card: "#FFFFFF", // Pure white card
          border: "#E2E8F0", // Modern light border
          text: "#0A0D0B", // High-contrast rich black
          muted: "#64748B", // Clean slate neutral
        },
        lane: {
          green: "#10B981", // Vibrant light emerald green
          dark: "#0A0D0B", // Obsidian black
          gold: "#34D399", // Light mint green accent
          orange: "#EA580C",
          danger: "#DC2626",
          success: "#10B981",
        },
        brand: {
          black: "#0A0D0B",
          dark: "#111827",
          green: "#10B981", // Light green
          emerald: "#34D399",
          lightGreen: "#ECFDF5",
          white: "#FFFFFF",
          surface: "#FFFFFF",
          border: "#E2E8F0",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '4.5': '1.125rem',
        '7.5': '1.875rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'cream-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'cream-md': '0 4px 16px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
        'cream-lg': '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
