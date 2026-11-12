import { useState } from 'react'
import Modal from './Modal'
import { Button, Field, TextInput, ErrorText } from './ui'
import { changePassword } from '../api/auth'
import { t } from '../../i18n'

export default function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = oldPassword && newPassword && repeat && !saving

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    if (newPassword !== repeat) {
      setError(t('Новые пароли не совпадают'))
      return
    }
    setError(null)
    setSaving(true)
    try {
      await changePassword(oldPassword, newPassword)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <Modal title={t('Сменить пароль')} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>{t('Готово')}</Button>}>
        <p className="text-ink text-sm">{t('Пароль изменён.')}</p>
      </Modal>
    )
  }

  return (
    <Modal title={t('Сменить пароль')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('Старый пароль')}>
          <TextInput type="password" autoComplete="current-password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
        </Field>
        <Field label={t('Новый пароль')}>
          <TextInput type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </Field>
        <Field label={t('Повторите новый пароль')}>
          <TextInput type="password" autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('Отмена')}</Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {saving ? t('Сохраняем...') : t('Сменить пароль')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
