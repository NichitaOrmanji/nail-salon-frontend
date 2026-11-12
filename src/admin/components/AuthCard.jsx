import { BrandLockup } from '../../components/BrandMark'

// Карточка страниц без входа: вход, регистрация салона, восстановление пароля
export default function AuthCard({ title, subtitle, children, onSubmit, wide = false }) {
  const Tag = onSubmit ? 'form' : 'div'
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--c-bg)' }}>
      <Tag
        onSubmit={onSubmit}
        noValidate={onSubmit ? true : undefined}
        className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} rounded-2xl p-6 space-y-4`}
        style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-line)' }}
      >
        <div className="flex flex-col items-center mb-2 text-center">
          {/* Панель общая для всех салонов — знак TimePoint, без логотипа конкретного салона */}
          <BrandLockup />
          <h1 className="text-ink text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </Tag>
    </div>
  )
}
