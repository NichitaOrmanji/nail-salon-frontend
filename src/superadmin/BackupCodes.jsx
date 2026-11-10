import { useState } from 'react'
import { Button } from '../admin/components/ui'

// Резервные коды показываются один раз: их нужно сохранить (каждый действует один раз)
export default function BackupCodes({ codes, onDone, doneLabel = 'Я сохранил коды' }) {
  const [copied, setCopied] = useState(false)
  const text = codes.join('\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch { /* буфер недоступен — коды видны на экране */ }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([`TimePoint — резервные коды супер-админки\n\n${text}\n`], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'timepoint-backup-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">
        Если телефон с приложением потеряется, войти можно резервным кодом. Каждый код действует один раз.
        Сохраните их в надёжном месте — больше они не покажутся.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-base" aria-label="Резервные коды">
        {codes.map(code => (
          <li key={code} className="rounded-xl px-3 py-2 text-center text-white" style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e' }}>
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy}>{copied ? 'Скопировано' : 'Скопировать'}</Button>
        <Button onClick={download}>Скачать файлом</Button>
        <Button variant="primary" className="ml-auto" onClick={onDone}>{doneLabel}</Button>
      </div>
    </div>
  )
}
