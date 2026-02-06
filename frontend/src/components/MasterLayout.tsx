// MasterLayout.tsx — Global layout (header, footer, mobile nav)
// Notes:
// - Update `navLinks` array to add/remove top-level navigation items
// - Uses `useAuth()` to display user-specific links (Dashboard, Logout)
// - Footer contains quick links and contact info; adjust for branding or legal text
import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { 
  LayoutDashboard, Heart, Home, BookOpen, Target, Info, LogIn, 
  Mail, Twitter, Instagram, Youtube, MessageCircle, Calendar, Facebook,
  Menu, X
} from 'lucide-react'

// Lazy load the heavy background component
const DynamicBackground = lazy(() => import('./DynamicBackground'))

const LOGO = 'https://i.postimg.cc/gcMbkWV0/Dino-Project-Logo.png'

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/encyclopedia', label: 'Encyclopedia' },
    { to: '/timeline', label: 'Timeline' },
    { to: '/quiz', label: 'Quiz' },
    { to: '/forum', label: 'Forum' },
    { to: '/about', label: 'About' },
  ]

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Dynamic animated background */}
      <Suspense fallback={null}>
        <DynamicBackground />
      </Suspense>
      
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-700/50 relative">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center" onClick={closeMobileMenu}>
            <img src={LOGO} alt="DinoProject" className="h-10 w-10 sm:h-12 sm:w-12" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-1 items-center text-sm font-medium text-gray-200">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200 flex items-center gap-1">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/support" className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 hover:from-pink-600/40 hover:to-red-500/40 text-pink-400 hover:text-pink-300 transition-all duration-200 font-semibold flex items-center gap-1 border border-pink-600/30">
                  <Heart size={16} className="animate-pulse" /> Support
                </Link>
                <div className="flex items-center gap-2 ml-2">
                  <span className="px-3 py-2 text-gray-300">{user.name}</span>
                  <button onClick={logout} className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 text-xs">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/support" className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 hover:from-pink-600/40 hover:to-red-500/40 text-pink-400 hover:text-pink-300 transition-all duration-200 font-semibold flex items-center gap-1 border border-pink-600/30">
                  <Heart size={16} className="animate-pulse" /> Support
                </Link>
                <Link to="/login" className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold">Login</Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-800 border-t border-gray-700">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  onClick={closeMobileMenu}
                  className="px-4 py-3 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200 text-base"
                >
                  {link.label}
                </Link>
              ))}
              
              <hr className="border-gray-700 my-2" />
              
              {user ? (
                <>
                  <Link to="/dashboard" onClick={closeMobileMenu} className="px-4 py-3 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200 flex items-center gap-2">
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <Link to="/support" onClick={closeMobileMenu} className="px-4 py-3 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 text-pink-400 flex items-center gap-2 border border-pink-600/30">
                    <Heart size={18} /> Support Us
                  </Link>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-gray-300">{user.name}</span>
                    <button onClick={() => { logout(); closeMobileMenu(); }} className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm">Logout</button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/support" onClick={closeMobileMenu} className="px-4 py-3 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 text-pink-400 flex items-center gap-2 border border-pink-600/30">
                    <Heart size={18} /> Support Us
                  </Link>
                  <Link to="/login" onClick={closeMobileMenu} className="px-4 py-3 bg-green-600 text-white rounded-lg text-center font-semibold">Login</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/90 backdrop-blur-sm text-white mt-auto border-t border-gray-700 relative z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <img src={LOGO} alt="DinoProject" className="h-8 w-8 sm:h-10 sm:w-10" />
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

