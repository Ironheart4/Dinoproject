// EraBadge.tsx — Time period badges with era-specific colors and styling
// Features:
// - Triassic, Jurassic, Cretaceous with distinct colors
// - Icon variants (compact, full)
// - Animated glow effects on hover
import { Clock, Flame, Trees, Leaf } from 'lucide-react'

export type Era = 'triassic' | 'jurassic' | 'cretaceous' | 'unknown'

interface EraConfig {
  name: string
  years: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  icon: typeof Clock
  description: string
}

const ERA_CONFIGS: Record<Era, EraConfig> = {
  triassic: {
    name: 'Triassic',
    years: '252-201 MYA',
    color: '#e74c3c',
    bgColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
    textColor: '#e74c3c',
    icon: Flame,
    description: 'The dawn of the dinosaurs'
  },
  jurassic: {
    name: 'Jurassic',
    years: '201-145 MYA',
    color: '#3498db',
    bgColor: 'rgba(52, 152, 219, 0.15)',
    borderColor: 'rgba(52, 152, 219, 0.3)',
    textColor: '#3498db',
    icon: Trees,
    description: 'Age of the giants'
  },
  cretaceous: {
    name: 'Cretaceous',
    years: '145-66 MYA',
    color: '#398f61',
    bgColor: 'rgba(57, 143, 97, 0.15)',
    borderColor: 'rgba(57, 143, 97, 0.3)',
    textColor: '#398f61',
    icon: Leaf,
    description: 'The final chapter'
  },
  unknown: {
    name: 'Unknown',
    years: '???',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    textColor: '#9ca3af',
    icon: Clock,
    description: 'Era uncertain'
  }
}

// Parse period string to get era
export function getEraFromPeriod(period: string | null | undefined): Era {
  if (!period) return 'unknown'
  const lower = period.toLowerCase()
  if (lower.includes('triassic')) return 'triassic'
  if (lower.includes('jurassic')) return 'jurassic'
  if (lower.includes('cretaceous')) return 'cretaceous'
  return 'unknown'
}

interface EraBadgeProps {
  era: Era | string | null | undefined
  variant?: 'compact' | 'full' | 'icon-only'
  showYears?: boolean
  className?: string
  animated?: boolean
}

export default function EraBadge({ 
  era, 
  variant = 'compact', 
  showYears = false, 
  className = '',
  animated = false
}: EraBadgeProps) {
  const parsedEra = typeof era === 'string' ? getEraFromPeriod(era) : (era || 'unknown')
  const config = ERA_CONFIGS[parsedEra]
  const Icon = config.icon

  if (variant === 'icon-only') {
    return (
      <div 
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${className}`}
        style={{ 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          color: config.textColor
        }}
        title={`${config.name} (${config.years})`}
      >
        <Icon size={16} />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div 
        className={`inline-flex flex-col items-center p-3 rounded-xl border ${animated ? 'hover:scale-105 transition-transform' : ''} ${className}`}
        style={{ 
          backgroundColor: config.bgColor,
          borderColor: config.borderColor
        }}
      >
        <Icon size={24} style={{ color: config.textColor }} />
        <span className="font-bold mt-1" style={{ color: config.textColor }}>{config.name}</span>
        <span className="text-xs text-gray-400">{config.years}</span>
      </div>
    )
  }

  // Compact (default)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${animated ? 'hover:scale-105 transition-transform' : ''} ${className}`}
      style={{ 
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
    >
      <Icon size={12} />
      <span>{config.name}</span>
      {showYears && <span className="opacity-70">• {config.years}</span>}
    </span>
  )
}

// Era selection buttons for filtering
interface EraFilterProps {
  selected: Era | null
  onChange: (era: Era | null) => void
  showAll?: boolean
}

export function EraFilter({ selected, onChange, showAll = true }: EraFilterProps) {
  const eras: (Era | 'all')[] = showAll ? ['all', 'triassic', 'jurassic', 'cretaceous'] : ['triassic', 'jurassic', 'cretaceous']

  return (
    <div className="flex flex-wrap gap-2">
      {eras.map((era) => {
        const isSelected = era === 'all' ? selected === null : selected === era
        
        if (era === 'all') {
          return (
            <button
              key="all"
              onClick={() => onChange(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-forest-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              All Eras
            </button>
          )
        }

        const config = ERA_CONFIGS[era]
        const Icon = config.icon

        return (
          <button
            key={era}
            onClick={() => onChange(era)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: isSelected ? config.bgColor : 'transparent',
              borderColor: isSelected ? config.borderColor : 'rgba(107, 114, 128, 0.3)',
              color: isSelected ? config.textColor : '#9ca3af'
            }}
          >
            <Icon size={16} />
            {config.name}
          </button>
        )
      })}
    </div>
  )
}

// Era info card for timeline
interface EraCardProps {
  era: Era
  dinosaurCount?: number
  onClick?: () => void
  isActive?: boolean
}

export function EraCard({ era, dinosaurCount, onClick, isActive = false }: EraCardProps) {
  const config = ERA_CONFIGS[era]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${
        isActive ? 'scale-105 shadow-lg' : 'hover:scale-102'
      }`}
      style={{
        backgroundColor: isActive ? config.bgColor : 'rgba(26, 36, 53, 0.6)',
        borderColor: isActive ? config.color : 'rgba(107, 114, 128, 0.2)'
      }}
    >
      {/* Glow effect */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-30 blur-xl -z-10"
          style={{ backgroundColor: config.color }}
        />
      )}

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon size={24} style={{ color: config.textColor }} />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-1 font-display">{config.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{config.years}</p>
      <p className="text-xs text-gray-500">{config.description}</p>

      {/* Dinosaur count */}
      {dinosaurCount !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <span className="text-2xl font-bold" style={{ color: config.textColor }}>
            {dinosaurCount}
          </span>
          <span className="text-sm text-gray-400 ml-2">dinosaurs</span>
        </div>
      )}
    </button>
  )
}
