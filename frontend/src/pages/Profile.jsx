import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { pageVariants, scrollReveal, countUp } from '../utils/animations'

const COLORS = ['#1D9E75','#3ace93','#f59e0b','#3b82f6','#ef4444','#8b5cf6']
function avatarColor(name) { return COLORS[(name||'').charCodeAt(0) % COLORS.length] }
function initials(name) { return (name||'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) }

export default function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState('history')
  const [summary, setSummary] = useState(null)
  const [feed, setFeed] = useState([])
  const [recs, setRecs] = useState([])
  const [txns, setTxns] = useState([])
  const [diseases, setDiseases] = useState([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [trackingId, setTrackingId] = useState(null)
  const statsRef = useRef([])

  useEffect(() => {
    if (!user?.id) return
    api.get(`/profile/summary/${user.id}`).then(r => setSummary(r.data)).catch(() => {})
    api.get(`/profile/activity-feed/${user.id}`).then(r => setFeed(r.data || [])).catch(() => {})
    api.get('/soil/history').then(r => setRecs(r.data || [])).catch(() => {})
    api.get(`/marketplace/transactions/${user.id}`).then(r => setTxns(r.data || [])).catch(() => {})
    api.get('/disease/history').then(r => setDiseases(r.data || [])).catch(() => {})
  }, [user])

  useEffect(() => { scrollReveal('.profile-stat', 0.1) }, [])
  useEffect(() => {
    if (summary) {
      const vals = [summary.total_earnings, summary.total_kg_sold, summary.total_recommendations, summary.diseases_detected]
      statsRef.current.forEach((el, i) => { if (el && vals[i]) countUp(el, vals[i]) })
    }
  }, [summary])

  const handleUpdate = async () => {
    try {
      const fd = new FormData()
      Object.entries(editForm).forEach(([k,v]) => { if (v) fd.append(k,v) })
      await api.put('/profile/update', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Profile updated')
      setEditing(false)
    } catch { toast.error('Update failed') }
  }

  const monthlyEarnings = txns.reduce((acc, t) => {
    if (t.status !== 'paid') return acc
    const m = new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    acc[m] = (acc[m] || 0) + (t.amount || 0)
    return acc
  }, {})
  const chartData = Object.entries(monthlyEarnings).slice(-6).map(([m,v]) => ({ month: m, earnings: Math.round(v) }))

  const tabs = user?.role === 'buyer' 
    ? [
        { key: 'history', label: '📋 History' },
        { key: 'sales', label: '🛍️ Purchases' },
      ]
    : [
        { key: 'history', label: '📋 History' },
        { key: 'recommendations', label: '🌾 Recommendations' },
        { key: 'sales', label: '💰 Sales' },
        { key: 'diseases', label: '🔬 Diseases' },
      ]

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="glass-card p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
          style={{ background: avatarColor(user?.name) }}>
          {initials(user?.name)}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-white">{user?.name}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
            <span className="badge-green">{user?.role}</span>
            {user?.state && <span className="badge bg-dark-800 text-dark-300 border border-dark-600">{user.state}</span>}
            <span className="text-xs text-dark-400">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'recently'}</span>
          </div>
        </div>
        <button onClick={() => { setEditing(!editing); setEditForm({ name: user?.name, phone: user?.phone, state: user?.state, district: user?.district, village: user?.village }) }}
          className="btn-secondary text-sm" data-hover
        >{editing ? 'Cancel' : '✏ Edit'}</button>
      </div>

      {/* Edit form */}
      {editing && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="glass-card p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
          <input placeholder="Name" value={editForm.name||''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="input-field" />
          <input placeholder="Phone" value={editForm.phone||''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="input-field" />
          <input placeholder="State" value={editForm.state||''} onChange={(e) => setEditForm({...editForm, state: e.target.value})} className="input-field" />
          <input placeholder="District" value={editForm.district||''} onChange={(e) => setEditForm({...editForm, district: e.target.value})} className="input-field" />
          <input placeholder="Village" value={editForm.village||''} onChange={(e) => setEditForm({...editForm, village: e.target.value})} className="input-field" />
          <button onClick={handleUpdate} className="btn-primary" data-hover>Save Changes</button>
        </motion.div>
      )}

      {/* Stats */}
      {user?.role !== 'buyer' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earnings', icon: '💰', color: 'text-green-400', prefix: '₹' },
            { label: 'Kg Sold', icon: '📦', color: 'text-blue-400', prefix: '' },
            { label: 'Crops Recommended', icon: '🌾', color: 'text-amber-400', prefix: '' },
            { label: 'Diseases Detected', icon: '🔬', color: 'text-red-400', prefix: '' },
          ].map((s, i) => (
            <div key={i} className="profile-stat stat-card">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-dark-400 text-xs">{s.label}</p>
              <p className={`font-display font-bold text-2xl ${s.color}`}>
                {s.prefix}<span ref={(el) => (statsRef.current[i] = el)}>0</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-900 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab===t.key ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}
            data-hover
          >{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'history' && (
        <div className="space-y-3">
          {feed.map((e, i) => (
            <div key={i} className="glass-card p-4 flex items-start gap-4">
              <span className="text-2xl">{e.icon || '📋'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="badge bg-dark-800 text-dark-300 text-xs">{e.event_type?.replace('_',' ')}</span></div>
                <p className="text-sm font-medium text-white mt-1">{e.title}</p>
                <p className="text-xs text-dark-400">{e.description}</p>
              </div>
              <span className="text-xs text-dark-500">{e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : ''}</span>
            </div>
          ))}
          {feed.length===0 && <p className="text-dark-400 text-center py-8">No activity yet</p>}
        </div>
      )}

      {tab === 'recommendations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recs.map((r) => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-dark-400">pH: {r.ph_value} | N:{r.nitrogen} P:{r.phosphorus} K:{r.potassium}</p>
                  <p className="text-xs text-dark-500">{r.state} · {r.season}</p>
                </div>
                <span className="text-xs text-dark-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''}</span>
              </div>
              {r.top_crop && <span className="badge-green mr-2">{r.top_crop} {r.confidence_1 ? `(${r.confidence_1}%)` : ''}</span>}
            </div>
          ))}
          {recs.length===0 && <p className="text-dark-400 text-center py-8 col-span-2">No recommendations yet</p>}
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-6">
           {user?.role === 'farmer' && chartData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold mb-4">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7f8583', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7f8583', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a1d1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7e6' }} />
                  <Bar dataKey="earnings" fill="#1D9E75" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-dark-400 text-left border-b border-dark-800">
                <th className="pb-2">Crop</th><th className="pb-2">Qty</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th><th className="pb-2">Action</th>
              </tr></thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-dark-800/50">
                    <td className="py-3 text-white">{t.crop_name}</td>
                    <td className="py-3 text-dark-300">{t.quantity_kg} kg</td>
                    <td className="py-3 text-primary-400 font-medium">₹{t.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3"><span className={`badge text-xs ${t.status==='paid'?'badge-green':'badge-amber'}`}>{t.status}</span></td>
                    <td className="py-3 text-dark-500">{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : ''}</td>
                    <td className="py-3"><button onClick={() => setTrackingId(t.id)} className="text-primary-400 underline text-xs hover:text-primary-300" data-hover>Track</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txns.length===0 && <p className="text-dark-400 text-center py-8">No transactions yet</p>}
          </div>
        </div>
      )}

      {tab === 'diseases' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseases.map((d) => (
            <div key={d.id} className="glass-card p-4 flex gap-3">
              <img src={d.image_path ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api','')}${d.image_path}` : '/assets/fallback.jpg'}
                alt="" className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/fallback.jpg' }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{d.disease_name}</p>
                <p className="text-xs text-dark-400">{d.crop_name} — {d.confidence}%</p>
                <span className={`badge text-xs mt-1 ${d.severity==='high'?'badge-red':d.severity==='medium'?'badge-amber':'badge-green'}`}>{d.severity}</span>
              </div>
            </div>
          ))}
          {diseases.length===0 && <p className="text-dark-400 text-center py-8 col-span-3">No disease detections yet</p>}
        </div>
      )}

      {/* Tracking Modal (Dummy) */}
      <AnimatePresence>
        {trackingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setTrackingId(null)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-900 border border-dark-700 p-6 w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient top */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>

              <h3 className="font-display font-bold text-xl mb-6 text-white flex items-center gap-2">
                <span className="text-xl">📦</span> Track Order #{trackingId}
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start relative">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(29,158,117,0.4)] z-10 text-xs">✓</div>
                  <div className="pt-1">
                    <p className="font-bold text-sm text-white">Order Confirmed</p>
                    <p className="text-xs text-dark-400 mt-1">Payment processed successfully</p>
                  </div>
                  <div className="absolute left-4 top-8 w-[2px] h-10 bg-primary-500/40"></div>
                </div>
                
                <div className="flex gap-4 items-start relative">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0 z-10 text-xs shadow-lg">🚚</div>
                  <div className="pt-1">
                    <p className="font-bold text-sm text-white">Dispatched</p>
                    <p className="text-xs text-dark-400 mt-1">Package picked up by logistics</p>
                  </div>
                  <div className="absolute left-4 top-8 w-[2px] h-10 bg-dark-700"></div>
                </div>
                
                <div className="flex gap-4 items-start relative opacity-50">
                  <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center text-dark-400 shrink-0 z-10 text-xs">📍</div>
                  <div className="pt-1">
                    <p className="font-bold text-sm text-dark-200">Out for Delivery</p>
                    <p className="text-xs text-dark-500 mt-1">Pending arrival</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setTrackingId(null)} className="btn-secondary w-full mt-8" data-hover>Close Tracking</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
