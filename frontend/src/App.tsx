// App.tsx — Application routes and global providers
// Responsibilities:
// - Sets up ThemeProvider and AuthProvider for the app
// - Contains the top-level `Routes` mapping pages to paths
// - Use `PrivateRoute` wrapper for any route that requires authentication
// Note: Add any new page routes here and ensure route paths match frontend links and API expectations
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Encyclopedia from './pages/Encyclopedia'
import DinoDetail from './pages/DinoDetail'
import Login from './pages/Login'
import AboutUs from './pages/AboutUs'
import MasterLayout from './components/MasterLayout'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import PrivateRoute from './components/PrivateRoute'
import Quiz from './pages/Quiz'
import Support from './pages/Support'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Forum from './pages/Forum'
import ForumCategory from './pages/ForumCategory'
import ForumPost from './pages/ForumPost'
import Privacy from './pages/Privacy'
import Splash from './pages/Splash'
import DinoBattle from './pages/DinoBattle'
import CookieConsent from './components/CookieConsent'
import DinoAssistant from './components/DinoAssistant'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        {/* Splash page - landing page without header/footer */}
        <Route path="/" element={<Splash />} />
        
        {/* Main app with layout */}
        <Route path="/*" element={
          <MasterLayout>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/encyclopedia" element={<Encyclopedia />} />
              <Route path="/dino/:id" element={<DinoDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/success" element={<Support />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/category/:slug" element={<ForumCategory />} />
              <Route path="/forum/post/:id" element={<ForumPost />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/battle" element={<DinoBattle />} />
            </Routes>
          </MasterLayout>
        } />
      </Routes>
      <CookieConsent />
      <DinoAssistant />
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

