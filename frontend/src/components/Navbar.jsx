import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

const getNavLinks = (role) => {
  if (role === 'buyer') {
    return [
      { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
      { to: '/marketplace', label: 'Marketplace', icon: '🏪' },
      { to: '/profile', label: 'Profile', icon: '👤' },
    ]
  }
  return [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/soil', label: 'Soil Analysis', icon: '🌱' },
    { to: '/disease', label: 'Disease Detect', icon: '🔬' },
    { to: '/marketplace', label: 'Marketplace', icon: '🏪' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ]
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAuthenticated || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2" data-hover>
            <span className="text-2xl">🌿</span>
            <span className="font-display font-bold text-lg text-gradient hidden sm:block">
              Agro-Soil AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {getNavLinks(user?.role).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-hover
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-dark-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-dark-300">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              data-hover
              className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
            onClick={() => setIsOpen(!isOpen)}
            data-hover
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`h-0.5 bg-white rounded transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`h-0.5 bg-white rounded transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-white rounded transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-white/5"
          >
            <div className="p-4 flex flex-col gap-1">
              {getNavLinks(user?.role).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-dark-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { handleLogout(); setIsOpen(false) }}
                className="mt-2 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 text-left"
              >
                🚪 Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
