import { create } from 'zustand'

export const useWeatherStore = create((set) => ({
  weather: null,
  loading: false,
  error: null,

  setWeather: (weather) => set({ weather, loading: false, error: null }),
  setLoading: () => set({ loading: true, error: null }),
  setError: (error) => set({ error, loading: false }),
}))
