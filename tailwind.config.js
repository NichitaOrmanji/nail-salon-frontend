import defaultColors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Цвета — из CSS-переменных темы (src/index.css). По умолчанию значения прежние (тёмная тема);
        // в светлой теме панели они меняются сами. Прозрачность (/80) с ними не работает — не использовать.
        // Тёмная тема: gray-500/600 подобраны под контраст ≥ 4,5 на фонах сайта (проверяется в e2e/a11y.spec.js)
        gray: {
          ...defaultColors.gray,
          200: 'var(--c-ink-1)',
          300: 'var(--c-ink-2)',
          400: 'var(--c-muted)',
          500: 'var(--c-faint)',
          600: 'var(--c-faint-2)',
        },
        // Основной текст: белый в тёмной теме, почти чёрный — в светлой. Текст на акценте — text-white
        ink: 'var(--c-ink)',
        red: { ...defaultColors.red, 400: 'var(--c-danger)' },
        amber: { ...defaultColors.amber, 200: 'var(--c-warn-soft)', 400: 'var(--c-warn)' },
        // Розовый = акцентный цвет (свой у сотрудника в панели, у салона — на сайте записи)
        pink: { ...defaultColors.pink, 300: 'var(--accent-ink-2)', 400: 'var(--accent-ink)', 500: 'var(--accent-500)' },
      },
    },
  },
  plugins: [],
}
