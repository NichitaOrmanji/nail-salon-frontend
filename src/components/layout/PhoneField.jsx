import { useState } from 'react'

const COUNTRIES = [
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Молдова' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Румыния' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Россия' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Украина' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Германия' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Италия' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'Франция' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Великобритания' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'США' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Турция' },
]

export default function PhoneField({ value, onChange }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [localNumber, setLocalNumber] = useState('')

  function handleCountrySelect(country) {
    setSelectedCountry(country)
    setDropdownOpen(false)
    onChange(country.dial + localNumber)
  }

  function handleNumberChange(e) {
    const num = e.target.value.replace(/[^0-9]/g, '')
    setLocalNumber(num)
    onChange(selectedCountry.dial + num)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-4 relative" style={{ borderBottom: '1px solid #2e2e2e' }}>

      {/* Выбор страны */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1 text-sm flex-shrink-0"
        type="button"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-gray-400">{selectedCountry.dial}</span>
        <span className="text-gray-600 text-xs">▾</span>
      </button>

      {/* Разделитель */}
      <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: '#3a3a3a' }} />

      {/* Номер */}
      <input
        type="tel"
        placeholder="___ __ ___"
        value={localNumber}
        onChange={handleNumberChange}
        className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
      />

      {/* Дропдаун */}
      {dropdownOpen && (
        <div
          className="absolute top-full left-0 z-50 rounded-2xl overflow-y-auto shadow-xl"
          style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #2e2e2e',
            minWidth: '220px',
            maxHeight: '240px'
          }}
        >
          {COUNTRIES.map(country => (
            <button
              key={country.code}
              onClick={() => handleCountrySelect(country)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all"
              style={{
                backgroundColor: selectedCountry.code === country.code ? '#2e2e2e' : 'transparent'
              }}
              type="button"
            >
              <span className="text-lg">{country.flag}</span>
              <span className="text-white text-sm">{country.name}</span>
              <span className="text-gray-500 text-sm ml-auto">{country.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}