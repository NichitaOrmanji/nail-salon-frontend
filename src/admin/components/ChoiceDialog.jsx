import Modal from './Modal'
import { Button } from './ui'

// Вопрос с несколькими вариантами: choices — [{ value, label, variant }]; onChoose(null) — передумали
export default function ChoiceDialog({ title, children, choices, onChoose }) {
  return (
    <Modal title={title} onClose={() => onChoose(null)}>
      <div className="text-gray-300 text-sm space-y-2">{children}</div>
      <div className="flex flex-col gap-2 mt-5">
        {choices.map(c => (
          <Button key={c.value} variant={c.variant || 'secondary'} onClick={() => onChoose(c.value)}>{c.label}</Button>
        ))}
        <Button variant="ghost" onClick={() => onChoose(null)}>Назад</Button>
      </div>
    </Modal>
  )
}
