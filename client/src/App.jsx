import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/dashboard'
import Plots from './pages/plots'
import Resources from './pages/resources'
import Volunteers from './pages/volunteers'
import Announcements from './pages/announcements'
import Calendar from './pages/calendar'
import Login from './pages/login'
import Register from './pages/register'
import './App.css'
import Weather from './pages/weather'
import AI from './pages/ai'
import Soil from './pages/soil'
import CropYield from './pages/cropyield'
import WaterMap from './pages/watermap'
import Profile from './pages/profile'
import HydroponicFarming from './pages/hydroponic'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plots" element={<Plots />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/hydroponic" element={<HydroponicFarming />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/yield" element={<CropYield />} />
        <Route path="/water" element={<WaterMap />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App