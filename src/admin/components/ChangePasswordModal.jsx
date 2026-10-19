import { useState } from 'react'
import Modal from './Modal'
import { Button, Field, TextInput, ErrorText } from './ui'
import { changePassword } from '../api/auth'

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
      setError('Новые пароли не совпадают')
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
      <Modal title="Сменить пароль" onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Готово</Button>}>
        <p className="text-white text-sm">Пароль изменён.</p>
      </Modal>
    )
  }

  return (
    <Modal title="Сменить пароль" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Старый пароль">
          <TextInput type="password" autoComplete="current-password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
        </Field>
        <Field label="Новый пароль">
          <TextInput type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </Field>
        <Field label="Повторите новый пароль">
          <TextInput type="password" autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {saving ? 'Сохраняем...' : 'Сменить пароль'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
