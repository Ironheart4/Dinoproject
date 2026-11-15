// Home.tsx — Public landing page with animated hero, 3D viewer, and featured dinosaurs
// Responsibilities:
// - Displays immersive hero section with particle background and rotating 3D dinosaur
// - Fetches featured dinosaurs for the homepage carousel
// - Promotes premium features and links to key app sections
// - Journey Through Ages preview, Community forum preview, Achievement showcase
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { BookOpen, Brain, Search, Loader2, ChevronLeft, ChevronRight, Heart, Sparkles, Play, Clock, Calendar, Users, MessageSquare, Map, ArrowRight, Award, Eye, Globe, PenTool, HelpCircle, Star, Zap, Swords } from 'lucide-react'
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
  { icon: GiDinosaurBones, title: '3D Models', desc: 'Rotate, zoom, and explore detailed 3D dinosaur models in real-time', color: 'text-green-400', link: '/encyclopedia' },
  { icon: BookOpen, title: 'Encyclopedia', desc: 'Access facts, images, and stats for 100+ species — updated weekly', color: 'text-blue-400', link: '/encyclopedia' },
  { icon: Brain, title: 'Quizzes', desc: 'Test yourself with 500+ questions across Easy, Medium, and Hard levels', color: 'text-purple-400', link: '/quiz' },
  { icon: Swords, title: 'Battle Arena', desc: 'Pick two dinosaurs and watch them clash — who will win?', color: 'text-red-400', link: '/battle' },
  { icon: Clock, title: 'Timeline', desc: 'Travel through 180 million years from Triassic to Cretaceous extinction', color: 'text-orange-400', link: '/timeline' },
  { icon: MessageSquare, title: 'Community', desc: 'Join 10,000+ members discussing discoveries and sharing insights daily', color: 'text-pink-400', link: '/forum' },
  { icon: Map, title: 'Fossil Map', desc: 'Pinpoint fossil sites across 6 continents with our interactive world map', color: 'text-cyan-400', link: '/timeline' },
]

const STATS = [
  { value: '100+', label: 'Dinosaur Species', icon: GiDinosaurRex },
  { value: '100+', label: '3D Models', icon: GiDinosaurBones },
  { value: '500+', label: 'Quiz Questions', icon: HelpCircle },
  { value: '10+', label: 'Features', icon: Sparkles },
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
        // Phase A: use lightweight /featured instead of full list
        const res = await api.get('/api/dinosaurs/featured')
        setAllDinos(res.data)
        setFeaturedDinos(res.data)
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
      {/* PLACEHOLDER_REST_OF_HOME - will fail if incomplete */}
    </div>
  )
}
