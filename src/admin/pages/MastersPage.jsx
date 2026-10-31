import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchStaffMasters, createMaster, updateMaster, hideMaster, uploadMasterPhoto, deleteMasterPhoto } from '../api/masters'
import { fetchStaffServices } from '../api/services'
import { notifyDataChanged } from '../utils/events'
import { WEEKDAYS_SHORT } from '../utils/time'
import Modal from '../components/Modal'
import { Button, Checkbox, ErrorText, Field, PageHeader, TextArea, TextInput } from '../components/ui'
import { Section, ScheduleSection, DaysOffSection, AccessSection } from '../components/masters/MasterSections'
import PhotoField from '../components/PhotoField'
import MonthSchedule from '../components/masters/MonthSchedule'
import Spinner from '../../components/layout/Spinner'

// Скрыть мастера; при будущих записях бэк отвечает 400 { count } — переспрашиваем
async function hideWithConfirm(master) {
  try {
    await hideMaster(master.id)
    return true
  } catch (err) {
    const count = err.data?.count
    if (err.status === 400 && count) {
      const ok = window.confirm(`У мастера ${count} будущих записей — их нужно перенести или отменить. Всё равно скрыть?`)
      if (!ok) return false
      await hideMaster(master.id, { force: true })
      return true
    }
    throw err
  }
}

// Краткий график: «Пн–Пт 10:00–19:00» не собираем, просто рабочие дни
function scheduleSummary(schedule) {
  if (!Array.isArray(schedule)) return ''
  const working = schedule.filter(s => s.is_working).sort((a, b) => a.day_of_week - b.day_of_week)
  if (!working.length) return 'Нет рабочих дней'
  return working.map(s => `${WEEKDAYS_SHORT[s.day_of_week]} ${s.start_time}–${s.end_time}`).join(', ')
}

function ProfileSection({ master, services, onSaved }) {
  const isNew = !master
  const linked = new Set(master?.services || [])
  const [name, setName] = useState(master?.name || '')
  const [description, setDescription] = useState(master?.description || '')
  const [selected, setSelected] = useState(() => new Set(services.filter(s => s.is_active && linked.has(s.id)).map(s => s.id)))
  const [isActive, setIsActive] = useState(master ? master.is_active : true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const activeServices = services.filter(s => s.is_active)
  // Скрытые услуги, к которым мастер привязан: бэк сохраняет эти связи сам
  const hiddenLinked = services.filter(s => !s.is_active && linked.has(s.id))

  function toggleService(id, on) {
    setDone(false)
    setSelected(prev => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Укажите имя')
      return
    }
    setError(null)
    setSaving(true)
    const body = { name: name.trim(), description: description.trim(), services: [...selected] }
    try {
      let saved
      if (isNew) {
        saved = await createMaster({ ...body, is_active: isActive })
      } else {
        if (isActive && !master.is_active) body.is_active = true
        saved = await updateMaster(master.id, body)
        // Скрытие — через DELETE: бэк проверяет будущие записи
        if (!isActive && master.is_active) {
          const hidden = await hideWithConfirm(master)
          if (!hidden) setIsActive(true)
        }
      }
      setDone(true)
      notifyDataChanged()
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Профиль">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Имя">
          <TextInput value={name} onChange={e => { setName(e.target.value); setDone(false) }} />
        </Field>
        <Field label="Описание">
          <TextArea value={description} onChange={e => { setDescription(e.target.value); setDone(false) }} />
        </Field>
        <div>
          <div className="text-gray-400 text-xs font-medium mb-1">Услуги</div>
          {activeServices.length === 0 && <p className="text-gray-500 text-sm">Активных услуг нет</p>}
          <div className="grid sm:grid-cols-2 gap-x-4">
            {activeServices.map(s => (
              <Checkbox key={s.id} checked={selected.has(s.id)} onChange={on => toggleService(s.id, on)} label={s.name} />
            ))}
          </div>
          {hiddenLinked.length > 0 && (
            <div className="mt-2">
              {hiddenLinked.map(s => (
                <Checkbox key={s.id} checked disabled label={<>{s.name} <span className="text-gray-500">· услуга скрыта, связь сохраняется</span></>} />
              ))}
            </div>
          )}
        </div>
        <Checkbox checked={isActive} onChange={v => { setIsActive(v); setDone(false) }} label="Активен (виден на сайте записи)" />
        <ErrorText>{error}</ErrorText>
        <div className="flex items-center justify-end gap-3">
          {done && <span className="text-xs" style={{ color: '#34d399' }}>Сохранено</span>}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Сохраняем...' : isNew ? 'Создать мастера' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Section>
  )
}

function MasterModal({ master, services, onClose, onChanged, onCreated }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleToggleHidden() {
    setError(null)
    setBusy(true)
    try {
      if (master.is_active) {
        await hideWithConfirm(master)
      } else {
        await updateMaster(master.id, { is_active: true })
      }
      notifyDataChanged()
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={master ? master.name : 'Новый мастер'} onClose={onClose} maxWidth="sm:max-w-2xl">
      <div className="space-y-4">
        <ProfileSection
          key={master ? `${master.id}-${master.is_active}` : 'new'}
          master={master}
          services={services}
          onSaved={saved => (master ? onChanged() : onCreated(saved))}
        />
        {master && (
          <>
            <Section title="Фото">
              <PhotoField
                hint="Показывается клиентам при выборе мастера. Сохраняется сразу."
                url={master.photo}
                shape="round"
                maxSide={800}
                onUpload={async file => { await uploadMasterPhoto(master.id, file); onChanged() }}
                onRemove={async () => { await deleteMasterPhoto(master.id); onChanged() }}
              />
            </Section>
            <ScheduleSection key={`schedule-${master.id}`} master={master} onSaved={onChanged} />
            <DaysOffSection master={master} />
            <AccessSection key={`access-${master.id}`} master={master} onChanged={onChanged} />
            <Section title={master.is_active ? 'Скрыть мастера' : 'Мастер скрыт'}>
              <p className="text-gray-500 text-xs mb-3">
                {master.is_active
                  ? 'Скрытый мастер пропадает с сайта записи и теряет доступ в панель. Записи сохраняются.'
                  : 'Мастер не виден на сайте записи.'}
              </p>
              <ErrorText className="mb-3">{error}</ErrorText>
              <Button variant={master.is_active ? 'danger' : 'secondary'} disabled={busy} onClick={handleToggleHidden}>
                {master.is_active ? 'Скрыть мастера' : 'Вернуть мастера'}
              </Button>
            </Section>
          </>
        )}
      </div>
    </Modal>
  )
}

export default function MastersPage() {
  const { isManager } = useStaffAuth()
  const [masters, setMasters] = useState(null)
  const [services, setServices] = useState(null)
  const [error, setError] = useState(null)
  // { id } — открыт мастер, { id: null } — новый
  const [modal, setModal] = useState(null)
  // Вкладка в адресе (?tab=schedules), чтобы после обновления страницы остаться на ней
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'schedules' ? 'schedules' : 'masters'

  const load = useCallback(() => {
    return Promise.all([fetchStaffMasters(), fetchStaffServices()])
      .then(([m, s]) => {
        setMasters(m)
        setServices(s)
        setError(null)
      })
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const serviceNames = id => services?.find(s => s.id === id)?.name

  // Мастер видит только себя — страница «Мой график», всё только для чтения
  if (!isManager) {
    const self = masters?.[0]
    return (
      <div className="px-4 md:px-6 py-5 max-w-3xl">
        <PageHeader title="Мой график" subtitle="Изменить график может администратор салона" />
        <ErrorText className="mb-3">{error}</ErrorText>
        {!masters && !error && <Spinner />}
        {masters && !self && <p className="text-gray-500 text-sm">Профиль мастера не найден</p>}
        {self && (
          <div className="space-y-4">
            <Section title={self.name}>
              {self.description && <p className="text-gray-400 text-sm mb-2 whitespace-pre-line">{self.description}</p>}
              <p className="text-gray-500 text-xs">
                Услуги: {(self.services || []).map(serviceNames).filter(Boolean).join(', ') || '—'}
              </p>
            </Section>
            <ScheduleSection key={JSON.stringify(self.schedule)} master={self} readOnly />
            <Section title="График по датам">
              <MonthSchedule masters={[self]} readOnly />
            </Section>
            <DaysOffSection master={self} readOnly />
          </div>
        )}
      </div>
    )
  }

  const active = masters ? masters.filter(m => m.is_active) : []
  const hidden = masters ? masters.filter(m => !m.is_active) : []
  const modalMaster = modal?.id ? masters?.find(m => m.id === modal.id) : null

  function renderCard(m) {
    return (
      <button
        key={m.id}
        type="button"
        onClick={() => setModal({ id: m.id })}
        className="w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
        style={{ backgroundColor: '#242424', opacity: m.is_active ? 1 : 0.55 }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {m.photo && <img src={m.photo} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />}
          <span className="text-white text-sm font-semibold break-words">{m.name}</span>
          {!m.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}>скрыт</span>}
          {m.has_access && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2e2e2e', color: '#34d399' }}>доступ в панель</span>}
        </div>
        <div className="text-gray-500 text-xs mt-1 break-words">{scheduleSummary(m.schedule)}</div>
        <div className="text-gray-600 text-xs mt-0.5 break-words">
          {(m.services || []).map(serviceNames).filter(Boolean).join(', ') || 'Нет услуг'}
        </div>
      </button>
    )
  }

  return (
    <div className="px-4 md:px-6 py-5 max-w-4xl">
      <PageHeader title="Мастера" subtitle="График, выходные и доступ в панель">
        {tab === 'masters' && (
          <Button variant="primary" disabled={!services} onClick={() => setModal({ id: null })}>+ Мастер</Button>
        )}
      </PageHeader>

      <div className="flex gap-2 mb-5" role="tablist" aria-label="Разделы">
        {[['masters', 'Мастера'], ['schedules', 'Графики']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setSearchParams(key === 'masters' ? {} : { tab: key }, { replace: true })}
            className="px-4 min-h-[40px] rounded-xl text-sm font-medium"
            style={tab === key ? { backgroundColor: '#f472b6', color: '#fff' } : { backgroundColor: '#242424', color: '#d1d5db' }}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorText className="mb-3">{error}</ErrorText>
      {!masters && !error && <Spinner />}

      {masters && tab === 'schedules' && <MonthSchedule masters={masters} />}

      {masters && tab === 'masters' && (
        <div className="space-y-6">
          <div className="space-y-2">
            {active.length === 0 && <p className="text-gray-500 text-sm">Активных мастеров нет</p>}
            {active.map(renderCard)}
          </div>
          {hidden.length > 0 && (
            <section>
              <h2 className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-2">Скрытые</h2>
              <div className="space-y-2">{hidden.map(renderCard)}</div>
            </section>
          )}
        </div>
      )}

      {modal && services && (modal.id === null || modalMaster) && (
        <MasterModal
          master={modalMaster}
          services={services}
          onClose={() => setModal(null)}
          onChanged={load}
          onCreated={saved => {
            load().then(() => {
              if (saved?.id) setModal({ id: saved.id })
            })
          }}
        />
      )}
    </div>
  )
}
