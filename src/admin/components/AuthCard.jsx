// Карточка страниц без входа: вход, регистрация салона, восстановление пароля
export default function AuthCard({ title, subtitle, children, onSubmit, wide = false }) {
  const Tag = onSubmit ? 'form' : 'div'
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#111111' }}>
      <Tag
        onSubmit={onSubmit}
        noValidate={onSubmit ? true : undefined}
        className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} rounded-2xl p-6 space-y-4`}
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
      >
        <div className="flex flex-col items-center mb-2 text-center">
          {/* Панель общая для всех салонов — без логотипа конкретного салона */}
          <div className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center text-white text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, #db2777, #9333ea)' }} aria-hidden="true">
            TP
          </div>
          <h1 className="text-white text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {children}
      </Tag>
    </div>
  )
}
