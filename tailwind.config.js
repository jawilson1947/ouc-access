/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // OUC Brand Colors
        'ouc-primary': '#000033',
        'ouc-primary-light': '#1a1a5c',
        'ouc-primary-dark': '#000022',
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        ouc: {
          "primary": "#000033",
          "primary-content": "#ffffff",
          "secondary": "#1a1a5c",
          "secondary-content": "#ffffff",
          "accent": "#3b82f6",
          "accent-content": "#ffffff",
          "neutral": "#374151",
          "neutral-content": "#ffffff",
          "base-100": "#000033",
          "base-200": "#1a1a5c",
          "base-300": "#000022",
          "base-content": "#ffffff",
          "info": "#3b82f6",
          "info-content": "#ffffff",
          "success": "#059669",
          "success-content": "#ffffff",
          "warning": "#ea580c",
          "warning-content": "#ffffff",
          "error": "#dc2626",
          "error-content": "#ffffff",
        },
      },
      "dark", // fallback theme
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
} 