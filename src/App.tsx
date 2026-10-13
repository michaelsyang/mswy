import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HealthDashboard from './pages/HealthDashboard'
import SkillsReport from './pages/reports/SkillsReport'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/health" element={<HealthDashboard />} />
      <Route path="/reports/skills" element={<SkillsReport />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
