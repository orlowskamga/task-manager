import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function Profile() {
  const { user, logout } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await api.patch('/api/users/me', { display_name: displayName })
      setSaved(true)
      // Reload page to refresh user context
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd zapisu')
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

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}
        {saved && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-2">Zapisano!</div>}

        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Zapisz
        </button>
      </form>
    </div>
  )
}
