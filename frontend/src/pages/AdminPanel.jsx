import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import api from '../api/client'

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/api/users/'),
        api.get('/api/users/stats'),
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      toast.error('Błąd ładowania danych')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    try {
      await api.patch(`/api/users/${userId}/role?role=${newRole}`)
      toast.success(`Rola zmieniona na ${newRole === 'admin' ? 'Administrator' : 'Członek'}`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd zmiany roli')
    }
  }

  const deleteUser = async (userId, name) => {
    if (!confirm(`Na pewno usunąć użytkownika "${name}"? Tej operacji nie można cofnąć.`)) return
    try {
      await api.delete(`/api/users/${userId}`)
      toast.success('Użytkownik usunięty')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd usuwania')
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-lg text-gray-500">Brak uprawnień. Ta strona jest dostępna tylko dla administratorów.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Panel administratora</h1>

      {/* Statystyki */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-brand-600">{stats.total_users}</p>
            <p className="text-xs text-gray-400 mt-1">Użytkownicy</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-brand-600">{stats.total_boards}</p>
            <p className="text-xs text-gray-400 mt-1">Tablice</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-brand-600">{stats.total_tasks}</p>
            <p className="text-xs text-gray-400 mt-1">Zadania</p>
          </div>
        </div>
      )}

      {/* Lista użytkowników */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-sm text-gray-700">Użytkownicy ({users.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                  {u.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {u.display_name}
                    {u.id === currentUser.id && (
                      <span className="text-xs text-gray-400 ml-1">(Ty)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full
                  ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {u.role === 'admin' ? 'Admin' : 'Członek'}
                </span>

                {u.id !== currentUser.id && (
                  <>
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      className="text-xs text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      {u.role === 'admin' ? 'Degraduj' : 'Awansuj'}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.display_name)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Usuń
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
