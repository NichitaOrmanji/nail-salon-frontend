import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/layout/Spinner'
import Modal from '../admin/components/Modal'
import { Button, ErrorText, Field, TextArea, TextInput } from '../admin/components/ui'
import { fetchSalon, impersonateSalon, salonAction } from './api'
import { saveStaffTokens, clearStaffTokens } from '../admin/api/staffClient'
import { startImpersonation } from '../admin/utils/impersonation'
import { ACTIONS, TRIAL, ago, formatDate, formatWhen } from './common'
import { Panel, StatusPill } from './ui'

const ROLES = { owner: 'Владелец', admin: 'Администратор', master: 'Мастер' }
const STEPS = {
  email: 'Email подтверждён', salon: 'Адрес и телефон', services: 'Услуги', masters: 'Мастера с услугами',
  schedule: 'Рабочие дни', telegram: 'Telegram подключён',
}

function Info({ label, children }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-white text-sm break-words">{children}</div>
    </div>
  )
}

function BlockDialog({ onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Заблокировать салон" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-gray-300 text-sm">
          Сайт записи салона станет недоступен клиентам, сотрудники не смогут войти в панель. Данные сохраняются,
          разблокировать можно в любой момент.
        </p>
        <Field label="Причина (видна только в журнале)">
          <TextInput autoFocus value={reason} onChange={e => setReason(e.target.value)} maxLength={300} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="danger" disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim())}>Заблокировать</Button>
        </div>
      </div>
    </Modal>
  )
}

function TrialDialog({ salon, onClose, onConfirm, busy }) {
  const [until, setUntil] = useState('')
  const [tomorrow] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  return (
    <Modal title="Продлить пробный период" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-gray-300 text-sm">
          Сейчас: {salon.trial_ends_at ? `до ${formatDate(salon.trial_ends_at)}` : 'без пробного периода'}.
          Продление считается от конца текущего периода, а если он уже кончился — от сегодня.
        </p>
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30].map(days => (
            <Button key={days} disabled={busy} onClick={() => onConfirm({ days })}>+{days} дней</Button>
          ))}
        </div>
        <Field label="Или до даты">
          <div className="flex gap-2">
            <TextInput type="date" min={tomorrow} value={until} onChange={e => setUntil(e.target.value)} />
            <Button variant="primary" disabled={busy || !until} onClick={() => onConfirm({ until })}>Сохранить</Button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}

// Карточка салона: данные, сотрудники, настройка, действия поддержки, заметки, журнал
export default function SalonPage() {
  const { id } = useParams()
  const [salon, setSalon] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null) // block | trial
  const [notice, setNotice] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchSalon(id).then(setSalon).catch(err => setError(err.message))
  }, [id])

  async function run(action, data, done) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setSalon(await salonAction(id, action, data))
      setDialog(null)
      if (done) setNotice(done)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function openPanel() {
    if (!window.confirm(`Открыть панель салона «${salon.name}» от имени владельца?\n\n`
      + 'Сессия — 1 час, вход записывается в журнал. Если в этом браузере открыта ваша собственная панель салона, из неё произойдёт выход.')) return
    setBusy(true)
    setError(null)
    try {
      const data = await impersonateSalon(id)
      clearStaffTokens()
      saveStaffTokens({ access: data.access })
      startImpersonation({ salonId: data.salon.id, name: data.salon.name, expires_at: data.expires_at })
      window.location.assign('/admin-panel')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (!salon) return error ? <ErrorText>{error}</ErrorText> : <Spinner />
  const owner = salon.owner

  return (
    <>
      <Link to="/superadmin/salons" className="text-sm text-gray-400 hover:underline">‹ Все салоны</Link>
      <Panel>
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-white text-xl font-semibold">{salon.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <StatusPill status={salon.status} />
              <span className="text-gray-400 text-sm">{TRIAL[salon.trial]}{salon.trial_ends_at ? ` до ${formatDate(salon.trial_ends_at)}` : ''}</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <a href={salon.url} target="_blank" rel="noopener noreferrer"
              className="min-h-[44px] px-4 rounded-xl text-sm font-medium inline-flex items-center"
              style={{ backgroundColor: '#242424', color: '#fff', border: '1px solid #2e2e2e' }}>Сайт салона ↗</a>
            {salon.status !== 'blocked' && salon.owner && (
              <Button variant="primary" disabled={busy} onClick={openPanel}>Открыть панель салона</Button>
            )}
            <Button disabled={busy} onClick={() => setDialog('trial')}>Продлить пробный</Button>
            {salon.status === 'blocked'
              ? <Button variant="primary" disabled={busy} onClick={() => run('status', { status: 'active' }, 'Салон разблокирован')}>Разблокировать</Button>
              : <Button variant="danger" disabled={busy} onClick={() => setDialog('block')}>Заблокировать</Button>}
          </div>
        </div>
        {notice && <p role="status" className="text-sm mt-3" style={{ color: '#34d399' }}>{notice}</p>}
        {error && <ErrorText className="mt-3">{error}</ErrorText>}
      </Panel>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Данные" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Info label="Адрес сайта">{salon.slug}</Info>
            <Info label="Зарегистрирован">{formatDate(salon.created_at)}</Info>
            <Info label="Последняя активность">{ago(salon.last_activity_at)}</Info>
            <Info label="Телефон салона">{salon.phone || '—'}</Info>
            <Info label="Адрес">{salon.address || '—'}</Info>
            <Info label="Условия приняты">{formatDate(salon.terms_accepted_at)}</Info>
            <Info label="Мастера / услуги">{salon.masters} / {salon.services}</Info>
            <Info label="Записей всего">{salon.appointments}</Info>
            <Info label="Записей за 30 дней">{salon.appointments_month}</Info>
          </div>
        </Panel>

        <Panel title="Владелец">
          {owner ? (
            <div className="space-y-3">
              <Info label="Логин">{owner.username}</Info>
              <Info label="Email">{owner.email ? <a href={`mailto:${owner.email}`} style={{ color: '#f472b6' }}>{owner.email}</a> : '—'}</Info>
              {!salon.email_configured && <p className="text-xs" style={{ color: '#fbbf24' }}>Почта сервера не настроена — письма не уйдут</p>}
              <div className="flex flex-col gap-2">
                {salon.status === 'pending' && (
                  <Button disabled={busy || !owner.email} onClick={() => run('resend-verification', {}, `Письмо подтверждения отправлено на ${owner.email}`)}>
                    Отправить письмо подтверждения ещё раз
                  </Button>
                )}
                {salon.status === 'pending' && (
                  <Button disabled={busy} onClick={() => {
                    const reason = window.prompt('Подтвердить email вручную? Салон сразу станет виден клиентам. Делайте так, только если уверены, что адрес принадлежит владельцу (например, письмо не дошло из-за сбоя почты).\n\nПричина (для журнала):', 'Письмо не дошло')
                    if (reason !== null) run('verify', { reason }, 'Email подтверждён вручную — салон открыт для клиентов')
                  }}>
                    Подтвердить email вручную
                  </Button>
                )}
                <Button disabled={busy || !owner.email}
                  onClick={() => window.confirm(`Отправить владельцу на ${owner.email} ссылку для смены пароля? Текущий пароль продолжит работать, пока он не задаст новый.`)
                    && run('password-reset', {}, `Ссылка для сброса пароля отправлена на ${owner.email}`)}>
                  Отправить ссылку для сброса пароля
                </Button>
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm">Владелец не назначен</p>}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Сотрудники" className="lg:col-span-2">
          {salon.staff.length === 0 ? <p className="text-gray-400 text-sm">Нет сотрудников с входом</p> : (
            <ul className="divide-y divide-[#2e2e2e]">
              {salon.staff.map(s => (
                <li key={s.username} className="py-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-white">{s.username}{s.email && s.email !== s.username ? <span className="text-gray-500"> · {s.email}</span> : null}</span>
                  <span className="text-gray-400">{ROLES[s.role] || s.role} · {s.last_login ? `вход ${formatWhen(s.last_login)}` : 'не входил'}{!s.is_active && ' · отключён'}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Настройка салона">
          <ul className="space-y-1.5 text-sm">
            {salon.setup.map(step => (
              <li key={step.key} className="flex items-center gap-2">
                <span aria-hidden="true" style={{ color: step.done ? '#34d399' : '#6b7280' }}>{step.done ? '✓' : '○'}</span>
                <span className={step.done ? 'text-white' : 'text-gray-400'}>{STEPS[step.key] || step.key}</span>
                <span className="sr-only">{step.done ? 'готово' : 'не сделано'}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Заметки поддержки">
          <form className="space-y-2 mb-4" onSubmit={async e => {
            e.preventDefault()
            if (await run('note', { text: note })) setNote('')
          }}>
            <TextArea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Например: звонил, помогли настроить график" aria-label="Новая заметка" maxLength={2000} />
            <div className="flex justify-end"><Button type="submit" variant="primary" disabled={busy || !note.trim()}>Добавить</Button></div>
          </form>
          {salon.notes.length === 0 ? <p className="text-gray-500 text-sm">Заметок нет</p> : (
            <ul className="space-y-2">
              {salon.notes.map(n => (
                <li key={n.id} className="rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: '#242424' }}>
                  <div className="text-gray-500 text-xs">{formatWhen(n.at)} · {n.author || '—'}</div>
                  <div className="text-gray-200 whitespace-pre-wrap">{n.text}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="История действий">
          {salon.log.length === 0 ? <p className="text-gray-500 text-sm">Действий пока не было</p> : (
            <ul className="space-y-2 text-sm">
              {salon.log.map(e => (
                <li key={e.id}>
                  <div className="text-white">{ACTIONS[e.action] || e.action}</div>
                  <div className="text-gray-500 text-xs">
                    {formatWhen(e.at)} · {e.user || '—'}
                    {e.details?.reason ? ` · причина: ${e.details.reason}` : ''}
                    {e.details?.to ? ` · до ${formatDate(e.details.to)}` : ''}
                    {e.details?.email ? ` · ${e.details.email}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {dialog === 'block' && (
        <BlockDialog busy={busy} onClose={() => setDialog(null)}
          onConfirm={reason => run('status', { status: 'blocked', reason }, 'Салон заблокирован')} />
      )}
      {dialog === 'trial' && (
        <TrialDialog salon={salon} busy={busy} onClose={() => setDialog(null)}
          onConfirm={data => run('trial', data, 'Пробный период продлён')} />
      )}
    </>
  )
}
