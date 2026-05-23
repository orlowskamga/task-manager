import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

function getDueDateInfo(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const now = new Date()
  const diffMs = due - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `${Math.abs(diffDays)} dni po terminie`, urgent: true }
  if (diffDays === 0) return { label: 'Termin dziś!', urgent: true }
  if (diffDays === 1) return { label: 'Termin jutro', urgent: false }
  return { label: `Za ${diffDays} dni`, urgent: false }
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [tasks, setTasks] = useState([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)

  // Pobierz liczbę powiadomień
  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/overdue-count')
      setCount(data.count)
    } catch {
      // ignore
    }
  }, [])

  // Pobierz szczegóły przy otwarciu
  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/api/notifications/upcoming?days=7')
      setTasks(data)
      setLoaded(true)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchCount()
    // Odświeżaj co 5 minut
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleToggle = () => {
    if (!open && !loaded) fetchTasks()
    setOpen((prev) => !prev)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative hover:text-brand-200 transition-colors p-1"
        title="Powiadomienia"
      >
        🔔
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Zbliżające się terminy</h3>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                Brak zadań z bliskim terminem 🎉
              </div>
            ) : (
              tasks.map((task) => {
                const info = getDueDateInfo(task.due_date)
                return (
                  <Link
                    key={task.id}
                    to={`/boards/${task.board_id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {info && (
                        <span className={`text-xs ${info.urgent ? 'text-red-600 font-semibold' : 'text-yellow-600'}`}>
                          📅 {info.label}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-xs text-gray-400">
                          👤 {task.assignee.display_name}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
