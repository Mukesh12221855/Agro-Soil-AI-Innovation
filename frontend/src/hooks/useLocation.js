import { useState, useEffect } from 'react'

export function useLocation() {
  const [location, setLocation] = useState({ lat: null, lon: null, error: null })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 20.5937, lon: 78.9629, error: 'Geolocation not supported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          error: null,
        })
      },
      (err) => {
        // Default to center of India
        setLocation({ lat: 20.5937, lon: 78.9629, error: err.message })
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }, [])

  return location
}
