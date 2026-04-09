import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../utils/api'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../hooks/useAuth'
import { pageVariants } from '../utils/animations'

const CROPS = ['Rice','Wheat','Cotton','Sugarcane','Maize','Tomato','Onion','Potato','Soybean','Groundnut','Mango','Banana','Apple','Grapes','Orange','Lentil','Chickpea','Coffee','Coconut','Jute','Papaya','Watermelon']
const CROP_CATEGORIES = {
  Vegetables: ['Tomato','Onion','Potato'],
  Fruits: ['Mango','Banana','Apple','Grapes','Orange','Papaya','Watermelon'],
  Grains: ['Rice','Wheat','Maize','Lentil','Chickpea','Soybean'],
  'Cash Crops': ['Cotton','Sugarcane','Groundnut','Coffee','Coconut','Jute']
}
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal']

export default function Marketplace() {
  const { user } = useAuth()
  const [tab, setTab] = useState('browse')
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ crop: '', state: '', sort: 'newest' })
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ crop_name: '', quantity_kg: '', price_per_kg: '', description: '', harvest_date: '', state: '', district: '' })
  const [createImages, setCreateImages] = useState([])
  const [buyModal, setBuyModal] = useState(null)
  const [buyQty, setBuyQty] = useState('')
  const observerRef = useRef()

  const fetchListings = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 12, sort: filters.sort })
      if (filters.crop) params.set('crop', filters.crop)
      if (filters.state) params.set('state', filters.state)
      const { data } = await api.get(`/marketplace/listings?${params}`)
      setListings(prev => append ? [...prev, ...data.items] : data.items)
      setHasMore(p < data.pages)
    } catch { toast.error('Failed to load listings') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { setPage(1); fetchListings(1) }, [filters])

  const fetchMyListings = async () => {
    try { const { data } = await api.get('/marketplace/my-listings'); setMyListings(data) }
    catch { toast.error('Failed to load your listings') }
  }
  useEffect(() => { if (tab === 'mine') fetchMyListings() }, [tab])

  // Infinite scroll
  const lastRef = useCallback((node) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        const next = page + 1
        setPage(next)
        fetchListings(next, true)
      }
    })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, page])

  const handleCreate = async () => {
    if (!createForm.crop_name || !createForm.quantity_kg || !createForm.price_per_kg) return toast.error('Fill required fields')
    const fd = new FormData()
    Object.entries(createForm).forEach(([k, v]) => { if (v) fd.append(k, v) })
    createImages.forEach(f => fd.append('images', f))
    try {
      await api.post('/marketplace/list', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Listing created!')
      setShowCreate(false)
      setCreateForm({ crop_name: '', quantity_kg: '', price_per_kg: '', description: '', harvest_date: '', state: '', district: '' })
      setCreateImages([])
      fetchListings(1)
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to create listing') }
  }

  const handleBuy = async () => {
    if (!buyModal || !buyQty) return
    try {
      const fd = new FormData()
      fd.append('listing_id', buyModal.id)
      fd.append('quantity_kg', buyQty)
      const { data } = await api.post('/marketplace/create-order', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

      const rzp = new window.Razorpay({
        key: data.key, amount: data.amount * 100, currency: 'INR',
        name: 'Agro-Soil AI', description: `Buy ${buyModal.crop_name}`,
        order_id: data.razorpay_order_id,
        prefill: { name: user?.name, contact: user?.phone },
        theme: { color: '#1D9E75' },
        handler: async (resp) => {
          const vfd = new FormData()
          vfd.append('order_id', resp.razorpay_order_id)
          vfd.append('payment_id', resp.razorpay_payment_id)
          vfd.append('signature', resp.razorpay_signature)
          await api.post('/marketplace/verify-payment', vfd, { headers: { 'Content-Type': 'multipart/form-data' } })
          toast.success('Payment successful! Farmer has been notified.')
          setBuyModal(null)
          fetchListings(1)
        },
      })
      rzp.on('payment.failed', (r) => toast.error(`Payment failed: ${r.error.description}`))
      rzp.open()
    } catch { toast.error('Could not initiate payment. Try again.') }
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/marketplace/listing/${id}`); toast.success('Listing cancelled'); fetchMyListings() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto"
    >
      <h1 className="section-title mb-6">Marketplace</h1>

      {/* Tab toggle */}
      <div className="flex p-1 bg-dark-900 rounded-xl mb-6 max-w-xs">
        {[['browse','🛒 Browse'], ['mine', '📋 My Listings']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab===k ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`} data-hover
          >{l}</button>
        ))}
      </div>

      {tab === 'browse' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={filters.crop} onChange={(e) => setFilters({...filters, crop: e.target.value})} className="input-field w-auto min-w-[140px]">
              <option value="">All Crops</option>
              {Object.entries(CROP_CATEGORIES).map(([cat, crops]) => (
                <optgroup key={cat} label={cat}>
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              ))}
            </select>
            <select value={filters.state} onChange={(e) => setFilters({...filters, state: e.target.value})} className="input-field w-auto min-w-[140px]">
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.sort} onChange={(e) => setFilters({...filters, sort: e.target.value})} className="input-field w-auto min-w-[140px]">
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low→High</option>
              <option value="price_high">Price: High→Low</option>
            </select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l, i) => (
              <div key={l.id} ref={i === listings.length - 1 ? lastRef : null}>
                <ListingCard listing={l} onBuy={user?.role === 'buyer' ? (listing) => { setBuyModal(listing); setBuyQty('') } : null} />
              </div>
            ))}
          </div>
          {loading && <p className="text-center text-dark-400 mt-6">Loading...</p>}
          {!loading && listings.length === 0 && <p className="text-center text-dark-400 mt-12">No listings found</p>}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myListings.map((l) => (
            <div key={l.id} className="glass-card p-5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-display font-bold text-white">{l.crop_name}</h3>
                <span className={`badge text-xs ${l.status==='active'?'badge-green':l.status==='sold'?'badge-red':'badge-amber'}`}>{l.status}</span>
              </div>
              <p className="text-sm text-dark-300">{l.quantity_kg} kg — ₹{l.price_per_kg}/kg</p>
              <p className="text-xs text-dark-400">👁 {l.views} views</p>
              {l.status === 'active' && (
                <button onClick={() => handleDelete(l.id)} className="text-red-400 text-xs hover:text-red-300" data-hover>Cancel Listing</button>
              )}
            </div>
          ))}
          {myListings.length === 0 && <p className="text-dark-400">No listings yet</p>}
        </div>
      )}

      {/* FAB — create listing */}
      {user?.role === 'farmer' && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary-500 text-white text-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-600 flex items-center justify-center transition-all"
          data-hover
        >+</button>
      )}

      {/* Create Listing Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-50 glass-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-xl">Create Listing</h2>
              <button onClick={() => setShowCreate(false)} className="text-dark-400 hover:text-white text-xl" data-hover>✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select value={createForm.crop_name} onChange={(e) => setCreateForm({...createForm, crop_name: e.target.value})} className="input-field">
                <option value="">Select Crop</option>
                {Object.entries(CROP_CATEGORIES).map(([cat, crops]) => (
                  <optgroup key={cat} label={cat}>
                    {crops.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
              <input placeholder="Quantity (kg)" type="number" value={createForm.quantity_kg} onChange={(e) => setCreateForm({...createForm, quantity_kg: e.target.value})} className="input-field" />
              <input placeholder="Price per kg (₹)" type="number" value={createForm.price_per_kg} onChange={(e) => setCreateForm({...createForm, price_per_kg: e.target.value})} className="input-field" />
              <input placeholder="Harvest Date" type="date" value={createForm.harvest_date} onChange={(e) => setCreateForm({...createForm, harvest_date: e.target.value})} className="input-field" />
              <select value={createForm.state} onChange={(e) => setCreateForm({...createForm, state: e.target.value})} className="input-field">
                <option value="">State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input placeholder="District" value={createForm.district} onChange={(e) => setCreateForm({...createForm, district: e.target.value})} className="input-field" />
            </div>
            <textarea placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})} className="input-field mt-4 h-20" />
            <input type="file" accept="image/jpeg,image/png" multiple onChange={(e) => setCreateImages([...e.target.files].slice(0,4))} className="mt-4 text-sm text-dark-300" />
            {createImages.length > 0 && (
              <div className="flex gap-2 mt-2">
                {createImages.map((f,i) => <span key={i} className="badge bg-dark-800 text-dark-300 text-xs">{f.name}</span>)}
              </div>
            )}
            <button onClick={handleCreate} className="btn-primary w-full mt-4" data-hover>Create Listing</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Modal */}
      <AnimatePresence>
        {buyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setBuyModal(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card-light p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-xl mb-4">Buy {buyModal.crop_name}</h3>
              <p className="text-sm text-dark-300 mb-1">Max Available: {buyModal.quantity_kg} kg</p>
              <p className="text-sm text-dark-300 mb-4">Price: ₹{buyModal.price_per_kg}/kg</p>
              <input type="number" placeholder="Quantity (kg)" value={buyQty}
                onChange={(e) => setBuyQty(Math.min(e.target.value, buyModal.quantity_kg))}
                max={buyModal.quantity_kg} className="input-field mb-3"
              />
              {buyQty > 0 && (
                <p className="text-primary-400 font-bold text-lg mb-4">
                  Total: ₹{(buyQty * buyModal.price_per_kg).toLocaleString('en-IN')}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setBuyModal(null)} className="btn-secondary flex-1" data-hover>Cancel</button>
                <button onClick={handleBuy} disabled={!buyQty || buyQty <= 0} className="btn-primary flex-1" data-hover>Proceed to Pay</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
