import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useLocation } from '../hooks/useLocation'
import { pageVariants } from '../utils/animations'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
]

export default function SoilAnalysis() {
  const [activeTab, setActiveTab] = useState('upload')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ph: 6.5, nitrogen: 50, phosphorus: 50, potassium: 50, state: '', district: '', season: 'Kharif' })
  const { lat, lon } = useLocation()
  const navigate = useNavigate()

  const onDrop = useCallback((accepted) => {
    if (accepted.length) {
      setFile(accepted[0])
      setPreview(URL.createObjectURL(accepted[0]))
      setUploadResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/jpeg': [], 'image/png': [] }, maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an image first')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/soil/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadResult(data)
      toast.success('Soil analyzed successfully!')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed')
    } finally { setLoading(false) }
  }

  const handleManualSubmit = async () => {
    if (!form.state) return toast.error('Select your state')
    setLoading(true)
    try {
      const payload = { ...form, latitude: lat || 20.59, longitude: lon || 78.96 }
      const { data } = await api.post('/soil/submit-manual', payload)
      navigate('/crop-result', { state: data })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const sliderColor = (val, min, max, optMin, optMax) => {
    if (val >= optMin && val <= optMax) return 'accent-emerald-500'
    return 'accent-red-500'
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-screen pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto"
    >
      <h1 className="section-title mb-2">Soil Analysis</h1>
      <p className="text-dark-400 text-sm mb-6">Upload a soil image or enter NPK values for AI-powered crop recommendations</p>

      {/* Tab switcher */}
      <div className="flex p-1 bg-dark-900 rounded-xl mb-8 max-w-sm">
        {['upload', 'manual'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t ? 'bg-primary-500 text-white shadow-lg' : 'text-dark-400 hover:text-white'
            }`}
            data-hover
          >
            {t === 'upload' ? '📸 Upload Image' : '📝 Enter Values'}
          </button>
        ))}
      </div>

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              isDragActive ? 'border-primary-400 bg-primary-500/5 shadow-[0_0_20px_rgba(29,158,117,0.4)]' : 'border-dark-600 hover:border-primary-500/50'
            }`}
            data-hover
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Soil preview" className="w-48 h-48 object-cover rounded-xl mx-auto" />
            ) : (
              <>
                <span className="text-5xl block mb-4">🌍</span>
                <p className="text-dark-300">Drag & drop a soil image here, or click to browse</p>
                <p className="text-dark-500 text-xs mt-2">JPEG or PNG only</p>
              </>
            )}
          </div>

          <button onClick={handleUpload} disabled={loading || !file} className="btn-primary w-full" data-hover>
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Analyze Soil'}
          </button>

          {/* Upload Result */}
          {uploadResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Hero Result — Soil Type */}
              <div className="glass-card p-6 text-center border-primary-500/30">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border-2 border-dark-500" style={{ backgroundColor: uploadResult.color_hex }} />
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-white capitalize">
                    {uploadResult.soil_type} Soil
                  </h2>
                </div>
                <p className="text-primary-300 text-sm font-medium mb-3">
                  pH Range: {uploadResult.estimated_ph_min} – {uploadResult.estimated_ph_max} &nbsp;|&nbsp; Detected Color: {uploadResult.color_hex}
                </p>
                <p className="text-dark-200 text-sm max-w-xl mx-auto leading-relaxed">
                  {uploadResult.soil_description || uploadResult.suggested_correction}
                </p>
                {uploadResult.ideal_for && (
                  <p className="mt-2 text-xs text-dark-400 italic">🌾 Ideal for: {uploadResult.ideal_for}</p>
                )}
              </div>

              {/* Recommended Crops */}
              {uploadResult.recommended_crops?.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🌱</span> Recommended Crops
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {uploadResult.recommended_crops.map((crop, i) => (
                      <motion.div
                        key={crop}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-dark-900/60 border border-dark-700 hover:border-primary-500/50 rounded-xl p-4 text-center transition-all hover:bg-dark-800/80 group"
                      >
                        <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">
                          {{'Cotton':'🌿','Sugarcane':'🎋','Wheat':'🌾','Soybean':'🫘','Chickpea':'🫘',
                            'Groundnut':'🥜','Potato':'🥔','Rice':'🌾','Maize':'🌽','Mango':'🥭',
                            'Watermelon':'🍉','Coconut':'🥥','Muskmelon':'🍈','Banana':'🍌',
                            'Tomato':'🍅','Lentil':'🫘','Sugarcane':'🎋','Papaya':'🍈',
                          }[crop] || '🌱'}
                        </span>
                        <p className="text-sm font-semibold text-white">{crop}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrient Levels */}
              {uploadResult.nutrients && Object.keys(uploadResult.nutrients).length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span> Estimated Nutrient Levels
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(uploadResult.nutrients).map(([key, val]) => (
                      <div key={key} className="bg-dark-900/60 border border-dark-700 rounded-xl p-3 text-center">
                        <p className="text-xs text-dark-400 capitalize mb-1">{key.replace('_', ' ')}</p>
                        <p className={`text-sm font-bold ${
                          val.toLowerCase().includes('high') ? 'text-emerald-400' :
                          val.toLowerCase().includes('medium') ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              <div className="glass-card p-6 border-l-4 border-amber-500/50">
                <h3 className="font-display font-semibold text-lg text-white mb-2 flex items-center gap-2">
                  <span className="text-xl">💡</span> Soil Improvement Tips
                </h3>
                <p className="text-dark-300 text-sm leading-relaxed">{uploadResult.suggested_correction}</p>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sliders */}
          {[
            { key: 'ph', label: 'pH Value', min: 0, max: 14, step: 0.1, optMin: 5.5, optMax: 7.5, unit: '' },
            { key: 'nitrogen', label: 'Nitrogen (N)', min: 0, max: 140, step: 1, optMin: 20, optMax: 100, unit: ' kg/ha' },
            { key: 'phosphorus', label: 'Phosphorus (P)', min: 0, max: 145, step: 1, optMin: 10, optMax: 80, unit: ' kg/ha' },
            { key: 'potassium', label: 'Potassium (K)', min: 0, max: 205, step: 1, optMin: 15, optMax: 100, unit: ' kg/ha' },
          ].map((s) => (
            <div key={s.key} className="glass-card p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-dark-200">{s.label}</label>
                <span className={`badge text-xs font-bold ${
                  form[s.key] >= s.optMin && form[s.key] <= s.optMax ? 'badge-green' : 'badge-red'
                }`}>
                  {form[s.key]}{s.unit}
                </span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step}
                value={form[s.key]}
                onChange={(e) => setForm({ ...form, [s.key]: parseFloat(e.target.value) })}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${sliderColor(form[s.key], s.min, s.max, s.optMin, s.optMax)}`}
              />
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>{s.min}</span><span>{s.max}</span>
              </div>
            </div>
          ))}

          {/* State / District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field">
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="input-field" />
          </div>

          {/* Season */}
          <div className="flex p-1 bg-dark-900 rounded-xl">
            {['Kharif', 'Rabi', 'Zaid'].map((s) => (
              <button key={s} onClick={() => setForm({ ...form, season: s })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.season === s ? 'bg-primary-500 text-white shadow-lg' : 'text-dark-400 hover:text-white'
                }`} data-hover
              >{s}</button>
            ))}
          </div>

          <button onClick={handleManualSubmit} disabled={loading} className="btn-primary w-full" data-hover>
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Get Crop Recommendation'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
