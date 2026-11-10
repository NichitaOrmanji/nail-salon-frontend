// Знак TimePoint «дуга и точка» — тот же, что на лендинге
export default function BrandMark({ size = 40, color = 'currentColor', accent = '#ec4899' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 8a24 24 0 1 0 24 24" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <circle cx="50" cy="14" r="7" fill={accent} />
    </svg>
  )
}

// Знак + название: шапка страниц входа и регистрации
export function BrandLockup() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-4 text-white">
      <BrandMark size={34} />
      <span className="text-lg font-extrabold tracking-tight">TimePoint</span>
    </div>
  )
}
