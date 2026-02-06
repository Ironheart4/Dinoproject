// Home.tsx — Public landing page with animated hero, 3D viewer, and featured dinosaurs
// Responsibilities:
// - Displays immersive hero section with particle background and rotating 3D dinosaur
// - Fetches featured dinosaurs for the homepage carousel
// - Promotes premium features and links to key app sections
// - Journey Through Ages preview, Community forum preview, Achievement showcase
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { BookOpen, Brain, Search, Loader2, ChevronLeft, ChevronRight, Heart, Sparkles, Play, Clock, Users, MessageSquare, Map, ArrowRight, Award, Eye, Globe, PenTool, HelpCircle, Star, Zap, Swords } from 'lucide-react'
import { GiDinosaurRex, GiBrokenBone, GiDinosaurBones } from 'react-icons/gi'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import ParticleBackground from '../components/ParticleBackground'
import HeroDinoViewer from '../components/HeroDinoViewer'
import { DinoFootprint, BrachioIcon } from '../components/DinoIcons'

interface Dinosaur {
  id: number
  name: string
  species: string | null
  period: string | null
  diet: string | null
  imageUrl1: string | null
  modelUrl: string | null
}

// Time periods for Journey Through Ages
const TIME_PERIODS = [
  { name: 'Triassic', years: '252-201 MYA', color: '#E74C3C', desc: 'Explore 15+ species from the first dinosaur era' },
  { name: 'Jurassic', years: '201-145 MYA', color: '#3498DB', desc: 'Meet 40+ giants including Brachiosaurus' },
  { name: 'Cretaceous', years: '145-66 MYA', color: '#398f61', desc: 'Discover 50+ species from the final dinosaur age' },
]

// Achievement preview data
const FEATURED_ACHIEVEMENTS = [
  { icon: Award, title: 'Quiz Master', desc: 'Score 80%+ on 10 quizzes', color: '#f97316' },
  { icon: Eye, title: 'Expert Explorer', desc: 'View 50 unique species', color: '#3b82f6' },
  { icon: Globe, title: 'World Traveler', desc: 'Find fossils on 6 continents', color: '#a855f7' },
]

const FEATURES = [
  { icon: GiDinosaurBones, title: '3D Models', desc: 'Rotate, zoom, and explore 50+ detailed 3D dinosaur models in real-time', color: 'text-green-400', link: '/encyclopedia' },
  { icon: BookOpen, title: 'Encyclopedia', desc: 'Access facts, images, and stats for 100+ species — updated weekly', color: 'text-blue-400', link: '/encyclopedia' },
  { icon: Brain, title: 'Quizzes', desc: 'Test yourself with 500+ questions across Easy, Medium, and Hard levels', color: 'text-purple-400', link: '/quiz' },
  { icon: Swords, title: 'Battle Arena', desc: 'Pick two dinosaurs and watch them clash — who will win?', color: 'text-red-400', link: '/battle' },
  { icon: Clock, title: 'Timeline', desc: 'Travel through 180 million years from Triassic to Cretaceous extinction', color: 'text-orange-400', link: '/timeline' },
  { icon: MessageSquare, title: 'Community', desc: 'Join 10,000+ members discussing discoveries and sharing insights daily', color: 'text-pink-400', link: '/forum' },
  { icon: Map, title: 'Fossil Map', desc: 'Pinpoint fossil sites across 6 continents with our interactive world map', color: 'text-cyan-400', link: '/timeline' },
]

const STATS = [
  { value: '100+', label: 'Dinosaur Species', icon: GiDinosaurRex },
  { value: '50+', label: '3D Models', icon: GiDinosaurBones },
  { value: '500+', label: 'Quiz Questions', icon: HelpCircle },
  { value: '10K+', label: 'Happy Learners', icon: Users },
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
                {STATS.map((stat, i) => {
                  const StatIcon = stat.icon
                  return (
                    <div key={i} className="text-center lg:text-left group cursor-default">
                      <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                        <StatIcon size={20} className="text-green-400 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
                      </div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  )
                })}
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
              <GiDinosaurRex className="text-green-400 text-3xl" />
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
                      <GiBrokenBone className="text-gray-600 text-7xl" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon
            return (
              <Link 
                key={idx} 
                to={feature.link}
                className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <IconComponent size={32} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>

                {/* Arrow indicator */}
                <ArrowRight size={20} className="absolute bottom-6 right-6 text-gray-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />

                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Journey Through the Ages */}
      <section className="relative py-12 sm:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-4">
            <Clock size={16} />
            <span>Time Travel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white mb-3">
            Journey Through the Ages
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore 180 million years of dinosaur evolution across three magnificent eras
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIME_PERIODS.map((period, idx) => (
            <Link 
              key={period.name}
              to={`/timeline?era=${period.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-700 hover:border-opacity-0 transition-all duration-500"
              style={{ '--era-color': period.color } as React.CSSProperties}
            >
              {/* Background gradient */}
              <div 
                className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${period.color}40 0%, transparent 70%)` }}
              />
              
              <div className="relative p-8">
                {/* Era number */}
                <div 
                  className="text-7xl font-bold opacity-10 absolute top-4 right-4"
                  style={{ color: period.color }}
                >
                  {idx + 1}
                </div>

                {/* Era badge */}
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${period.color}30`, color: period.color }}
                >
                  {period.years}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">
                  {period.name}
                </h3>
                <p className="text-gray-400 mb-4">{period.desc}</p>

                {/* Animated arrow */}
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: period.color }}>
                  <span>Explore Era</span>
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>

              {/* Bottom glow */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: period.color }}
              />
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/timeline"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-medium rounded-xl transition border border-orange-500/30"
          >
            <Clock size={20} />
            View Full Timeline
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Achievement Preview */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700">
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium mb-4">
                <Zap size={16} />
                <span>Gamification</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white mb-4">
                Unlock 25+ Achievements
              </h2>
              <p className="text-gray-400 mb-6 max-w-lg">
                Earn badges for every milestone — complete 10 quizzes, explore 50 species, or discover fossils on all continents. Track your progress and compete on the global leaderboard.
              </p>
              <Link 
                to="/quiz"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
              >
                <Star size={20} />
                Start Earning
              </Link>
            </div>

            {/* Right: Achievement cards */}
            <div className="flex gap-4 flex-wrap justify-center">
              {FEATURED_ACHIEVEMENTS.map((achievement, idx) => {
                const AchIcon = achievement.icon
                return (
                  <div 
                    key={idx}
                    className="group w-32 h-40 rounded-2xl border border-gray-700 hover:border-opacity-0 transition-all duration-300 flex flex-col items-center justify-center p-4 hover:-translate-y-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${achievement.color}15 0%, transparent 100%)`,
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${achievement.color}30` }}
                    >
                      <AchIcon size={24} style={{ color: achievement.color }} />
                    </div>
                    <h4 className="text-sm font-bold text-white text-center">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">{achievement.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
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
            <div className="relative">
              <DinoFootprint size={64} className="text-white/80" />
              <Sparkles size={20} className="absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-4">
            Ready to Test Your Dino Knowledge?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Answer 10 questions in under 5 minutes. Score 80%+ to earn the Quiz Master badge and join our top 100 leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/quiz" 
              className="group px-8 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Brain size={20} />
              Start Quiz Challenge
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/timeline" 
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30 flex items-center justify-center gap-2"
            >
              <Clock size={20} />
              Explore Timeline
            </Link>
          </div>
        </div>
      </section>

      {/* Community Preview */}
      <section className="relative py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left: Community visual */}
          <div className="flex-1 relative">
            <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700 p-6 overflow-hidden">
              {/* Mock forum posts */}
              <div className="space-y-4">
                {[
                  { user: 'DinoLover42', topic: 'Best T-Rex facts?', time: '2h ago', replies: 15 },
                  { user: 'PaleoNerd', topic: 'My fossil collection', time: '5h ago', replies: 23 },
                  { user: 'JurassicFan', topic: 'Favorite dinosaur?', time: '1d ago', replies: 42 },
                ].map((post, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {post.user[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{post.topic}</h4>
                      <p className="text-sm text-gray-500">by {post.user} · {post.time}</p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MessageSquare size={16} />
                      <span className="text-sm">{post.replies}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Decorative overlay */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-800/80 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-400 text-sm font-medium mb-4">
              <Users size={16} />
              <span>Community</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white mb-4">
              Join 10,000+ Dino Fans
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto lg:mx-0">
              Post questions, share discoveries, and get answers within 24 hours. Our active community adds 50+ new discussions weekly across 8 topic categories.
            </p>
            <Link 
              to="/forum"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition border border-gray-700"
            >
              <MessageSquare size={20} />
              Browse Forum
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Info Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-blue-500/50 transition-all group hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool size={28} className="text-blue-400" />
            </div>
          </div>
          <h3 className="font-bold text-white text-xl mb-2">Learn</h3>
          <p className="text-gray-400">Discover 100+ dinosaur species with detailed facts, images, and 3D models. Master prehistoric knowledge in minutes.</p>
          <Link to="/encyclopedia" className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 font-medium group/link">
            Browse Encyclopedia <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-purple-500/50 transition-all group hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain size={28} className="text-purple-400" />
            </div>
          </div>
          <h3 className="font-bold text-white text-xl mb-2">Quiz</h3>
          <p className="text-gray-400">Challenge yourself with 500+ questions across 3 difficulty levels. Track your score and climb the global leaderboard.</p>
          <Link to="/quiz" className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 font-medium group/link">
            Take a Quiz <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-700 hover:border-pink-500/50 transition-all sm:col-span-2 lg:col-span-1 group hover:-translate-y-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart size={28} className="text-pink-400" />
            </div>
          </div>
          <h3 className="font-bold text-white text-xl mb-2">Support</h3>
          <p className="text-gray-400">Unlock HD 3D models, unlimited favorites, and ad-free browsing. Your support helps us add 20+ new species monthly.</p>
          <Link to="/support" className="inline-flex items-center gap-2 mt-4 text-pink-400 hover:text-pink-300 font-medium group/link">
            Become a Supporter <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}

