import { clearStaffTokens } from '../api/staffClient'
import { endImpersonation, readImpersonation } from '../utils/impersonation'

// Красная полоса, пока супер-админ TimePoint работает в панели салона от имени владельца
export default function ImpersonationBar({ me }) {
  if (!me?.impersonated_by) return null
  const info = readImpersonation()
  const until = info?.expires_at ? new Date(info.expires_at) : null
  const pad = n => String(n).padStart(2, '0')

  function exit() {
    clearStaffTokens()
    window.location.assign(endImpersonation() || '/superadmin')
  }

  return (
    <div role="status" className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-2"
      style={{ backgroundColor: '#7f1d1d', borderBottom: '1px solid var(--c-danger)' }}>
      <span className="flex-1 min-w-0 text-sm text-white">
        Вы в салоне «{me.company?.name}» как поддержка TimePoint ({me.impersonated_by}).
        {until && ` Сессия до ${pad(until.getHours())}:${pad(until.getMinutes())}.`} Вход записан в журнал супер-админки.
      </span>
      <button type="button" onClick={exit} className="min-h-[36px] px-4 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: '#ffffff', color: '#7f1d1d' }}>
        Выйти из салона
      </button>
    </div>
  )
}
