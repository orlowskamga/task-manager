import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.displayName.trim()) errs.displayName = 'Podaj imię lub nick'
    if (!form.email.trim()) errs.email = 'Podaj adres email'
    if (form.password.length < 6) errs.password = 'Hasło musi mieć co najmniej 6 znaków'
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = 'Hasła nie są identyczne'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await register(form.email, form.password, form.passwordConfirm, form.displayName)
      toast.success('Konto utworzone — witaj!')
    } catch (err) {
      const detail = err.response?.data?.detail
      let msg = 'Błąd rejestracji'
      if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.message || d.msg || JSON.stringify(d)).join('; ')
      }
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = (field) =>
    `w-full border rounded-lg px-3 py-2 outline-none transition
     focus:ring-2 focus:ring-brand-500 focus:border-brand-500
     ${errors[field] ? 'border-red-400' : 'border-gray-300'}`

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Rejestracja</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-4">
          {errors.form && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">
              {errors.form}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Imię / Nick</label>
            <input
              type="text"
              value={form.displayName}
              onChange={set('displayName')}
              className={fieldClass('displayName')}
              placeholder="Jan Kowalski"
            />
            {errors.displayName && (
              <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className={fieldClass('email')}
              placeholder="jan@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hasło</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              className={fieldClass('password')}
              placeholder="min. 6 znaków"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Powtórz hasło</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={set('passwordConfirm')}
              className={fieldClass('passwordConfirm')}
              placeholder="••••••••"
            />
            {errors.passwordConfirm && (
              <p className="text-red-500 text-xs mt-1">{errors.passwordConfirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Rejestruję...' : 'Utwórz konto'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Masz już konto?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
