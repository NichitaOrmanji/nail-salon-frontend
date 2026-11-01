import defaultColors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Сайт тёмный: стандартные gray-500/600 на фонах #1a1a1a–#2e2e2e дают контраст 2–3,6,
        // а нужно не меньше 4,5 (WCAG AA) — вспомогательный текст плохо читается на телефоне.
        // Эти оттенки дают ≥ 4,6 на всех фонах сайта; проверяется в e2e/a11y.spec.js
        gray: { ...defaultColors.gray, 500: '#9098a4', 600: '#8b929e' },
      },
    },
  },
  plugins: [],
}
