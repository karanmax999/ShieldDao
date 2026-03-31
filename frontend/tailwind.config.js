/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0A0B0D',
          secondary: '#111318',
          card: '#161920',
          'card-hover': '#1C2028',
        },
        border: { DEFAULT: '#1E2330', active: '#2A3347' },
        amber: { DEFAULT: '#F5A623', dim: '#8B5E14', glow: 'rgba(245,166,35,0.15)' },
        jade: { DEFAULT: '#2ECC71', dim: '#1A7A43' },
        red: { DEFAULT: '#E74C3C', dim: '#8B2B20' },
        text: { primary: '#E8EAF0', secondary: '#6B7A99', muted: '#3D4A63' },
        // shadcn-compatible aliases
        background: '#0A0B0D',
        foreground: '#E8EAF0',
        primary: { DEFAULT: '#F5A623', foreground: '#0A0B0D' },
        secondary: { DEFAULT: '#161920', foreground: '#E8EAF0' },
        muted: { DEFAULT: '#111318', foreground: '#6B7A99' },
        accent: { DEFAULT: '#1C2028', foreground: '#E8EAF0' },
        ring: '#F5A623',
        input: '#1E2330',
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        scan: 'scan 1s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,166,35,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245,166,35,0)' },
        },
        scan: {
          from: { width: '0%' },
          to: { width: 'var(--target-width)' },
        },
      },
    },
  },
  plugins: [],
}
