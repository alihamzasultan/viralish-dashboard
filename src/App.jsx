import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import StatsOverview from './components/StatsOverview'
import VideoGrid from './components/VideoGrid'
import SourceVideoTable from './components/SourceVideoTable'
import AnalyzedVideoTable from './components/AnalyzedVideoTable'

const DashboardHome = () => (
  <>
    <StatsOverview />
    <VideoGrid />
  </>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="generated" element={<VideoGrid />} />
          <Route path="sources" element={<SourceVideoTable />} />
          <Route path="analyzed" element={<AnalyzedVideoTable />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
