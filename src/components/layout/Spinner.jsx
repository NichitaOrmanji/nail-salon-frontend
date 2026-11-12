import { t } from '../../i18n'
export default function Spinner({ text = t('Загрузка...') }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent-ink)', borderTopColor: 'transparent' }}
      />
      <span className="text-gray-400 text-sm">{text}</span>
    </div>
  )
}