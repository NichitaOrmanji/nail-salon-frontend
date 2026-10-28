import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchClients } from '../api/clients'
import { formatMoney } from '../utils/money'
import { clientDate } from '../utils/time'
import { REBOOK_KEY } from '../utils/rebook'
import ClientCardModal from '../components/clients/ClientCardModal'
import { Button, ErrorText, PageHeader, Select, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'

const SORTS = [
  { key: 'last', label: 'Недавние' },
  { key: 'visits', label: 'Больше визитов' },
  { key: 'paid', label: 'Больше оплатили' },
  { key: 'name', label: 'По имени' },
]

function ClientRow({ client: c, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(c.phone)}
      className="w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
      style={{ backgroundColor: '#242424' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-white text-sm font-semibold break-words">{c.name || 'Без имени'}</span>
        <span className="text-gray-400 text-xs">{c.phone}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
        <span className="text-gray-400">Визитов: {c.visits}</span>
        {c.paid !== '0.00' && <span className="text-gray-400">Оплачено: {formatMoney(c.paid)}</span>}
        {c.last_visit && <span className="text-gray-500">Был(а): {clientDate(c.last_visit)}</span>}
        {c.next_visit && <span style={{ color: '#34d399' }}>Запись: {clientDate(c.next_visit)}</span>}
        {c.no_shows > 0 && <span style={{ color: '#f87171' }}>Не пришёл: {c.no_shows}</span>}
      </div>
    </button>
  )
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('') // отправленный запрос (с задержкой после ввода)
  const [sort, setSort] = useState('last')
  const [data, setData] = useState(null) // { count, results, page }
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  // Карточку можно открыть из журнала: navigate('/admin-panel/clients', { state: { phone } })
  const [openPhone, setOpenPhone] = useState(() => location.state?.phone || null)
  const requestRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const id = ++requestRef.current
    fetchClients({ q: search, sort, page: 1 })
      .then(result => {
        if (id !== requestRef.current) return
        setData({ ...result, page: 1 })
        setError(null)
      })
      .catch(err => { if (id === requestRef.current) setError(err.message) })
  }, [search, sort])

  async function loadMore() {
    const id = requestRef.current
    setLoadingMore(true)
    try {
      const result = await fetchClients({ q: search, sort, page: data.page + 1 })
      if (id !== requestRef.current) return
      setData(prev => ({ ...result, results: [...prev.results, ...result.results], page: prev.page + 1 }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  function closeCard() {
    setOpenPhone(null)
    // Карточка, открытая из журнала, не должна открыться снова при обновлении страницы
    if (location.state?.phone) navigate(location.pathname, { replace: true, state: null })
  }

  function rebook(card) {
    try {
      sessionStorage.setItem(REBOOK_KEY, JSON.stringify({ phone: card.phone, name: card.name }))
    } catch { /* без хранилища откроется пустая форма */ }
    navigate('/admin-panel')
  }

  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title="Клиенты" subtitle={data ? `Всего: ${data.count}` : 'Все, кто записывался в салон'} />
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <TextInput
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Имя или телефон"
          aria-label="Поиск клиента"
        />
        <Select value={sort} onChange={e => setSort(e.target.value)} aria-label="Сортировка" className="sm:max-w-[200px]">
          {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
      </div>

      <ErrorText className="mb-3">{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && data.results.length === 0 && (
        <p className="text-gray-500 text-sm">{search ? 'Никого не нашли' : 'Клиенты появятся после первых записей'}</p>
      )}
      {data && (
        <div className="space-y-2">
          {data.results.map(c => <ClientRow key={c.phone} client={c} onOpen={setOpenPhone} />)}
        </div>
      )}
      {data && data.results.length < data.count && (
        <div className="flex justify-center mt-4">
          <Button disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Загружаем...' : 'Показать ещё'}</Button>
        </div>
      )}

      {openPhone && <ClientCardModal phone={openPhone} onClose={closeCard} onRebook={rebook} />}
    </div>
  )
}
