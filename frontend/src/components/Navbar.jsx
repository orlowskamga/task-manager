import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-brand-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight hover:text-brand-200 transition-colors">
          📋 Task Manager
        </Link>

        {user && (
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="hover:text-brand-200 transition-colors">
              Tablice
            </Link>
            <Link to="/profile" className="hover:text-brand-200 transition-colors">
              {user.display_name}
            </Link>
            <button
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
            >
              Wyloguj
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
