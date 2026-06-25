import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Plots from './pages/Plots'
import Resources from './pages/Resources'
import Volunteers from './pages/Volunteers'
import Announcements from './pages/Announcements'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import Weather from './pages/Weather'
import AI from './pages/AI'
import Soil from './pages/Soil'
import CropYield from './pages/CropYield'
import WaterMap from './pages/WaterMap'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plots" element={<Plots />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/yield" element={<CropYield />} />
        <Route path="/water" element={<WaterMap />} />
      </Routes>
    </Router>
  )
}

export default App