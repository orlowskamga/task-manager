import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Do zrobienia' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'done', label: 'Zrobione' },
]

export default function TaskModal({ task, members, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
    assignee_id: task?.assignee_id || '',
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Tytuł jest wymagany'
    if (form.title.length > 300) errs.title = 'Tytuł max 300 znaków'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload = {
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    }
    // Status tylko przy edycji — nowe zadania zawsze startują jako "todo"
    if (task) {
      payload.status = form.status
    }
    onSave(payload)
  }

  // Zamknij na Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold mb-4">
          {task ? 'Edytuj zadanie' : 'Nowe zadanie'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tytuł *</label>
            <input
              type="text"
              required
              autoFocus
              value={form.title}
              onChange={set('title')}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition
                ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Co trzeba zrobić?"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opis</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={set('description')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition resize-none"
              placeholder="Szczegóły, notatki..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Priorytet</label>
              <select
                value={form.priority}
                onChange={set('priority')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
              >
                <option value="low">⚪ Niski</option>
                <option value="medium">🟡 Średni</option>
                <option value="high">🔴 Wysoki</option>
              </select>
            </div>

            {task && (
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Termin</label>
              <input
                type="datetime-local"
                value={form.due_date}
                onChange={set('due_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Przypisz do</label>
            <select
              value={form.assignee_id}
              onChange={set('assignee_id')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
            >
              <option value="">— brak —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Metadane przy edycji */}
          {task && (
            <div className="text-[10px] text-gray-300 pt-1 space-y-0.5">
              <p>Utworzono: {new Date(task.created_at).toLocaleString('pl-PL')}</p>
              <p>Ostatnia zmiana: {new Date(task.updated_at).toLocaleString('pl-PL')}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {task ? 'Zapisz zmiany' : 'Utwórz'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Anuluj
            </button>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full text-sm text-red-400 hover:text-red-600 transition-colors pt-1"
            >
              Usuń to zadanie
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
