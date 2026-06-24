// ============================================================================
// App.tsx — Main Application Router & Global Providers
// ============================================================================
// PURPOSE: This is the root component that sets up:
//   1. Global providers (Theme, Auth) that wrap the entire app
//   2. Route configuration - maps URLs to page components
//   3. Global components (CookieConsent, DinoAssistant) shown on all pages
//
// ROUTE STRUCTURE:
//   /           → Splash page (no header/footer)
//   /home       → Home page with hero section
//   /encyclopedia → All dinosaurs grid
//   /dino/:id   → Individual dinosaur detail page
//   /quiz       → Take quizzes
//   /battle     → Dino Battle Arena
//   /forum/*    → Community forum
//   /dashboard  → User dashboard (requires login)
//   /login      → Login/Register page
//
// PROVIDERS HIERARCHY:
//   ErrorBoundary    → Catches JS errors, shows fallback UI
//     ThemeProvider  → Dark/light mode state
//       AuthProvider → User authentication state
//         Routes     → Page components
//
// TO ADD A NEW PAGE:
//   1. Create component in pages/ folder
//   2. Import it here
//   3. Add <Route path="/your-path" element={<YourPage />} />
//   4. If requires auth: wrap in <PrivateRoute>
// ============================================================================
import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Page components - each file in pages/ is a full page
import Home from './pages/Home'
import Encyclopedia from './pages/Encyclopedia'
import DinoDetail from './pages/DinoDetail'
import Login from './pages/Login'
import AboutUs from './pages/AboutUs'
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
import Settings from './pages/Settings'

// Layout and utility components
import MasterLayout from './components/MasterLayout'      // Header + Footer wrapper
import PrivateRoute from './components/PrivateRoute'      // Redirects to login if not authenticated
import CookieConsent from './components/CookieConsent'    // GDPR cookie consent banner
import DinoAssistant from './components/DinoAssistant'    // Floating AI chat assistant
import ErrorBoundary from './components/ErrorBoundary'    // Catches errors, prevents white screen

// Context providers - wrap app to provide global state
import { AuthProvider } from './lib/auth'    // Login/logout state, user info
import { ThemeProvider } from './lib/theme'  // Dark/light mode
import { SettingsProvider } from './lib/settings'  // User settings & preferences

export default function App() {
  return (
    // ErrorBoundary: If any child throws an error, show fallback instead of crashing
    <ErrorBoundary>
    {/* ThemeProvider: Provides dark/light mode to all components */}
    <ThemeProvider>
    {/* SettingsProvider: Provides user settings & preferences to all components */}
    <SettingsProvider>
    {/* AuthProvider: Provides user, login/logout functions to all components */}
    <AuthProvider>
      <Routes>
        {/* ================================================================
            SPLASH PAGE - Landing page WITHOUT header/footer
            This is the first thing users see when visiting the site root
        ================================================================ */}
        <Route path="/" element={<Splash />} />
        
        {/* ================================================================
            MAIN APP ROUTES - All wrapped in MasterLayout (header + footer)
            The nested Routes allows MasterLayout to render around all pages
        ================================================================ */}
        <Route path="/*" element={
          <MasterLayout>
            <Routes>
              {/* PUBLIC ROUTES - Anyone can access */}
              <Route path="/home" element={<Home />} />
              <Route path="/encyclopedia" element={<Encyclopedia />} />
              <Route path="/dino/:id" element={<DinoDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/success" element={<Support />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
              <Route path="/forum/category/:slug" element={<PrivateRoute><ForumCategory /></PrivateRoute>} />
              <Route path="/forum/post/:id" element={<PrivateRoute><ForumPost /></PrivateRoute>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/battle" element={<DinoBattle />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* PROTECTED ROUTES - Requires login */}
              {/* PrivateRoute redirects to /login if user is not authenticated */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            </Routes>
          </MasterLayout>
        } />
      </Routes>
      
      {/* ================================================================
          GLOBAL COMPONENTS - Shown on ALL pages
      ================================================================ */}
      {/* Cookie consent banner - GDPR compliance */}
      <CookieConsent />
      
      {/* Floating AI assistant - bottom right corner */}
      <DinoAssistant />
      
    </AuthProvider>
    </SettingsProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

