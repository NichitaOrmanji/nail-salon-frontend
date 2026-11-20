import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchMasters } from '../api/masters'
import { useBooking } from '../context/BookingContext'
import { bookingSource, rememberSource } from '../utils/source'
import Spinner from '../components/layout/Spinner'

// Личная ссылка мастера (<сайт>/m/anna или /m/12): сразу запись к нему
export default function MasterLinkPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { reset, setMaster } = useBooking()

  useEffect(() => {
    let cancelled = false
    const key = String(slug || '').toLowerCase()
    fetchMasters()
      .then(list => {
        if (cancelled) return
        const master = list.find(m => (m.link_slug && m.link_slug === key) || String(m.id) === key)
        if (!master) {
          navigate('/', { replace: true })
          return
        }
        // Метка из адреса (?from=stories) важнее: ссылку мастера могли выложить в сторис
        if (!bookingSource()) rememberSource('master')
        reset()
        setMaster(master)
        navigate('/services', { replace: true })
      })
      .catch(() => { if (!cancelled) navigate('/', { replace: true }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  )
}
