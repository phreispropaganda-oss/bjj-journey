import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      'var(--bg-base)',
          surface: 'var(--surface-1)',
          elev:    'var(--surface-2)',
          hover:   'var(--surface-3)',
        },
        ink: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        rise: {
          DEFAULT: 'var(--rise)',
          deep:    'var(--rise-deep)',
          soft:    'var(--rise-soft)',
          glow:    'var(--rise-glow)',
        },
        blood: {
          DEFAULT: 'var(--blood)',
          deep:    'var(--blood-deep)',
          soft:    'var(--blood-soft)',
          glow:    'var(--blood-glow)',
        },
        volt: {
          DEFAULT: 'var(--volt)',
          deep:    'var(--volt-deep)',
          soft:    'var(--volt-soft)',
        },
        border: {
          DEFAULT: 'var(--border)',
          soft:    'var(--border-soft)',
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
        'glow-rise':  '0 8px 24px var(--rise-glow)',
        'glow-blood': '0 8px 24px var(--blood-glow)',
        'glow-volt':  '0 8px 24px var(--volt-soft)',
      },
    },
  },
  plugins: [],
}

export default config
