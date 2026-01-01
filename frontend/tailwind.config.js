/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E4F1FF',
          100: '#BFDCFF',
          200: '#95C7FF',
          300: '#6BB1FF',
          400: '#519FFF',
          500: '#458EFF',
          600: '#487FFF', // main theme color
          700: '#486CEA',
          800: '#4759D6',
          900: '#4536B6',
          DEFAULT: '#487FFF',
        },
        neutral: {
          50: '#F5F6FA',
          100: '#F3F4F6',
          200: '#EBECEF',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          main: '#EF4A00',
          surface: '#FCDAE2',
          border: '#F9B5C6',
          hover: '#D53128',
          pressed: '#801D18',
          focus: '#ef477026'
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          main: '#45B369',
          surface: '#DAF0E1',
          border: '#B5E1C3',
          hover: '#009F5E',
          pressed: '#006038',
          focus: '#45b36926'
        },
        warning: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#FF9F29',
          700: '#f39016',
          800: '#e58209',
          900: '#d77907',
          main: '#FF9F29',
          surface: '#FFF9E2',
          border: '#FFEBA6',
          hover: '#D69705',
          pressed: '#C28800',
          focus: '#ffc02d26'
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          main: '#144BD6',
          surface: '#E7EEFC',
          border: '#AECAFC',
          hover: '#0A51CE',
          pressed: '#06307C',
          focus: '#144bd626'
        },
        lilac: {
          50: '#f0e1ff',
          100: '#EBD7FF',
          600: '#8252E9',
          700: '#6f37e6',
          800: '#601eef',
        },
        digtek: {
          purple: '#6A47ED',      // Primary purple from reference
          lime: '#C6F806',        // Accent lime/neon green
          dark: '#17012C',        // Deep dark purple/black
          light: '#F6F3FE',       // Light lavender background
          gray: '#504E4E',        // Body text gray
        },
        brote: {
          base: '#1239ac',        // Blue
          primary: '#ffb400',     // Yellow/Orange
          gray: '#7b7d83',
          white: '#ffffff',
        }
      },
      animation: {
        blob: "blob 7s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
