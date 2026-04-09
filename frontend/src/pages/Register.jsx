import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { pageVariants } from '../utils/animations'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export default function Register() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', state: '', role: 'farmer',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Valid phone number required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    if (!form.state) e.state = 'Select your state'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch {
      // handled by hook
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen flex"
    >
      {/* Left image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/assets/register_bg.png"
          alt="Indian farmland"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/fallback.jpg' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 to-transparent" />
        <div className="absolute bottom-12 left-12">
          <h2 className="font-display text-4xl font-bold text-white mb-2">
            Join <span className="text-gradient">Agro-Soil AI</span>
          </h2>
          <p className="text-dark-300 text-sm max-w-sm">
            Get AI-powered crop recommendations, real-time market prices, and sell your harvest directly.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="glass-card-light p-8 sm:p-10 w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">🌾</span>
            <h1 className="font-display text-2xl font-bold text-white">Create Account</h1>
            <p className="text-dark-400 text-sm mt-1">Start your smart farming journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <input id="reg-name" placeholder="Full Name" value={form.name} onChange={set('name')} className="input-field" />
              {errors.name && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.name}</motion.p>}
            </div>

            {/* Phone */}
            <div>
              <input id="reg-phone" placeholder="Phone Number" value={form.phone} onChange={set('phone')} className="input-field" />
              {errors.phone && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.phone}</motion.p>}
            </div>

            {/* Email */}
            <div>
              <input id="reg-email" type="email" placeholder="Email Address" value={form.email} onChange={set('email')} className="input-field" />
              {errors.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.email}</motion.p>}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 6 chars)"
                value={form.password} onChange={set('password')}
                className="input-field pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-dark-400 hover:text-white text-sm" data-hover
              >{showPassword ? '🙈' : '👁'}</button>
              {errors.password && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.password}</motion.p>}
            </div>

            {/* State */}
            <div>
              <select id="reg-state" value={form.state} onChange={set('state')} className="input-field">
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mt-1">{errors.state}</motion.p>}
            </div>

            {/* Role toggle */}
            <div className="flex items-center gap-2 p-1 bg-dark-900 rounded-xl">
              {['farmer', 'buyer'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.role === r
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-dark-400 hover:text-white'
                  }`}
                  data-hover
                >
                  {r === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
                </button>
              ))}
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2" data-hover
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-dark-400 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium" data-hover>Sign In</Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
