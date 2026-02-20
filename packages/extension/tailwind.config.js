/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        hover: 'var(--bg-hover)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        border: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        accent: 'var(--accent)',
      },
      backgroundColor: {
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        hover: 'var(--bg-hover)',
      },
      borderColor: {
        border: 'var(--border)',
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
