import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PRD v2 — tokens semânticos
        brand: {
          bg:      '#080808',
          surface: '#121212',
          elev:    '#1C1C1E',
          hover:   '#242426',
        },
        ink: {
          primary:   '#F5F5F5',
          secondary: '#A0A0A0',
          muted:     '#6B6B6B',
        },
        rise: {
          DEFAULT: '#FF6B2B',
          deep:    '#E55818',
          soft:    'rgba(255,107,43,0.12)',
          glow:    'rgba(255,107,43,0.35)',
        },
        blood: {
          DEFAULT: '#9E0B13',
          deep:    '#6B0008',
          soft:    'rgba(158,11,19,0.12)',
          glow:    'rgba(158,11,19,0.35)',
        },
        volt: {
          DEFAULT: '#DEFF9A',
          deep:    '#B8E07A',
          soft:    'rgba(222,255,154,0.15)',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Urbanist', 'sans-serif'],
        sans:    ['Urbanist', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        'tap':    '44px',
        'tap-lg': '64px',
      },
      minWidth: {
        'tap':    '44px',
        'tap-lg': '64px',
      },
      boxShadow: {
        'glow-rise':  '0 8px 24px rgba(255,107,43,0.35)',
        'glow-blood': '0 8px 24px rgba(158,11,19,0.35)',
        'glow-volt':  '0 8px 24px rgba(222,255,154,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
