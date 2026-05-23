import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!email.trim()) errs.email = 'Podaj adres email'
    if (!password) errs.password = 'Podaj hasło'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await login(email, password)
      toast.success('Zalogowano pomyślnie!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Błąd logowania'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Zaloguj się</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-4">
          {errors.form && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">
              {errors.form}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
              className={`w-full border rounded-lg px-3 py-2 outline-none transition
                focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="jan@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
              className={`w-full border rounded-lg px-3 py-2 outline-none transition
                focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Loguję...' : 'Zaloguj'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Nie masz konta?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
