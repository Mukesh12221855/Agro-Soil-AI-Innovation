import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { splashAnimation, floatingLeaves } from '../utils/animations'

const LEAF_SVG = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <path d="M20 4c-2 8-10 14-16 16 6 2 14 2 16 16 2-14 10-14 16-16-6-2-14-8-16-16z" fill="#1D9E75" />
  </svg>
)

export default function Splash() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    splashAnimation()
    floatingLeaves()

    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/dashboard' : '/login')
    }, 3200)

    return () => clearTimeout(timer)
  }, [])

  const title = 'Agro-Soil AI'

  return (
    <div className="splash-bg fixed inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Floating leaves */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="leaf" style={{ left: `${Math.random() * 100}%` }}>
          {LEAF_SVG}
        </div>
      ))}

      {/* Title */}
      <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extrabold glow-green mb-4 flex">
        {title.split('').map((char, i) => (
          <span key={i} className="splash-letter inline-block" style={{ display: char === ' ' ? 'inline' : undefined }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <p className="splash-subtitle text-primary-200/70 text-lg sm:text-xl font-medium tracking-wide">
        Intelligent Farming for Bharat
      </p>

      {/* Loading dots */}
      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-400/60 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
