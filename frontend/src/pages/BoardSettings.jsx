import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import api from '../api/client'

export default function BoardSettings() {
  const { boardId } = useParams()
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [board, setBoard] = useState(null)
  const [boardName, setBoardName] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [boardRes, usersRes] = await Promise.all([
        api.get(`/api/boards/${boardId}`),
        api.get('/api/users/'),
      ])
      setBoard(boardRes.data)
      setBoardName(boardRes.data.name)
      setAllUsers(usersRes.data)
    } catch (err) {
      toast.error('Błąd ładowania danych')
    } finally {
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => { fetchData() }, [fetchData])

  const isOwner = board && (board.owner_id === currentUser?.id || currentUser?.role === 'admin')
  const memberIds = new Set(board?.members?.map((m) => m.id) || [])
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id))

  const saveName = async (e) => {
    e.preventDefault()
    if (!boardName.trim()) return
    try {
      await api.patch(`/api/boards/${boardId}`, { name: boardName.trim() })
      toast.success('Nazwa zmieniona')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd zapisu')
    }
  }

  const addMember = async (userId) => {
    try {
      await api.post(`/api/boards/${boardId}/members/${userId}`)
      toast.success('Członek dodany')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd dodawania')
    }
  }

  const removeMember = async (userId, name) => {
    if (!confirm(`Usunąć "${name}" z tablicy?`)) return
    try {
      await api.delete(`/api/boards/${boardId}/members/${userId}`)
      toast.success('Członek usunięty')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd usuwania')
    }
  }

  const deleteBoard = async () => {
    if (!confirm('Na pewno usunąć tę tablicę? Wszystkie zadania zostaną usunięte.')) return
    try {
      await api.delete(`/api/boards/${boardId}`)
      toast.success('Tablica usunięta')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Błąd usuwania')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!board) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/boards/${boardId}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Powrót do tablicy
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Ustawienia tablicy</h1>

      {/* Nazwa tablicy */}
      {isOwner && (
        <form onSubmit={saveName} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <label className="block text-sm font-medium mb-2">Nazwa tablicy</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Zapisz
            </button>
          </div>
        </form>
      )}

      {/* Członkowie */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-sm text-gray-700">
            Członkowie tablicy ({board.members?.length || 0})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {board.members?.map((m) => (
            <div key={m.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                  {m.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {m.display_name}
                    {m.id === board.owner_id && (
                      <span className="text-xs text-purple-500 ml-1">👑 właściciel</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
              {isOwner && m.id !== board.owner_id && (
                <button
                  onClick={() => removeMember(m.id, m.display_name)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Usuń
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dodaj członka */}
      {isOwner && nonMembers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700">Dodaj członka</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {nonMembers.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold">
                    {u.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.display_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => addMember(u.id)}
                  className="text-xs bg-brand-50 text-brand-600 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  + Dodaj
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strefa niebezpieczna */}
      {isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <h2 className="font-semibold text-sm text-red-600 mb-2">Strefa niebezpieczna</h2>
          <p className="text-xs text-gray-400 mb-3">
            Usunięcie tablicy jest nieodwracalne. Wszystkie zadania zostaną usunięte.
          </p>
          <button
            onClick={deleteBoard}
            className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Usuń tę tablicę
          </button>
        </div>
      )}
    </div>
  )
}
