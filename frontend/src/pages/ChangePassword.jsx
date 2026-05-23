import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'

export default function ChangePassword() {
  const toast = useToast()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Podaj aktualne hasło'
    if (form.newPassword.length < 6) errs.newPassword = 'Nowe hasło musi mieć co najmniej 6 znaków'
    if (form.newPassword !== form.newPasswordConfirm) errs.newPasswordConfirm = 'Nowe hasła nie są identyczne'
    if (form.currentPassword && form.currentPassword === form.newPassword) {
      errs.newPassword = 'Nowe hasło musi być inne niż aktualne'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: form.currentPassword,
        new_password: form.newPassword,
        new_password_confirm: form.newPasswordConfirm,
      })
      toast.success('Hasło zostało zmienione')
      setForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Błąd zmiany hasła'
      toast.error(typeof msg === 'string' ? msg : 'Błąd zmiany hasła')
      setErrors({ form: typeof msg === 'string' ? msg : 'Błąd zmiany hasła' })
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (field) =>
    `w-full border rounded-lg px-3 py-2 outline-none transition
     focus:ring-2 focus:ring-brand-500 focus:border-brand-500
     ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link to="/profile" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Profil
      </Link>
      <h1 className="text-2xl font-bold mb-6 mt-2">Zmiana hasła</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-4">
        {errors.form && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{errors.form}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Aktualne hasło</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            className={fieldClass('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nowe hasło</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={set('newPassword')}
            className={fieldClass('newPassword')}
            placeholder="min. 6 znaków"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Powtórz nowe hasło</label>
          <input
            type="password"
            value={form.newPasswordConfirm}
            onChange={set('newPasswordConfirm')}
            className={fieldClass('newPasswordConfirm')}
          />
          {errors.newPasswordConfirm && (
            <p className="text-red-500 text-xs mt-1">{errors.newPasswordConfirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Zmieniam...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  )
}
