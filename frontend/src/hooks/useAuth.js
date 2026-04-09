import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore()

  const login = async (emailOrPhone, password) => {
    try {
      const { data } = await api.post('/auth/login', {
        email_or_phone: emailOrPhone,
        password,
      })
      setAuth(data.user, data.access_token, data.refresh_token)
      toast.success(`Welcome back, ${data.user.name}!`)
      return data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      toast.error(msg)
      throw err
    }
  }

  const register = async (formData) => {
    try {
      const { data } = await api.post('/auth/register', formData)
      setAuth(data.user, data.access_token, data.refresh_token)
      toast.success('Account created successfully!')
      return data
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(msg)
      throw err
    }
  }

  const logout = () => {
    storeLogout()
    toast.success('Logged out successfully')
  }

  return { user, isAuthenticated, login, register, logout }
}
