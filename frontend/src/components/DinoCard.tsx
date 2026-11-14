// DinoCard.tsx — Interactive 3D dinosaur card with hover tilt effect
// Features:
// - 3D perspective tilt on mouse move
// - Glow effect following cursor
// - Smooth hover animations
// - Quick facts display
// - Diet badge with color coding
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Clock, Ruler, MapPin, Leaf, Drumstick, Utensils } from 'lucide-react'
import { TRexIcon } from './DinoIcons'

interface Dinosaur {
  id: number
  name: string
  species?: string | null
  period?: string | null
  diet?: string | null
  imageUrl1?: string | null
  lengthMeters?: number | string | null
  livedIn?: string | null
  modelUrl?: string | null
}

interface Props {
  dinosaur: Dinosaur
  index?: number
  showQuickFacts?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function DinoCard({ dinosaur, index = 0, showQuickFacts = true, size = 'medium' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glowX, setGlowX] = useState(50)
  const [glowY, setGlowY] = useState(50)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Calculate rotation (max 15 degrees)
    const rotateXVal = ((y - centerY) / centerY) * -10
    const rotateYVal = ((x - centerX) / centerX) * 10
    
    setRotateX(rotateXVal)
    setRotateY(rotateYVal)
    
    // Calculate glow position as percentage
    setGlowX((x / rect.width) * 100)
    setGlowY((y / rect.height) * 100)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  // Get diet icon and color
  const getDietInfo = () => {
    const diet = dinosaur.diet?.toLowerCase()
    switch (diet) {
      case 'carnivorous':
        return { icon: Drumstick, color: 'bg-red-500/20 text-red-400 border-red-500/30' }
      case 'herbivorous':
        return { icon: Leaf, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
      case 'omnivorous':
        return { icon: Utensils, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      default:
        return { icon: Eye, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  const dietInfo = getDietInfo()
  const DietIcon = dietInfo.icon

  // Size configurations
  const sizeConfig = {
    small: { imageHeight: 'h-32 sm:h-40', padding: 'p-3', titleSize: 'text-base' },
    medium: { imageHeight: 'h-44 sm:h-52', padding: 'p-4 sm:p-5', titleSize: 'text-lg sm:text-xl' },
    large: { imageHeight: 'h-56 sm:h-64', padding: 'p-5 sm:p-6', titleSize: 'text-xl sm:text-2xl' }
  }
  const config = sizeConfig[size]

  return (
    <Link to={`/dino/${dinosaur.id}`} className="block group">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 transition-all duration-300 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
          transformStyle: 'preserve-3d',
          animationDelay: `${index * 0.1}s`
        }}
      >
        {/* Glow effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(57, 143, 97, 0.3) 0%, transparent 50%)`
          }}
        />

        {/* Image Container */}
        <div className={`${config.imageHeight} overflow-hidden relative`}>
          {dinosaur.imageUrl1 && dinosaur.imageUrl1 !== 'DEV_PENDING' ? (
            <img 
              src={dinosaur.imageUrl1} 
              alt={dinosaur.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <TRexIcon size={64} className="text-gray-600/50" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />

          {/* Has 3D Model badge */}
          {dinosaur.modelUrl && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-forest-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Eye size={12} />
              3D
            </div>
          )}

          {/* Diet badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 backdrop-blur-sm text-xs font-medium rounded-full border flex items-center gap-1 ${dietInfo.color}`}>
            <DietIcon size={12} />
            {dinosaur.diet || 'Unknown'}
          </div>
        </div>

        {/* Content */}
        <div className={`${config.padding} relative`} style={{ transform: 'translateZ(20px)' }}>
          <h3 className={`${config.titleSize} font-bold text-white group-hover:text-forest-400 transition-colors mb-1 font-display`}>
            {dinosaur.name}
          </h3>
          
          <p className="text-gray-400 text-sm italic mb-3">{dinosaur.species || 'Unknown species'}</p>

          {/* Quick Facts */}
          {showQuickFacts && (
            <div className="flex flex-wrap gap-2">
              {dinosaur.period && (
                <span className="inline-flex items-center gap-1 text-xs bg-sky-500/15 text-sky-400 px-2 py-1 rounded-full border border-sky-500/20">
                  <Clock size={10} />
                  {dinosaur.period}
                </span>
              )}
              {dinosaur.lengthMeters && (
                <span className="inline-flex items-center gap-1 text-xs bg-lava-500/15 text-lava-400 px-2 py-1 rounded-full border border-lava-500/20">
                  <Ruler size={10} />
                  {dinosaur.lengthMeters}m
                </span>
              )}
              {dinosaur.livedIn && (
                <span className="inline-flex items-center gap-1 text-xs bg-sand-500/15 text-sand-400 px-2 py-1 rounded-full border border-sand-500/20">
                  <MapPin size={10} />
                  {dinosaur.livedIn.split(',')[0]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-forest-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  )
}

// Grid wrapper component for consistent layouts
export function DinoCardGrid({ children, columns = 3 }: { children: React.ReactNode, columns?: 2 | 3 | 4 }) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
  
  return (
    <div className={`grid ${gridClass[columns]} gap-4 sm:gap-6`}>
      {children}
    </div>
  )
}
