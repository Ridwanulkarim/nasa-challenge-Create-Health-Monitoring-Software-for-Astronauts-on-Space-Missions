/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030712',
          900: '#070d1d',
          850: '#0b132b',
          800: '#0d172b',
          700: '#121e38',
          600: '#1a2a4d',
        },
        cyan: {
          glow: '#00f0ff',
          dim: 'rgba(0, 240, 255, 0.12)',
        },
        hud: {
          normal: '#34d399',
          warning: '#ffab00',
          critical: '#ff1744',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Share Tech Mono"', '"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 16px rgba(0, 240, 255, 0.35)',
        'normal-glow': '0 0 10px rgba(52, 211, 153, 0.25)',
        'warning-glow': '0 0 12px rgba(255, 171, 0, 0.35)',
        'critical-glow': '0 0 16px rgba(255, 23, 68, 0.45)',
      }
    },
  },
  plugins: [],
}
