import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import CustomCursor from './components/CustomCursor'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SoilAnalysis from './pages/SoilAnalysis'
import CropResult from './pages/CropResult'
import DiseaseDetect from './pages/DiseaseDetect'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'

export default function App() {
  const location = useLocation()

  return (
    <>
      <CustomCursor />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/soil" element={<ProtectedRoute><SoilAnalysis /></ProtectedRoute>} />
          <Route path="/crop-result" element={<ProtectedRoute><CropResult /></ProtectedRoute>} />
          <Route path="/disease" element={<ProtectedRoute><DiseaseDetect /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
