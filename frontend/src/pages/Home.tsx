// Home.tsx — Public landing page with animated hero, 3D viewer, and featured dinosaurs
// Responsibilities:
// - Displays immersive hero section with particle background and rotating 3D dinosaur
// - Fetches featured dinosaurs for the homepage carousel
// - Promotes premium features and links to key app sections
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { BookOpen, Brain, Search, Loader2, ChevronLeft, ChevronRight, Heart, Sparkles, Play } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import ParticleBackground from '../components/ParticleBackground'
import HeroDinoViewer from '../components/HeroDinoViewer'
import { TRexIcon, DinoFootprint } from '../components/DinoIcons'

interface Dinosaur {
  id: number
  name: string
  species: string | null
  period: string | null
  diet: string | null
  imageUrl1: string | null
  modelUrl: string | null
}

const FEATURES = [
  { icon: TRexIcon, title: '3D Models', desc: 'Interactive 3D dinosaur models you can rotate and explore', color: 'text-green-400' },
  { icon: BookOpen, title: 'Encyclopedia', desc: 'Comprehensive database with 100+ dinosaur species', color: 'text-blue-400' },
  { icon: Brain, title: 'Quizzes', desc: 'Test your knowledge and track your progress', color: 'text-purple-400' },
]

const STATS = [
  { value: '100+', label: 'Dinosaur Species' },
  { value: '50+', label: '3D Models' },
  { value: '500+', label: 'Quiz Questions' },
  { value: '10K+', label: 'Happy Learners' },
]

export default function Home() {
  useDocumentTitle('Home', ' — DinoProject')
  const [featuredDinos, setFeaturedDinos] = useState<Dinosaur[]>([])
  const [allDinos, setAllDinos] = useState<Dinosaur[]>([])
  const [loading, setLoading] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    const fetchDinos = async () => {
      try {
        const res = await api.get('/api/dinosaurs')
        setAllDinos(res.data)
        setFeaturedDinos(res.data.slice(0, 6))
      } catch (err) {
        console.error('Failed to fetch dinosaurs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDinos()
  }, [])

  return (
    <div className="space-y-12 lg:space-y-20">
      {/* Hero Section - Full Width with Particles and 3D Viewer */}
      <section className="relative -mx-4 sm:-mx-8 lg:-mx-12 px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900/30 to-gray-900" />
        
        {/* Animated Particles */}
        <ParticleBackground />

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>Explore the Prehistoric World</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display text-white mb-6 leading-tight">
                Discover the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
                  World of Dinosaurs
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Journey through time with stunning 3D models, interactive quizzes, and a comprehensive encyclopedia of prehistoric creatures.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link 
                  to="/encyclopedia" 
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                >
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                  Start Exploring
                </Link>
                <Link 
                  to="/support" 
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Heart size={20} className="text-pink-400" />
                  Support Us
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
                {STATS.map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D Dinosaur Viewer */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-3xl" />
              
              {/* 3D Viewer Container */}
              <div className="relative h-[350px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 size={48} className="animate-spin text-green-400 mx-auto mb-4" />
                      <p className="text-gray-400">Loading dinosaurs...</p>
                    </div>
                  </div>
                ) : (
                  <HeroDinoViewer dinosaurs={allDinos} />
                )}

                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400/50 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400/50 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400/50 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400/50 rounded-br-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dinosaurs */}
      <section>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white flex items-center gap-3">
              <TRexIcon size={32} className="text-green-400" />
              Featured Dinosaurs
            </h2>
            <p className="text-gray-400 mt-2">Discover our most popular prehistoric creatures</p>
          </div>
          {featuredDinos.length > 3 && (
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                disabled={carouselIndex === 0}
                className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition border border-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCarouselIndex(Math.min(Math.max(0, featuredDinos.length - 3), carouselIndex + 1))}
                disabled={carouselIndex >= featuredDinos.length - 3}
                className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition border border-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={48} className="animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading featured dinosaurs...</p>
          </div>
        ) : featuredDinos.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-2xl border border-gray-700">
            <Search size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No featured dinosaurs yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDinos.map(dino => (
              <Link key={dino.id} to={`/dino/${dino.id}`} className="group block">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 overflow-hidden h-full">
                  {dino.imageUrl1 && dino.imageUrl1 !== 'DEV_PENDING' ? (
                    <div className="h-48 sm:h-56 overflow-hidden relative">
                      <img 
                        src={dino.imageUrl1} 
                        alt={dino.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-56 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
                      <TRexIcon size={80} className="text-gray-600" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="p-5 relative">
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors mb-1">
                      {dino.name}
                    </h3>
                    <p className="text-gray-400 text-sm italic mb-3">{dino.species || 'Unknown species'}</p>
                    <div className="flex gap-2 flex-wrap">
                      {dino.period && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                          {dino.period}
                        </span>
                      )}
                      {dino.diet && (
                        <span className={`text-xs px-3 py-1 rounded-full border ${
                          dino.diet === 'carnivorous' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : dino.diet === 'herbivorous'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {dino.diet}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link 
            to="/encyclopedia"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition border border-gray-700"
          >
            View All Dinosaurs
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white mb-3">
            Why Choose DinoProject?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The most immersive way to learn about dinosaurs with cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon
            return (
              <div 
                key={idx} 
                className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <IconComponent size={32} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>

                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />

        <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16 text-center">
          <div className="flex justify-center mb-6">
            <DinoFootprint size={64} className="text-white/80" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-4">
            Ready to Learn More?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Take our interactive dinosaur quiz to test your knowledge and compete with other dino enthusiasts!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/quiz" 
              className="px-8 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Brain size={20} />
              Start Quiz
            </Link>
            <Link 
              to="/timeline" 
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30 flex items-center justify-center gap-2"
            >
              Explore Timeline
            </Link>
          </div>
        </div>
      </section>

      {/* Info Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-blue-500/50 transition-all group">
          <BookOpen size={48} className="mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-xl mb-2">Learn</h3>
          <p className="text-gray-400">Explore our comprehensive dinosaur encyclopedia with detailed information about every species.</p>
          <Link to="/encyclopedia" className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 font-medium">
            Browse Encyclopedia <ChevronRight size={16} />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-purple-500/50 transition-all group">
          <Brain size={48} className="mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-xl mb-2">Quiz</h3>
          <p className="text-gray-400">Test your dinosaur knowledge with challenging quizzes and see how you rank among other learners.</p>
          <Link to="/quiz" className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 font-medium">
            Take a Quiz <ChevronRight size={16} />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-pink-500/50 transition-all sm:col-span-2 lg:col-span-1 group">
          <Heart size={48} className="mb-4 text-pink-400 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-xl mb-2">Support</h3>
          <p className="text-gray-400">Help us grow DinoProject and unlock premium features like HD models and unlimited favorites.</p>
          <Link to="/support" className="inline-flex items-center gap-2 mt-4 text-pink-400 hover:text-pink-300 font-medium">
            Become a Supporter <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

