import { useState } from 'react'
import MasterCard from '../components/MasterCard'

const MASTERS = [
  { id: 1, name: 'Анна Иванова', specialty: 'Маникюр, педикюр' },
  { id: 2, name: 'Мария Петрова', specialty: 'Наращивание ногтей' },
  { id: 3, name: 'Елена Сидорова', specialty: 'Гель-лак, дизайн' },
]

export default function BookingPage() {
  const [selectedMaster, setSelectedMaster] = useState(null)

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Онлайн запись</h2>
        <p className="text-gray-500 mt-1">Выберите мастера, услугу и удобное время</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Шаг 1 — Выберите мастера</h3>
          <div className="grid grid-cols-1 gap-3">
            {MASTERS.map(master => (
              <MasterCard
                key={master.id}
                master={master}
                selected={selectedMaster?.id === master.id}
                onSelect={setSelectedMaster}
              />
            ))}
          </div>
          {selectedMaster && (
            <p className="mt-4 text-sm text-pink-600 font-medium">
              ✓ Выбран: {selectedMaster.name}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Шаг 2 — Выберите услугу</h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Шаг 3 — Выберите дату и время</h3>
        </div>
      </div>
    </main>
  )
}