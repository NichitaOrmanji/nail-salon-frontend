import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import PeriodPicker from '../components/PeriodPicker'
import ReportTab from '../components/finance/ReportTab'
import CashTab from '../components/finance/CashTab'
import SalariesTab from '../components/finance/SalariesTab'
import { presetRange } from '../utils/money'

const TABS = [
  { key: 'report', label: 'Отчёт' },
  { key: 'cash', label: 'Касса' },
  { key: 'salaries', label: 'Зарплаты' },
]

// Финансы салона (только владелец): отчёт за период, касса за день, зарплаты мастеров
export default function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some(t => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'report'
  const [range, setRange] = useState(() => presetRange('month'))

  return (
    <div className="px-4 md:px-6 py-5 max-w-6xl">
      <PageHeader title="Финансы" subtitle="Видит только владелец салона" />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #2e2e2e' }} role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setSearchParams({ tab: t.key }, { replace: true })}
              className="min-h-[44px] px-4 text-sm font-medium"
              style={{ backgroundColor: tab === t.key ? '#f472b6' : '#242424', color: tab === t.key ? '#ffffff' : '#9ca3af' }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'cash' && <PeriodPicker value={range} onChange={setRange} />}
      </div>
      {tab === 'report' && <ReportTab range={range} />}
      {tab === 'cash' && <CashTab />}
      {tab === 'salaries' && <SalariesTab range={range} />}
    </div>
  )
}
