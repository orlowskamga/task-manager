import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Dashboard() {
  const [boards, setBoards] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/api/boards/')
      setBoards(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBoards() }, [])

  const createBoard = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await api.post('/api/boards/', { name: newName.trim() })
      setNewName('')
      fetchBoards()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteBoard = async (id) => {
    if (!confirm('Na pewno usunąć tę tablicę?')) return
    try {
      await api.delete(`/api/boards/${id}`)
      fetchBoards()
    } catch (err) {
      console.error(err)
    }
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
      <h1 className="text-2xl font-bold mb-6">Moje tablice</h1>

      {/* Create board form */}
      <form onSubmit={createBoard} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nazwa nowej tablicy..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
        />
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Utwórz
        </button>
      </form>

      {/* Board list */}
      {boards.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-lg">Nie masz jeszcze żadnych tablic.</p>
          <p className="text-sm">Utwórz pierwszą powyżej!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
            >
              <Link to={`/boards/${board.id}`} className="block">
                <h2 className="font-semibold text-lg group-hover:text-brand-600 transition-colors">
                  {board.name}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Utworzona {new Date(board.created_at).toLocaleDateString('pl-PL')}
                </p>
              </Link>
              <button
                onClick={() => deleteBoard(board.id)}
                className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
