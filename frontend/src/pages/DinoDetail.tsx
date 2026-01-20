
// DinoDetail.tsx — Dinosaur detail page
// Responsibilities:
// - Displays dinosaur metadata, images, video, 3D model (gated by premium or favorites), and roar audio
// - Manages favorites and checks subscription status to control gated content
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDino } from '../lib/api'
import DinoViewer from '../components/DinoViewer'
import DinoSound from '../components/DinoSound'
import { useAuth } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle' 
import {
  Heart, Lock, Star, Calendar, Globe, Ruler, Scale, Home as HomeIcon,
  PenTool, Microscope, BookOpen, Image, Video, Loader2, AlertTriangle
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function DinoDetail() {
  const { id } = useParams()
  const { user, token } = useAuth()
  const [dino, setDino] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [favoriteError, setFavoriteError] = useState<string | null>(null)
  const [isPremiumOrDonor, setIsPremiumOrDonor] = useState(false)

  // Dynamic page title
  useDocumentTitle(dino ? `${dino.name} - Dinosaur Details` : 'Loading...');

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetchDino(parseInt(id))
      .then(setDino)
      .catch(err => {
        console.error('Failed to fetch dino:', err)
        setError('Dinosaur not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  // Check user subscription status
  useEffect(() => {
    if (!token) {
      setIsPremiumOrDonor(false)
      return
    }
    fetch(`${API}/api/subscription`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const hasPremiumAccess = data && 
          (data.plan === 'premium' || data.plan === 'donor') && 
          data.status === 'active'
        setIsPremiumOrDonor(hasPremiumAccess)
      })
      .catch(() => setIsPremiumOrDonor(false))
  }, [token])

  // Check if dinosaur is favorited
  useEffect(() => {
    if (!user || !token || !id) return
    fetch(`${API}/api/favorites/check/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setIsFavorited(data.isFavorited))
      .catch(() => {})
  }, [user, token, id])

  const toggleFavorite = async () => {
    if (!token || !id) return
    setFavoriteLoading(true)
    setFavoriteError(null)
    try {
      if (isFavorited) {
        await fetch(`${API}/api/favorites/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFavorited(false)
      } else {
        const res = await fetch(`${API}/api/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ dinosaurId: parseInt(id) })
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.limitReached) {
            setFavoriteError('You\'ve reached the 5 favorite limit. Upgrade to unlock unlimited favorites!')
          } else {
            setFavoriteError(data.error || 'Failed to add favorite')
          }
          return
        }
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      setFavoriteError('Failed to update favorite')
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Can view 3D model if: premium/donor OR favorited (free users can view their favorites in 3D)
  const canView3DModel = isPremiumOrDonor || isFavorited

  // Collect available images
  const images = dino ? [
    dino.imageUrl1, dino.imageUrl2, dino.imageUrl3, dino.imageUrl4, dino.imageUrl5
  ].filter(url => url && url !== 'DEV_PENDING') : []

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/encyclopedia" className="text-green-400 hover:text-green-300 mb-4 inline-block">
        ← Back to Encyclopedia
      </Link>

      {error && <div className="p-4 bg-red-900/50 text-red-300 rounded-lg mb-4">{error}</div>}
      
      {loading && (
        <div className="text-gray-400 flex items-center gap-2">
          <Loader2 size={20} className="animate-spin" /> Loading dinosaur...
        </div>
      )}

      {dino && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{dino.name}</h1>
              <p className="text-lg sm:text-xl text-gray-400 italic">{dino.species}</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Like Button - Only for logged-in users */}
              {user && (
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isFavorited 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-red-400'
                  } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favoriteLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Heart size={20} className={isFavorited ? 'fill-current' : ''} />
                  )}
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dino.diet === 'carnivorous' ? 'bg-red-900 text-red-300' :
                dino.diet === 'herbivorous' ? 'bg-green-900 text-green-300' :
                'bg-yellow-900 text-yellow-300'
              }`}>
                {dino.diet || 'Unknown diet'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-300">
                {dino.type || 'Unknown type'}
              </span>
            </div>
          </div>

          {/* Favorite Error Alert */}
          {favoriteError && (
            <div className="p-4 bg-yellow-900/50 border border-yellow-600 text-yellow-300 rounded-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><AlertTriangle size={18} /> {favoriteError}</span>
              <Link 
                to="/support" 
                className="ml-4 px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg transition"
              >
                Support Us
              </Link>
            </div>
          )}

          {/* 3D Viewer */}
          <div className="bg-gray-800 rounded-lg p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">3D Model</h2>
            {canView3DModel ? (
              <div className="w-full min-h-[300px] sm:min-h-[420px] lg:min-h-[520px] flex items-center justify-center overflow-hidden">
                <div className="w-full max-w-6xl rounded-lg" style={{ paddingTop: '1rem' }}>
                  <DinoViewer url={dino.modelUrl} height="100%" background="#000000" cameraY={2.2} targetY={0.6} />
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[300px] sm:min-h-[420px] lg:min-h-[520px] flex flex-col items-center justify-center bg-gray-900 rounded-lg border-2 border-dashed border-gray-600 p-4">                <Lock size={48} className="text-gray-500 mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">3D Model Locked</h3>
                <p className="text-gray-400 text-center max-w-md mb-4 text-sm sm:text-base px-4">
                  {user 
                    ? 'Add this dinosaur to your favorites to unlock the 3D viewer, or upgrade for full access to all 3D models!'
                    : 'Log in and add to favorites to view this 3D model, or upgrade for unlimited access!'
                  }
                </p>
                <div className="flex gap-3">
                  {user ? (
                    <>
                      <button
                        onClick={toggleFavorite}
                        disabled={favoriteLoading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                      >
                        <Heart size={16} /> Add to Favorites
                      </button>
                      <Link 
                        to="/support"
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg transition flex items-center gap-2"
                      >
                        <Heart size={16} /> Support Us
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to="/login"
                      className="px-4 py-2 bg-primary hover:bg-green-600 text-white rounded-lg transition"
                    >
                      Log In
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Audio Player */}
          <DinoSound src={dino.roarSound} label={`${dino.name} roar sound`} />

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Calendar size={14} /> Period</h3>
              <p className="text-white font-medium">{dino.period || 'Unknown'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Globe size={14} /> Lived In</h3>
              <p className="text-white font-medium">{dino.livedIn || 'Unknown'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Ruler size={14} /> Length</h3>
              <p className="text-white font-medium">{dino.lengthMeters ? `${dino.lengthMeters} meters` : 'Unknown'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><Scale size={14} /> Weight</h3>
              <p className="text-white font-medium">{dino.weightKg ? `${dino.weightKg.toLocaleString()} kg` : 'Unknown'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><HomeIcon size={14} /> Habitat</h3>
              <p className="text-white font-medium">{dino.habitat || 'Unknown'}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-1 flex items-center gap-1"><PenTool size={14} /> Named By</h3>
              <p className="text-white font-medium text-sm">{dino.namedBy || 'Unknown'}</p>
            </div>
          </div>

          {/* Taxonomy */}
          {dino.taxonomy && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-1"><Microscope size={14} /> Taxonomy</h3>
              <p className="text-white font-mono text-sm">{dino.taxonomy}</p>
            </div>
          )}

          {/* Description */}
          {dino.description && (
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2"><BookOpen size={20} /> About {dino.name}</h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{dino.description}</p>
            </div>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Image size={20} /> Gallery</h2>
              <div className="mb-4">
                <img
                  src={images[activeImage]}
                  alt={`${dino.name} image ${activeImage + 1}`}
                  loading="lazy"
                  className="w-full max-h-96 object-contain rounded-lg bg-gray-900"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      activeImage === idx ? 'border-green-500' : 'border-transparent hover:border-gray-500'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`} 
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/80x80?text=N/A';
                      }}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Embed */}
          {dino.videoUrl && dino.videoUrl !== 'DEV_PENDING' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Video size={20} /> Video</h2>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={dino.videoUrl}
                  title={`${dino.name} video`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
