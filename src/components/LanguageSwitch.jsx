import { LANGS, setLang, useLang } from '../i18n'

// Переключатель языка сайта записи: RU / RO
export default function LanguageSwitch({ className = '' }) {
  const lang = useLang()
  return (
    <div className={`inline-flex rounded-full p-0.5 text-xs font-semibold ${className}`} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="group" aria-label="Язык / Limba">
      {LANGS.map(code => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className="px-2.5 py-1.5 rounded-full transition-all"
          style={lang === code ? { backgroundColor: '#db2777', color: '#ffffff' } : { color: '#d1d5db' }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
