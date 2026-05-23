import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import api from '../api/client'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('Nazwa nie może być pusta')
      return
    }
    setSubmitting(true)
    try {
      await api.patch('/api/users/me', { display_name: displayName.trim() })
      toast.success('Profil zaktualizowany')
      await refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd zapisu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="text"
            disabled
            value={user?.email || ''}
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rola</label>
          <input
            type="text"
            disabled
            value={user?.role === 'admin' ? 'Administrator' : 'Członek zespołu'}
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Wyświetlana nazwa</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Zapisuję...' : 'Zapisz'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/change-password"
          className="text-sm text-brand-600 hover:underline font-medium"
        >
          Zmień hasło →
        </Link>
      </div>
    </div>
  )
}
