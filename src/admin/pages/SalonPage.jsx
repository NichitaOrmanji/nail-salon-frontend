import SalonOverview from '../components/SalonOverview'
import SalonForm from '../components/SalonForm'

// «О салоне»: как салон видят клиенты, ссылка и QR, шаги настройки; данные салона — справа (на телефоне — ниже)
export default function SalonPage() {
  return (
    <div className="px-4 md:px-6 py-5 max-w-6xl">
      <div className="grid gap-8 xl:grid-cols-2 items-start">
        <div className="min-w-0"><SalonOverview asPage /></div>
        <div className="min-w-0"><SalonForm part="info" /></div>
      </div>
    </div>
  )
}
