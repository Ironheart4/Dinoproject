import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Dna, BookOpen, Brain, Search, Star, Loader2, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'

interface Dinosaur {
  id: number;
  name: string;
  species: string | null;
  period: string | null;
  diet: string | null;
  imageUrl1: string | null;
}

const FEATURES = [
  { icon: Dna, title: '3D Models', desc: 'Interactive 3D dinosaur models you can rotate and explore' },
  { icon: BookOpen, title: 'Encyclopedia', desc: 'Comprehensive database with 100+ dinosaur species' },
  { icon: Brain, title: 'Quizzes', desc: 'Test your knowledge and track your progress' },
]

export default function Home() {
  useDocumentTitle('Home', ' — DinoProject');
  const [featuredDinos, setFeaturedDinos] = useState<Dinosaur[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/api/dinosaurs');
        // Get first 6 as featured
        setFeaturedDinos(res.data.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch featured dinosaurs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-10 sm:py-16 lg:py-20 px-4 sm:px-8 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg overflow-hidden mb-8 sm:mb-12">
        <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-10 hidden sm:flex">
          <Dna size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4">Discover the World of Dinosaurs</h1>
          <p className="text-base sm:text-lg text-gray-100 mb-6">
            Explore prehistoric creatures in stunning 3D, test your knowledge with quizzes, and unlock premium content!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/encyclopedia" className="px-6 py-3 bg-accent-400 text-black font-semibold rounded hover:bg-yellow-400 transition text-center">
              Explore Dinosaurs
            </Link>
            <Link to="/support" className="px-6 py-3 bg-white text-primary-700 font-semibold rounded hover:bg-gray-100 transition flex items-center justify-center gap-2">
              Support Us <Heart size={16} className="text-pink-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Dinosaurs Carousel */}
      <section className="mb-10 sm:mb-16">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-primary">Featured Dinosaurs</h2>
          {featuredDinos.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                disabled={carouselIndex === 0}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const itemsPerView = window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
                  setCarouselIndex(Math.min(Math.max(0, featuredDinos.length - itemsPerView), carouselIndex + 1));
                }}
                disabled={carouselIndex >= featuredDinos.length - 1}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 size={48} className="animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading featured dinosaurs...</p>
          </div>
        ) : featuredDinos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Search size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">No featured dinosaurs yet. Check back soon!</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div 
              ref={carouselRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {featuredDinos.map(dino => (
                <Link key={dino.id} to={`/dino/${dino.id}`} className="block">
                  <div className="bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden h-full group">
                    {dino.imageUrl1 ? (
                      <div className="h-40 sm:h-48 overflow-hidden">
                        <img 
                          src={dino.imageUrl1} 
                          alt={dino.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-40 sm:h-48 bg-gray-700 flex items-center justify-center">
                        <Dna size={64} className="text-gray-500" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg sm:text-xl font-semibold font-display text-primary mb-1">{dino.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{dino.species || 'Unknown species'}</p>
                      <div className="flex gap-2 flex-wrap">
                        {dino.period && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{dino.period}</span>
                        )}
                        {dino.diet && (
                          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{dino.diet}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Carousel Dots */}
            {featuredDinos.length > 3 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: Math.max(1, featuredDinos.length - 2) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === carouselIndex ? 'bg-green-500 w-6' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Premium Features Section */}
      <section className="mb-10 sm:mb-16 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-primary mb-2">Unlock Premium Features</h2>
          <p className="text-gray-300 text-sm sm:text-base">Get full access to all dinosaur content with a Premium subscription</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon
            return (
              <div key={idx} className="bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-700">
                <IconComponent size={48} className="mx-auto mb-4 text-green-400" />
                <h3 className="font-semibold text-primary text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <Link 
            to="/support" 
            className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            Support DinoProject
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent-500 text-white rounded-lg p-6 sm:p-12 text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">Ready to Learn More?</h2>
        <p className="text-base sm:text-lg mb-6 max-w-2xl mx-auto">
          Take our interactive dinosaur quiz to test your knowledge and track your progress!
        </p>
        <Link to="/quiz" className="px-6 sm:px-8 py-3 bg-white text-accent-500 font-semibold rounded hover:bg-gray-100 transition inline-block">
          Start Quiz
        </Link>
      </section>

      {/* Info Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 shadow text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-green-400" />
          <h3 className="font-semibold text-primary mb-2">Learn</h3>
          <p className="text-gray-400 text-sm">Explore our comprehensive dinosaur encyclopedia with detailed information.</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 shadow text-center">
          <Brain size={40} className="mx-auto mb-3 text-blue-400" />
          <h3 className="font-semibold text-primary mb-2">Quiz</h3>
          <p className="text-gray-400 text-sm">Test your dinosaur knowledge and see how you compare with others.</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 shadow text-center">
          <Star size={40} className="mx-auto mb-3 text-yellow-400" />
          <h3 className="font-semibold text-primary mb-2">Premium</h3>
          <p className="text-gray-400 text-sm">Unlock HD content, 3D models, favorites, and exclusive features.</p>
        </div>
      </section>


    </div>
  )
}

