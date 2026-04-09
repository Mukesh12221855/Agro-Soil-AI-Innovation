import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { pageVariants } from '../utils/animations'

export default function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!emailOrPhone.trim()) e.emailOrPhone = 'Email or phone is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(emailOrPhone, password)
      navigate('/dashboard')
    } catch {
      // toast already shown by useAuth
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen flex"
    >
      {/* Left: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/assets/login_bg.png"
          alt="Indian farmland"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/fallback.jpg' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 to-transparent" />
        <div className="absolute bottom-12 left-12">
          <h2 className="font-display text-4xl font-bold text-white mb-2">
            Welcome to<br /><span className="text-gradient">Agro-Soil AI</span>
          </h2>
          <p className="text-dark-300 text-sm max-w-sm">
            Empowering Indian farmers with AI-driven soil analysis, crop recommendations, and marketplace.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="glass-card-light p-8 sm:p-10 w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🌿</span>
            <h1 className="font-display text-2xl font-bold text-white">Sign In</h1>
            <p className="text-dark-400 text-sm mt-1">Access your farming dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="floating-label-group">
                <input
                  id="login-email"
                  type="text"
                  placeholder=" "
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="input-field"
                />
                <label htmlFor="login-email" className="floating-label">Email or Phone</label>
              </div>
              {errors.emailOrPhone && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >{errors.emailOrPhone}</motion.p>
              )}
            </div>

            <div>
              <div className="floating-label-group relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                />
                <label htmlFor="login-password" className="floating-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-dark-400 hover:text-white text-sm"
                  data-hover
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >{errors.password}</motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-hover
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium" data-hover>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
