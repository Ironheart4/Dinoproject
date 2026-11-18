// MasterLayout.tsx — Global layout (header, footer, mobile nav)
// Notes:
// - Update `navLinks` array to add/remove top-level navigation items
// - Uses `useAuth()` to display user-specific links (Dashboard, Logout)
// - Footer contains quick links and contact info; adjust for branding or legal text
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  LayoutDashboard, Heart, Home, BookOpen, Target, Info, LogIn, LogOut,
  Mail, Twitter, Instagram, Youtube, MessageCircle, Calendar, Facebook,
  Menu, X, Settings as SettingsIcon, Swords, Clock, Brain, Globe2,
  ChevronDown, Dna
} from 'lucide-react'
import SearchBar from './SearchBar'
import VisitedBreadcrumbs from './VisitedBreadcrumbs'

const DynamicBackground = lazy(() => import('./DynamicBackground'))

const LOGO = 'https://i.postimg.cc/gcMbkWV0/Dino-Project-Logo.png'

export default function MasterLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/encyclopedia', label: 'Encyclopedia', icon: BookOpen },
    { to: '/dino-world', label: 'Dino World', icon: Globe2 },
    { to: '/timeline', label: 'Timeline', icon: Clock },
    { to: '/quiz', label: 'Quiz', icon: Brain },
    { to: '/battle', label: 'Battle', icon: Swords },
    { to: '/forum', label: 'Forum', icon: MessageCircle },
    { to: '/about', label: 'About', icon: Info },
  ]

  const closeMenus = () => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [userMenuOpen])

  const userInitial = user?.name?.trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Dynamic animated background */}
      <Suspense fallback={null}>
        <DynamicBackground />
      </Suspense>

      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link
            to="/home"
            onClick={closeMenus}
            className="flex items-center gap-2 shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            aria-label="DinoProject home"
          >
            {logoFailed ? (
              <Dna size={34} className="text-green-400" aria-hidden="true" />
            ) : (
              <img
                src={LOGO}
                alt=""
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                onError={() => setLogoFailed(true)}
              />
            )}
            <span className="hidden sm:block text-lg sm:text-xl font-bold tracking-tight text-white">
              DinoProject
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-evenly gap-1" aria-label="Main navigation">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 xl:px-2.5 py-2 text-xs xl:text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-gray-300 hover:bg-gray-700/60 hover:text-green-400'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                <span className="hidden xl:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex shrink-0 items-center justify-end gap-2">
            <div className="w-36">
              <SearchBar />
            </div>

            <Link
              to="/support"
              title="Support us"
              aria-label="Support us"
              className="flex items-center gap-1 rounded-md px-2.5 py-2 text-xs font-semibold text-pink-400 bg-gradient-to-r from-pink-600/20 to-red-500/20 border border-pink-600/30 hover:from-pink-600/40 hover:to-red-500/40 hover:text-pink-300 transition-all duration-200"
            >
              <Heart size={17} className="animate-pulse shrink-0" aria-hidden="true" />
            </Link>

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(open => !open)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label={`Account menu for ${user.name}`}
                  title={user.name}
                  className="flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800/70 p-1 pr-1.5 text-gray-300 hover:border-gray-600 hover:bg-gray-700/70 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white">
                    {userInitial}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-50"
                  >
                    <div className="border-b border-gray-700 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-gray-400">{user.email}</p>
                    </div>
                    <NavLink
                      to="/dashboard"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-green-400 transition-colors"
                    >
                      <LayoutDashboard size={15} aria-hidden="true" /> Dashboard
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/60 hover:text-blue-400 transition-colors"
                    >
                      <SettingsIcon size={15} aria-hidden="true" /> Settings
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenus()
                        void logout()
                      }}
                      className="flex w-full items-center gap-2 border-t border-gray-700 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} aria-hidden="true" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
              >
                <LogIn size={16} aria-hidden="true" /> Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(open => !open)}
            className="lg:hidden ml-auto p-2.5 rounded-lg hover:bg-gray-700 transition"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-800 border-t border-gray-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex flex-col gap-0.5">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-green-500/10 text-green-400'
                        : 'text-gray-200 hover:bg-gray-700 hover:text-green-400'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" /> {label}
                </NavLink>
              ))}

              <hr className="border-gray-700 my-2" />

              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-bold text-white">
                      {userInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <NavLink to="/dashboard" onClick={closeMenus} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 hover:text-green-400 transition-colors">
                    <LayoutDashboard size={17} aria-hidden="true" /> Dashboard
                  </NavLink>
                  <NavLink to="/settings" onClick={closeMenus} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-700 hover:text-blue-400 transition-colors">
                    <SettingsIcon size={17} aria-hidden="true" /> Settings
                  </NavLink>
                  <NavLink to="/support" onClick={closeMenus} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-pink-400 bg-gradient-to-r from-pink-600/20 to-red-500/20 border border-pink-600/30 transition-colors">
                    <Heart size={17} aria-hidden="true" /> Support Us
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenus()
                      void logout()
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={17} aria-hidden="true" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/support" onClick={closeMenus} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-pink-400 bg-gradient-to-r from-pink-600/20 to-red-500/20 border border-pink-600/30 transition-colors">
                    <Heart size={17} aria-hidden="true" /> Support Us
                  </NavLink>
                  <NavLink to="/login" onClick={closeMenus} className="flex items-center justify-center gap-2 px-3 py-2.5 mt-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-500 transition-colors">
                    <LogIn size={17} aria-hidden="true" /> Login
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-x-clip">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <VisitedBreadcrumbs />
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/90 backdrop-blur-sm text-white mt-auto border-t border-gray-700 relative z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              {logoFailed ? (
                <Dna size={32} className="text-green-400" aria-hidden="true" />
              ) : (
                <img src={LOGO} alt="DinoProject" className="h-8 w-8 sm:h-10 sm:w-10" onError={() => setLogoFailed(true)} />
              )}
              <span className="text-lg sm:text-xl font-bold text-primary">DinoProject</span>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">Your ultimate destination for dinosaur education, exploration, and discovery.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Explore</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
              <li><Link to="/home" className="hover:text-primary transition flex items-center gap-2"><Home size={14} /> Home</Link></li>
              <li><Link to="/encyclopedia" className="hover:text-primary transition flex items-center gap-2"><BookOpen size={14} /> Encyclopedia</Link></li>
              <li><Link to="/dino-world" className="hover:text-primary transition flex items-center gap-2"><Globe2 size={14} /> Dino World</Link></li>
              <li><Link to="/timeline" className="hover:text-primary transition flex items-center gap-2"><Calendar size={14} /> Timeline</Link></li>
              <li><Link to="/quiz" className="hover:text-primary transition flex items-center gap-2"><Target size={14} /> Quizzes</Link></li>
              <li><Link to="/forum" className="hover:text-primary transition flex items-center gap-2"><MessageCircle size={14} /> Forum</Link></li>
              <li><Link to="/about" className="hover:text-primary transition flex items-center gap-2"><Info size={14} /> About Us</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Account</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
              <li><Link to="/dashboard" className="hover:text-primary transition flex items-center gap-2"><LayoutDashboard size={14} /> Dashboard</Link></li>
              <li><Link to="/settings" className="hover:text-primary transition flex items-center gap-2"><SettingsIcon size={14} /> Settings</Link></li>
              <li><Link to="/support" className="hover:text-primary transition flex items-center gap-2"><Heart size={14} /> Support Us</Link></li>
              <li><Link to="/login" className="hover:text-primary transition flex items-center gap-2"><LogIn size={14} /> Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Contact Us</h4>
            <div className="space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm">
              <a
                href="mailto:dinoprojectoriginal@gmail.com"
                className="flex items-center gap-2 hover:text-primary transition break-all"
              >
                <Mail size={14} className="shrink-0" /> dinoprojectoriginal@gmail.com
              </a>
              <div className="flex gap-4 pt-1 sm:pt-2">
                <a href="https://facebook.com/DinoProject" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="Facebook"><Facebook size={20} /></a>
                <a href="https://twitter.com/DinoProjectApp" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="Twitter"><Twitter size={20} /></a>
                <a href="https://instagram.com/dinoproject" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="Instagram"><Instagram size={20} /></a>
                <a href="https://youtube.com/@DinoProject" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="YouTube"><Youtube size={20} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <p className="text-center md:text-left">© {new Date().getFullYear()} DinoProject. Built by Ayomide Mathins.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Link to="/privacy" className="hover:text-primary transition">Privacy Policy</Link>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Made with ❤️ for dinosaur enthusiasts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
