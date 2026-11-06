// «Добавить в календарь»: файл .ics с визитом (время салона, без часового пояса — как на сайте)

function stamp(date, time) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function escapeText(value) {
  return String(value || '').replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n')
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + (Number(minutes) || 60), 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// { title, date: 'YYYY-MM-DD', start: 'HH:MM', end?: 'HH:MM', duration?: минуты, location?, description? }
export function downloadIcs({ title, date, start, end, duration, location, description }) {
  const finish = end || addMinutes(start, duration)
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TimePoint//Booking//RU', 'BEGIN:VEVENT',
    `UID:${stamp(date, start)}-${Math.random().toString(36).slice(2)}@timepoint.tech`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(date, start)}`, `DTEND:${stamp(date, finish)}`,
    `SUMMARY:${escapeText(title)}`,
    location ? `LOCATION:${escapeText(location)}` : null,
    description ? `DESCRIPTION:${escapeText(description)}` : null,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `visit-${date}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
