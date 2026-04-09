import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useWeather } from '../hooks/useWeather'
import { useLocation } from '../hooks/useLocation'
import { pageVariants, scrollReveal, cardHover, cardHoverOut, countUp } from '../utils/animations'
import api from '../utils/api'

const SEASONS = { Kharif: { months: [6,7,8,9,10], crops: ['Rice','Cotton','Maize'] }, Rabi: { months: [11,12,1,2,3], crops: ['Wheat','Chickpea','Lentil'] }, Zaid: { months: [3,4,5,6], crops: ['Watermelon','Muskmelon','Cucumber'] } }

function getCurrentSeason() {
  const m = new Date().getMonth() + 1
  for (const [name, info] of Object.entries(SEASONS)) {
    if (info.months.includes(m)) return { name, crops: info.crops }
  }
  return { name: 'Kharif', crops: ['Rice','Cotton','Maize'] }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { lat, lon } = useLocation()
  const { weather } = useWeather(lat, lon)
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [feed, setFeed] = useState([])
  const statsRef = useRef([])
  const season = getCurrentSeason()

  useEffect(() => {
    if (user?.id) {
      api.get(`/profile/summary/${user.id}`).then(r => setSummary(r.data)).catch(() => {})
      api.get(`/profile/activity-feed/${user.id}`).then(r => setFeed(r.data?.slice(0,5) || [])).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    scrollReveal('.stat-card', 0.12)
    scrollReveal('.quick-action', 0.1)
  }, [])

  useEffect(() => {
    if (summary) {
      const vals = [summary.total_recommendations, summary.total_listings, summary.total_listings, summary.total_earnings]
      statsRef.current.forEach((el, i) => { if (el && vals[i]) countUp(el, vals[i]) })
    }
  }, [summary])

  const quickActions = [
    { icon: '🌱', title: 'Analyse Soil', desc: 'Get AI crop recommendations', to: '/soil', color: 'from-emerald-500/20 to-emerald-600/5' },
    { icon: '🔬', title: 'Detect Disease', desc: 'Identify plant diseases instantly', to: '/disease', color: 'from-amber-500/20 to-amber-600/5' },
    { icon: '🏪', title: 'Sell Crop', desc: 'List your harvest for sale', to: '/marketplace', color: 'from-blue-500/20 to-blue-600/5' },
  ]

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto"
    >
      {/* Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Namaste, <span className="text-gradient">{user?.name || (user?.role === 'buyer' ? 'Buyer' : 'Farmer')}</span> 🙏
          </h1>
          <p className="text-dark-200 mt-1">Here's your farming overview for today</p>
        </div>

        {/* Weather card */}
        {weather && (
          <div className="glass-card p-4 flex items-center gap-4 min-w-[260px]">
            <div className="text-3xl">
              {weather.description?.includes('rain') ? '🌧' : weather.description?.includes('cloud') ? '☁' : '☀'}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-white">{Math.round(weather.temperature)}°C</p>
              <p className="text-xs text-dark-400">{weather.city || 'Your Location'}</p>
              <div className="flex gap-3 mt-1 text-xs text-dark-300">
                <span>💧 {weather.humidity}%</span>
                <span>🌬 {weather.wind_speed} km/h</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ...(user?.role === 'farmer' ? [
            { label: 'Total Analyses', val: summary?.total_recommendations || 0, icon: '📊', color: 'text-emerald-400' },
            { label: 'Crops Recommended', val: summary?.total_recommendations || 0, icon: '🌾', color: 'text-yellow-400' },
          ] : [
            { label: 'Purchases', val: summary?.total_transactions || 0, icon: '🛍', color: 'text-amber-400' }
          ]),
          { label: user?.role === 'farmer' ? 'Active Listings' : 'Orders Viewed', val: summary?.total_listings || 0, icon: '🏷', color: 'text-blue-400' },
          { label: user?.role === 'farmer' ? 'Total Earnings' : 'Total Spent', val: summary?.total_earnings || 0, icon: '💰', color: 'text-green-400', prefix: '₹' },
          ...(user?.role === 'farmer' ? [
            { label: 'Total Kg Sold', val: summary?.total_kg_sold || 0, icon: '📦', color: 'text-orange-400', suffix: ' kg' }
          ] : []),
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-dark-200 text-xs">{stat.label}</p>
            <p className={`font-display font-bold text-2xl ${stat.color}`}>
              {stat.prefix || ''}
              <span ref={(el) => { if (el && i < statsRef.current.length) { statsRef.current[i] = el } }}>0</span>
              {stat.suffix || ''}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="section-title mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(user?.role === 'buyer' ? [
            { icon: '🛒', title: 'Browse Marketplace', desc: 'Shop fresh crops directly from farmers', to: '/marketplace', color: 'from-blue-500/20 to-blue-600/5' }
        ] : quickActions).map((a, i) => (
          <div
            key={i}
            className={`quick-action glass-card p-6 bg-gradient-to-br ${a.color} cursor-pointer`}
            onClick={() => navigate(a.to)}
            onMouseEnter={(e) => cardHover(e.currentTarget)}
            onMouseLeave={(e) => cardHoverOut(e.currentTarget)}
            data-hover
          >
            <span className="text-3xl">{a.icon}</span>
            <h3 className="font-display font-bold text-lg text-white mt-3">{a.title}</h3>
            <p className="text-dark-100 text-sm mt-1">{a.desc}</p>
          </div>
        ))}
      </div>

      {user?.role === 'farmer' && (
      <>
        {/* Season Banner */}
        <div className="glass-card p-6 mb-8 bg-gradient-to-r from-primary-500/10 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🌦</span>
            <h3 className="font-display font-semibold text-lg">{season.name} Season</h3>
            <span className="badge-green text-xs">Current</span>
          </div>
          <p className="text-dark-300 text-sm mb-3">Top crops for this season:</p>
          <div className="flex gap-2 flex-wrap">
            {season.crops.map((c) => (
              <span key={c} className="badge bg-primary-500/10 text-primary-300 border border-primary-500/20 text-sm px-4 py-1.5">
                {c}
              </span>
            ))}
          </div>
        </div>
      </>
      )}

      {/* Activity Feed */}
      {feed.length > 0 && (
        <>
          <h2 className="section-title mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {feed.map((event, i) => (
              <div key={i} className="glass-card p-4 flex items-start gap-4">
                <span className="text-2xl mt-0.5">{event.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-dark-800 text-dark-300 text-xs">{event.event_type?.replace('_', ' ')}</span>
                    <p className="font-medium text-sm text-white">{event.title}</p>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{event.description}</p>
                </div>
                <span className="text-xs text-dark-500 whitespace-nowrap">
                  {event.created_at ? new Date(event.created_at).toLocaleDateString('en-IN') : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}
