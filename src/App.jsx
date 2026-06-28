import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import Home from './pages/Home'
import Atlas from './pages/Atlas'
import AboutPolish from './pages/AboutPolish'
import AboutEuropean from './pages/AboutEuropean'
import GaleriaEdytor from './pages/GaleriaEdytor'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Temporary editor — full viewport, no chrome */}
        <Route path="/galeria/edytor" element={
          <div style={{ height: '100vh', overflow: 'hidden' }}>
            <GaleriaEdytor />
          </div>
        } />
        {/* Main app */}
        <Route path="*" element={
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/atlas" element={<Atlas />} />
                <Route path="/atlas/:cityId" element={<Atlas />} />
                <Route path="/o-projekcie-polskim" element={<AboutPolish />} />
                <Route path="/o-projekcie-europejskim" element={<AboutEuropean />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
