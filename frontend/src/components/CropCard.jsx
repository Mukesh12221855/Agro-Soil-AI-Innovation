import { motion } from 'framer-motion'
import { cardHover, cardHoverOut } from '../utils/animations'

const FALLBACK_IMG = '/assets/fallback.jpg'

export default function CropCard({ crop, confidence, yield: yieldStr, season, water, index = 0, onClick }) {
  const getCropImage = (name) => {
    const crops = {
      'banana': '/assets/banana.jpg', 'cotton': '/assets/cotton.jpeg', 'groundnut': '/assets/groundnut.jpg',
      'lentil': '/assets/lentil.jpg', 'maize': '/assets/maize.jpg', 'mango': '/assets/mango.jpg',
      'onion': '/assets/onion.jpg', 'papaya': '/assets/papaya.jpg', 'potato': '/assets/potato.jpg',
      'rice': '/assets/rice.jpg', 'soybean': '/assets/soybean.jpg', 'sugarcane': '/assets/sugercane.jpg',
      'tomato': '/assets/tomato.jpg', 'watermelon': '/assets/watermelon.jpg', 'wheat': '/assets/wheat.jpg'
    };
    return crops[name.toLowerCase()] || '/assets/crop_fallback.png';
  }
  const imgUrl = getCropImage(crop)

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4, ease: 'easeOut' }}
      className="glass-card overflow-hidden group"
      onMouseEnter={(e) => cardHover(e.currentTarget)}
      onMouseLeave={(e) => cardHoverOut(e.currentTarget)}
      onClick={onClick}
      data-hover
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgUrl}
          alt={crop}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <h3 className="font-display font-bold text-lg text-white">{crop}</h3>
          <span className="badge-green text-xs font-bold">{confidence}%</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Confidence bar */}
        <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(confidence, 100)}%` }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {season && <span className="badge bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">🌾 {season}</span>}
          {water && <span className="badge bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/20">💧 {water}</span>}
          {yieldStr && <span className="badge bg-amber-500/10 text-amber-300 text-xs border border-amber-500/20">📊 {yieldStr}</span>}
        </div>
      </div>
    </motion.div>
  )
}
