import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { pageVariants } from '../utils/animations'

export default function DiseaseDetect() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted.length) {
      setFile(accepted[0])
      setPreview(URL.createObjectURL(accepted[0]))
      setResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/jpeg': [], 'image/png': [] }, maxFiles: 1,
  })

  const handleDetect = async () => {
    if (!file) return toast.error('Upload an image first')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/disease/detect', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(data)
      toast.success('Disease analysis complete!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Detection failed')
    } finally { setLoading(false) }
  }

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/disease/history')
      setHistory(data)
      setShowHistory(true)
    } catch { toast.error('Failed to load history') }
  }

  const severityColor = (s) => s === 'high' ? 'badge-red' : s === 'medium' ? 'badge-amber' : 'badge-green'
  const top = result?.top_result

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto"
    >
      <h1 className="section-title mb-2">Disease Detection</h1>
      <p className="text-dark-400 text-sm mb-6">Upload a leaf photo to identify diseases and get treatment recommendations</p>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-8 transition-all cursor-pointer mb-6 ${
          isDragActive ? 'border-primary-400 bg-primary-500/5 shadow-[0_0_20px_rgba(29,158,117,0.4)]' : 'border-dark-600 hover:border-primary-500/50'
        }`}
        data-hover
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Leaf" className="max-w-xs max-h-64 rounded-xl object-contain" />
        ) : (
          <>
            <span className="text-6xl mb-4">🍃</span>
            <p className="text-dark-300 text-center">Drop a leaf image here or click to upload</p>
            <p className="text-dark-500 text-xs mt-2">Supports JPEG and PNG formats</p>
          </>
        )}
      </div>

      <button onClick={handleDetect} disabled={loading || !file} className="btn-primary w-full mb-8" data-hover>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" className="opacity-30" />
              <path d="M12 2a10 10 0 019.5 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Analyzing...
          </span>
        ) : 'Detect Disease'}
      </button>

      {/* Result */}
      {top && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Top disease card */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-white">{top.disease}</h3>
                <p className="text-dark-400 text-sm">Crop: {top.crop}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={severityColor(top.severity)}>{top.severity || 'medium'}</span>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-dark-400 mb-1">
                <span>Confidence</span><span>{top.confidence}%</span>
              </div>
              <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${top.confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full"
                />
              </div>
            </div>

            {/* Treatment cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '🩺', title: 'Symptoms', text: top.symptoms },
                { icon: '🌿', title: 'Organic Treatment', text: top.organic_treatment },
                { icon: '💊', title: 'Chemical Treatment', text: top.chemical_treatment },
                { icon: '🛡', title: 'Prevention', text: top.prevention },
              ].map((card) => card.text && (
                <div key={card.title} className="bg-dark-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{card.icon}</span>
                    <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                  </div>
                  <p className="text-xs text-dark-300 leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Show all 3 */}
          {result.top3?.length > 1 && (
            <>
              <button onClick={() => setShowAll(!showAll)} className="btn-secondary w-full text-sm" data-hover>
                {showAll ? 'Hide' : 'Show'} All 3 Predictions
              </button>
              <AnimatePresence>
                {showAll && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden"
                  >
                    {result.top3.slice(1).map((d, i) => (
                      <div key={i} className="glass-card p-4 flex items-center gap-4">
                        <span className={severityColor(d.severity)}>{d.severity || 'medium'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{d.disease} ({d.crop})</p>
                          <p className="text-xs text-dark-400">{d.confidence}% confidence</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      )}

      {/* History */}
      <div className="mt-10">
        <button onClick={loadHistory} className="btn-secondary text-sm" data-hover>
          {showHistory ? 'Hide' : 'Show'} Past Detections
        </button>
        {showHistory && history.length > 0 && (
          <div className="mt-4 space-y-3">
            {history.map((d) => (
              <div key={d.id} className="glass-card p-4 flex items-center gap-4">
                <img src={d.image_path ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api','')}${d.image_path}` : '/assets/fallback.jpg'}
                  alt="" className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/assets/fallback.jpg' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{d.disease_name}</p>
                  <p className="text-xs text-dark-400">{d.crop_name} — {d.confidence}%</p>
                </div>
                <span className={severityColor(d.severity)}>{d.severity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
