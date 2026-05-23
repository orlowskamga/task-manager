import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BoardView from './pages/BoardView'
import BoardSettings from './pages/BoardSettings'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import AdminPanel from './pages/AdminPanel'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/" /> : children
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/boards/:boardId" element={<PrivateRoute><BoardView /></PrivateRoute>} />
          <Route path="/boards/:boardId/settings" element={<PrivateRoute><BoardSettings /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
