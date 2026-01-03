import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { 
  LayoutDashboard, Heart, Home, BookOpen, Target, Info, LogIn, 
  Mail, Twitter, Instagram, Youtube, MessageCircle, Calendar, Github 
} from 'lucide-react'

const LOGO = 'https://i.postimg.cc/gcMbkWV0/Dino-Project-Logo.png'

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO} alt="DinoProject" className="h-10 w-10" />
            <span className="text-xl font-bold font-display text-primary">DinoProject</span>
          </Link>

          <nav className="flex gap-1 items-center text-sm font-medium text-gray-200">
            <Link to="/" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">Home</Link>
            <Link to="/encyclopedia" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">Encyclopedia</Link>
            <Link to="/timeline" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">Timeline</Link>
            <Link to="/quiz" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">Quiz</Link>
            <Link to="/forum" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">Forum</Link>
            <Link to="/about" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">About</Link>

            {user ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200 flex items-center gap-1">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/support" className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 hover:from-pink-600/40 hover:to-red-500/40 text-pink-400 hover:text-pink-300 transition-all duration-200 font-semibold flex items-center gap-1 border border-pink-600/30">
                  <Heart size={16} className="animate-pulse" /> Support Us
                </Link>
                <div className="flex items-center gap-2 ml-2">
                  <Link to="/dashboard" className="px-3 py-2 rounded-lg hover:bg-gray-700 hover:text-green-400 transition-all duration-200">{user.name}</Link>
                  <button onClick={logout} className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 text-xs">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/support" className="px-3 py-2 rounded-lg bg-gradient-to-r from-pink-600/20 to-red-500/20 hover:from-pink-600/40 hover:to-red-500/40 text-pink-400 hover:text-pink-300 transition-all duration-200 font-semibold flex items-center gap-1 border border-pink-600/30">
                  <Heart size={16} className="animate-pulse" /> Support Us
                </Link>
                <Link to="/login" className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold">Login</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-auto border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={LOGO} alt="DinoProject" className="h-10 w-10" />
              <span className="text-xl font-bold text-primary">DinoProject</span>
            </div>
            <p className="text-gray-400">Your ultimate destination for dinosaur education, exploration, and discovery.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Explore</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-primary transition flex items-center gap-2"><Home size={14} /> Home</Link></li>
              <li><Link to="/encyclopedia" className="hover:text-primary transition flex items-center gap-2"><BookOpen size={14} /> Encyclopedia</Link></li>
              <li><Link to="/timeline" className="hover:text-primary transition flex items-center gap-2"><Calendar size={14} /> Timeline</Link></li>
              <li><Link to="/quiz" className="hover:text-primary transition flex items-center gap-2"><Target size={14} /> Quizzes</Link></li>
              <li><Link to="/forum" className="hover:text-primary transition flex items-center gap-2"><MessageCircle size={14} /> Forum</Link></li>
              <li><Link to="/about" className="hover:text-primary transition flex items-center gap-2"><Info size={14} /> About Us</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Account</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/dashboard" className="hover:text-primary transition flex items-center gap-2"><LayoutDashboard size={14} /> Dashboard</Link></li>
              <li><Link to="/support" className="hover:text-primary transition flex items-center gap-2"><Heart size={14} /> Support Us</Link></li>
              <li><Link to="/login" className="hover:text-primary transition flex items-center gap-2"><LogIn size={14} /> Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
            <div className="space-y-3 text-gray-400">
              <a 
                href="mailto:dinoprojectoriginal@gmail.com" 
                className="flex items-center gap-2 hover:text-primary transition"
              >
                <Mail size={14} /> dinoprojectoriginal@gmail.com
              </a>
              <div className="flex gap-3 pt-2">
                <a href="https://github.com/Ironheart4" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="GitHub"><Github size={20} /></a>
                <a href="https://twitter.com/DinoProjectApp" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="Twitter"><Twitter size={20} /></a>
                <a href="https://instagram.com/dinoproject" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="Instagram"><Instagram size={20} /></a>
                <a href="https://youtube.com/@DinoProject" target="_blank" rel="noopener noreferrer" className="hover:scale-110 hover:text-primary transition" title="YouTube"><Youtube size={20} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 py-4">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} DinoProject. Built by Ayomide Mathins.</p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <Link to="/privacy" className="hover:text-primary transition">Privacy Policy</Link>
              <span>•</span>
              <a href="https://github.com/Ironheart4" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition flex items-center gap-1"><Github size={12} /> GitHub</a>
              <span>•</span>
              <span>Made with ❤️ for dinosaur enthusiasts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

