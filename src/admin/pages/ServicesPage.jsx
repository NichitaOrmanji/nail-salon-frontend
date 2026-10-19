import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchStaffServices, createService, updateService, fetchCategories, createCategory, renameCategory, deleteCategory } from '../api/services'
import { normalizeDecimal } from '../utils/time'
import { formatDuration, formatPrice } from '../../utils/format'
import Modal from '../components/Modal'
import { Button, Checkbox, ErrorText, Field, PageHeader, Select, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'

function ServiceModal({ service, categories, onClose, onSaved }) {
  const isEdit = !!service
  const [name, setName] = useState(service?.name || '')
  const [category, setCategory] = useState(service?.category ? String(service.category) : '')
  const [duration, setDuration] = useState(service ? String(service.duration) : '60')
  const [price, setPrice] = useState(service ? String(Number(service.price)) : '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const durationNum = Number(duration)
    const priceStr = normalizeDecimal(price)
    if (!name.trim()) return setError('Укажите название')
    if (!Number.isInteger(durationNum) || durationNum < 5 || durationNum > 600) return setError('Длительность — от 5 до 600 минут')
    if (priceStr === '' || Number.isNaN(Number(priceStr)) || Number(priceStr) < 0) return setError('Укажите цену (число не меньше 0)')

    const body = {
      name: name.trim(),
      category: category ? Number(category) : null,
      duration: durationNum,
      price: priceStr,
    }
    setError(null)
    setSaving(true)
    try {
      if (isEdit) await updateService(service.id, body)
      else await createService(body)
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Изменить услугу' : 'Новая услуга'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" type="submit" form="service-form" disabled={saving}>
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Название">
          <TextInput value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Категория">
          <Select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Без категории</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Длительность, мин">
            <TextInput type="number" inputMode="numeric" min={5} max={600} step={5} value={duration} onChange={e => setDuration(e.target.value)} />
          </Field>
          <Field label="Цена, L">
            <TextInput inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
      </form>
    </Modal>
  )
}

function CategoriesModal({ categories, onClose, onChanged }) {
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null) // { id, name }
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setError(null)
    setBusy(true)
    try {
      await action()
      onChanged()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    if (await run(() => createCategory(newName.trim()))) setNewName('')
  }

  async function handleRename() {
    if (!editing.name.trim()) return
    if (await run(() => renameCategory(editing.id, editing.name.trim()))) setEditing(null)
  }

  function handleDelete(c) {
    if (!window.confirm(`Удалить категорию «${c.name}»? Услуги останутся без категории.`)) return
    run(() => deleteCategory(c.id))
  }

  return (
    <Modal title="Категории" onClose={onClose}>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <TextInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Новая категория" className="flex-1 min-w-0" />
        <Button type="submit" variant="primary" disabled={busy || !newName.trim()}>Добавить</Button>
      </form>
      <ErrorText className="mb-3">{error}</ErrorText>
      {categories.length === 0 && <p className="text-gray-500 text-sm">Категорий пока нет</p>}
      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="rounded-xl px-3 py-2 flex flex-wrap items-center gap-2" style={{ backgroundColor: '#242424' }}>
            {editing?.id === c.id ? (
              <>
                <TextInput value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="flex-1 min-w-[140px]" />
                <Button variant="primary" disabled={busy} onClick={handleRename}>Сохранить</Button>
                <Button disabled={busy} onClick={() => setEditing(null)}>Отмена</Button>
              </>
            ) : (
              <>
                <span className="flex-1 min-w-0 text-white text-sm break-words">{c.name}</span>
                <Button disabled={busy} onClick={() => setEditing({ id: c.id, name: c.name })}>Переименовать</Button>
                <Button variant="danger" disabled={busy} onClick={() => handleDelete(c)}>Удалить</Button>
              </>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function ServicesPage() {
  const { isManager } = useStaffAuth()
  const [services, setServices] = useState(null)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [showHidden, setShowHidden] = useState(false)
  const [editing, setEditing] = useState(null) // { service } | { service: null } для новой
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    return Promise.all([fetchStaffServices(), fetchCategories()])
      .then(([s, c]) => {
        setServices(s)
        setCategories(c)
        setError(null)
      })
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Группы по категориям; «Без категории» — в конце
  const groups = useMemo(() => {
    if (!services) return []
    const visible = services.filter(s => showHidden || s.is_active)
    const result = categories.map(c => ({ key: `c${c.id}`, name: c.name, items: visible.filter(s => s.category === c.id) }))
    const known = new Set(categories.map(c => c.id))
    const rest = visible.filter(s => s.category === null || s.category === undefined || !known.has(s.category))
    if (rest.length) result.push({ key: 'none', name: 'Без категории', items: rest })
    return result.filter(g => g.items.length || isManager)
  }, [services, categories, showHidden, isManager])

  async function toggleActive(s) {
    setActionError(null)
    setBusyId(s.id)
    try {
      await updateService(s.id, { is_active: !s.is_active })
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const hiddenCount = services ? services.filter(s => !s.is_active).length : 0

  return (
    <div className="px-4 md:px-6 py-5 max-w-4xl">
      <PageHeader title="Услуги" subtitle={isManager ? 'Скрытые услуги не видны на сайте записи' : 'Только просмотр'}>
        {isManager && (
          <>
            <Button onClick={() => setCategoriesOpen(true)}>Категории</Button>
            <Button variant="primary" onClick={() => setEditing({ service: null })}>+ Услуга</Button>
          </>
        )}
      </PageHeader>

      <Checkbox checked={showHidden} onChange={setShowHidden} label={`Показать скрытые${hiddenCount ? ` (${hiddenCount})` : ''}`} className="mb-3" />

      <ErrorText className="mb-3">{error || actionError}</ErrorText>
      {!services && !error && <Spinner />}

      {services && groups.length === 0 && <p className="text-gray-500 text-sm py-6">Услуг пока нет</p>}

      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.key}>
            <h2 className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-2">{group.name}</h2>
            {group.items.length === 0 && <p className="text-gray-600 text-sm">Нет услуг</p>}
            <div className="space-y-2">
              {group.items.map(s => (
                <div
                  key={s.id}
                  className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2"
                  style={{ backgroundColor: '#242424', opacity: s.is_active ? 1 : 0.6 }}
                >
                  <div className="flex-1 min-w-[160px]">
                    <div className="text-white text-sm font-medium break-words">
                      {s.name}
                      {!s.is_active && <span className="text-gray-500 font-normal"> · скрыта</span>}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">{formatDuration(s.duration)} · {formatPrice(s.price)}</div>
                  </div>
                  {isManager && (
                    <div className="flex gap-2">
                      <Button onClick={() => setEditing({ service: s })}>Изменить</Button>
                      <Button disabled={busyId === s.id} onClick={() => toggleActive(s)}>
                        {s.is_active ? 'Скрыть' : 'Вернуть'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <ServiceModal
          service={editing.service}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
      {categoriesOpen && (
        <CategoriesModal categories={categories} onClose={() => setCategoriesOpen(false)} onChanged={load} />
      )}
    </div>
  )
}
