import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CropCard from '../components/CropCard'
import MarketChart from '../components/MarketChart'
import { pageVariants, scrollReveal } from '../utils/animations'
import api from '../utils/api'

export default function CropResult() {
  const loc = useRouterLocation()
  const navigate = useNavigate()
  const data = loc.state
  const [trend, setTrend] = useState([])

  useEffect(() => {
    if (!data) { navigate('/soil'); return }
    scrollReveal('.fert-section', 0.1)
    scrollReveal('.market-section', 0.1)

    if (data.recommendations?.[0]?.crop) {
      api.get(`/market/trend/${data.recommendations[0].crop}`).then(r => setTrend(r.data)).catch(() => {})
    }
  }, [data])

  if (!data) return null
  const { recommendations = [], fertilizer, market_price, weather } = data

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto"
    >
      <h1 className="section-title mb-2">Crop Recommendations</h1>
      <p className="text-dark-400 text-sm mb-6">AI-powered crop suggestions based on your soil and weather data</p>

      {/* Weather snapshot */}
      {weather && (
        <div className="glass-card p-4 mb-6 flex items-center gap-4 text-sm">
          <span className="text-2xl">🌤</span>
          <span className="text-dark-300">
            {weather.city} — {Math.round(weather.temperature)}°C, {weather.humidity}% humidity, {weather.rainfall}mm rain
          </span>
        </div>
      )}

      {/* Top 3 Crops */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {recommendations.map((crop, i) => (
          <CropCard
            key={i}
            crop={crop.crop}
            confidence={crop.confidence}
            yield={crop.expected_yield_per_acre}
            season={crop.sowing_season}
            water={crop.water_requirement}
            index={i}
          />
        ))}
      </div>

      {/* Fertilizer */}
      {fertilizer && (
        <div className="fert-section mb-10">
          <h2 className="section-title mb-4">Fertilizer Recommendation</h2>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🧪</span>
              <div>
                <h3 className="font-display font-bold text-lg text-white">{fertilizer.fertilizer_name}</h3>
                <span className="badge-green text-xs">NPK: {fertilizer.npk_ratio}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-dark-900/50 rounded-xl p-4">
                <p className="text-xs text-dark-400 mb-1">Pre-sowing</p>
                <p className="text-sm text-white">{fertilizer.pre_sowing}</p>
              </div>
              <div className="bg-dark-900/50 rounded-xl p-4">
                <p className="text-xs text-dark-400 mb-1">Top-dressing</p>
                <p className="text-sm text-white">{fertilizer.top_dressing}</p>
              </div>
              <div className="bg-dark-900/50 rounded-xl p-4">
                <p className="text-xs text-dark-400 mb-1">Organic Alternative</p>
                <p className="text-sm text-white">{fertilizer.organic_alternative}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-dark-400">Dosage:</span>
              <span className="text-white font-medium">{fertilizer.dosage_per_acre}</span>
              <span className="ml-4 text-dark-400">Estimated Cost:</span>
              <span className="text-primary-400 font-bold">₹{fertilizer.estimated_cost_inr?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Market Prices */}
      <div className="market-section">
        <h2 className="section-title mb-4">Market Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MarketChart data={trend} title={`${recommendations[0]?.crop || 'Crop'} — 30-Day Price Trend`} />

          {market_price && (
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold mb-4">Latest Price — {market_price.crop_name}</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Min', val: market_price.price_min, color: 'text-red-400' },
                  { label: 'Modal', val: market_price.price_modal, color: 'text-primary-400' },
                  { label: 'Max', val: market_price.price_max, color: 'text-green-400' },
                ].map((p) => (
                  <div key={p.label} className="text-center">
                    <p className="text-xs text-dark-400">{p.label}</p>
                    <p className={`font-display font-bold text-xl ${p.color}`}>₹{Math.round(p.val || 0)}</p>
                    <p className="text-xs text-dark-500">per quintal</p>
                  </div>
                ))}
              </div>
              {market_price.market_name && (
                <p className="text-xs text-dark-400 mt-4 text-center">
                  From: {market_price.market_name} ({market_price.date})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
