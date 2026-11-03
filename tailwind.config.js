import defaultColors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Цвета текста — из темы (src/theme.css): classic / «Море» светлая / «Море» тёмная.
        // Контраст ≥ 4,5 на всех поверхностях каждой темы — проверяется в e2e/a11y.spec.js
        white: 'var(--text)',
        gray: {
          ...defaultColors.gray,
          200: 'var(--text-soft)',
          300: 'var(--text-soft)',
          400: 'var(--text-muted)',
          500: 'var(--text-faint)',
          600: 'var(--text-faint-2)',
          700: 'var(--text-disabled)',
        },
        red: { ...defaultColors.red, 400: 'var(--danger-text)' },
        pink: { ...defaultColors.pink, 400: 'var(--accent-text)', 500: 'var(--accent)' },
      },
    },
  },
  plugins: [],
}
