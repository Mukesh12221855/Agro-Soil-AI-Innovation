import { useEffect } from 'react'
import { useWeatherStore } from '../store/weatherStore'
import api from '../utils/api'

export function useWeather(lat, lon) {
  const { weather, loading, error, setWeather, setLoading, setError } = useWeatherStore()

  useEffect(() => {
    if (lat == null || lon == null) return
    if (weather && !loading) return

    const fetchWeather = async () => {
      setLoading()
      try {
        const { data } = await api.get(`/weather?lat=${lat}&lon=${lon}`)
        setWeather(data)
      } catch (err) {
        setError(err.message || 'Failed to fetch weather')
      }
    }
    fetchWeather()
  }, [lat, lon])

  return { weather, loading, error }
}
