import { cardHover, cardHoverOut } from '../utils/animations'

const FALLBACK_IMG = '/assets/fallback.jpg'

export default function ListingCard({ listing, onBuy }) {
  const getCropImage = (name) => {
    const crops = {
      'banana': '/assets/banana.jpg', 'cotton': '/assets/cotton.jpeg', 'groundnut': '/assets/groundnut.jpg',
      'lentil': '/assets/lentil.jpg', 'maize': '/assets/maize.jpg', 'mango': '/assets/mango.jpg',
      'onion': '/assets/onion.jpg', 'papaya': '/assets/papaya.jpg', 'potato': '/assets/potato.jpg',
      'rice': '/assets/rice.jpg', 'soybean': '/assets/soybean.jpg', 'sugarcane': '/assets/sugercane.jpg',
      'tomato': '/assets/tomato.jpg', 'watermelon': '/assets/watermelon.jpg', 'wheat': '/assets/wheat.jpg'
    };
    return crops[name.toLowerCase()] || '/assets/listing_fallback.png';
  }
  const imgUrl = listing.images?.[0]
    ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''}${listing.images[0]}`
    : getCropImage(listing.crop_name)

  return (
    <div
      className="glass-card overflow-hidden group"
      onMouseEnter={(e) => cardHover(e.currentTarget)}
      onMouseLeave={(e) => cardHoverOut(e.currentTarget)}
      data-hover
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={imgUrl}
          alt={listing.crop_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`badge text-xs ${
            listing.status === 'active' ? 'badge-green' : listing.status === 'sold' ? 'badge-red' : 'badge-amber'
          }`}>
            {listing.status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-white">{listing.crop_name}</h3>
            {listing.farmer_name && (
              <p className="text-xs text-primary-300 font-medium mt-1">
                🧑‍🌾 Seller: {listing.farmer_name}
              </p>
            )}
            <p className="text-xs text-dark-400 mt-0.5">
              📍 {listing.state || 'India'}
            </p>
          </div>
          <p className="text-primary-400 font-bold text-lg">
            ₹{listing.price_per_kg}<span className="text-xs text-dark-400">/kg</span>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-dark-300">
          <span>📦 {listing.quantity_kg} kg available</span>
          {listing.views > 0 && <span>👁 {listing.views} views</span>}
        </div>

        {listing.description && (
          <p className="text-xs text-dark-400 line-clamp-2">{listing.description}</p>
        )}

        {onBuy && listing.status === 'active' && (
          <button
            onClick={() => onBuy(listing)}
            className="btn-primary w-full text-sm py-2.5"
            data-hover
          >
            Buy Now
          </button>
        )}
      </div>
    </div>
  )
}
