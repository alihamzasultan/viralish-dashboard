import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import StatsOverview from './components/StatsOverview'
import VideoGrid from './components/VideoGrid'
import SourceVideoTable from './components/SourceVideoTable'
import VideoUpload from './components/VideoUpload'
import CustomVideos from './components/CustomVideos'
import SourcePagesList from './components/SourcePagesList'
import ScraperStatus from './components/ScraperStatus'

const DashboardHome = () => (
  <>
    <ScraperStatus />
    <StatsOverview />
    <VideoGrid />
  </>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Main Dashboard - Now Public */}
          <Route
            path="/"
            element={<DashboardLayout />}
          >
            <Route index element={<DashboardHome />} />
            <Route path="generated" element={<VideoGrid />} />
            <Route path="sources" element={<SourceVideoTable />} />
            <Route path="pages" element={<SourcePagesList />} />
            <Route path="upload" element={<VideoUpload />} />
            <Route path="custom" element={<CustomVideos />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
