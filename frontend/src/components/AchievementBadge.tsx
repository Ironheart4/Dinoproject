// AchievementBadge.tsx — Gamification achievements and badges
// Features:
// - Unlockable achievements for exploration, quizzes, and collections
// - Animated unlock effects
// - Progress tracking indicators
// - Different rarity tiers
import { useState, useEffect } from 'react'
import { 
  Trophy, Star, Zap, Target, Compass, BookOpen, 
  Crown, Medal, Award, Flame, Eye, Heart, Sparkles,
  Lock
} from 'lucide-react'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

interface Achievement {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  rarity: AchievementRarity
  progress?: number
  maxProgress?: number
  unlocked?: boolean
  unlockedAt?: Date
}

const RARITY_CONFIG: Record<AchievementRarity, { color: string; bgColor: string; borderColor: string; glow: string }> = {
  common: {
    color: '#a1a1aa',
    bgColor: 'rgba(161, 161, 170, 0.15)',
    borderColor: 'rgba(161, 161, 170, 0.3)',
    glow: 'rgba(161, 161, 170, 0.3)'
  },
  rare: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  epic: {
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    glow: 'rgba(168, 85, 247, 0.4)'
  },
  legendary: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    glow: 'rgba(249, 115, 22, 0.5)'
  }
}

// Predefined achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_dino',
    title: 'First Discovery',
    description: 'View your first dinosaur in the encyclopedia',
    icon: Eye,
    rarity: 'common'
  },
  {
    id: 'explorer_10',
    title: 'Junior Explorer',
    description: 'View 10 different dinosaurs',
    icon: Compass,
    rarity: 'common',
    maxProgress: 10
  },
  {
    id: 'explorer_50',
    title: 'Expert Explorer',
    description: 'View 50 different dinosaurs',
    icon: Compass,
    rarity: 'rare',
    maxProgress: 50
  },
  {
    id: 'quiz_first',
    title: 'Quiz Newbie',
    description: 'Complete your first quiz',
    icon: Target,
    rarity: 'common'
  },
  {
    id: 'quiz_perfect',
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: Star,
    rarity: 'rare'
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Complete 20 quizzes',
    icon: Trophy,
    rarity: 'epic',
    maxProgress: 20
  },
  {
    id: 'triassic_expert',
    title: 'Triassic Expert',
    description: 'View all Triassic period dinosaurs',
    icon: Flame,
    rarity: 'rare'
  },
  {
    id: 'jurassic_expert',
    title: 'Jurassic Expert',
    description: 'View all Jurassic period dinosaurs',
    icon: BookOpen,
    rarity: 'rare'
  },
  {
    id: 'cretaceous_expert',
    title: 'Cretaceous Expert',
    description: 'View all Cretaceous period dinosaurs',
    icon: Crown,
    rarity: 'rare'
  },
  {
    id: 'all_eras',
    title: 'Time Traveler',
    description: 'Learn about dinosaurs from all three eras',
    icon: Sparkles,
    rarity: 'epic'
  },
  {
    id: 'collector',
    title: 'Fossil Collector',
    description: 'Add 10 dinosaurs to your favorites',
    icon: Heart,
    rarity: 'rare',
    maxProgress: 10
  },
  {
    id: 'legendary_hunter',
    title: 'Legendary Hunter',
    description: 'Discover all hidden dinosaurs',
    icon: Award,
    rarity: 'legendary'
  },
  {
    id: 'streak_7',
    title: 'Dedicated Student',
    description: 'Visit DinoProject 7 days in a row',
    icon: Zap,
    rarity: 'epic',
    maxProgress: 7
  },
  {
    id: 'forum_first',
    title: 'Community Member',
    description: 'Make your first forum post',
    icon: Medal,
    rarity: 'common'
  }
]

// Individual achievement badge
interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'small' | 'medium' | 'large'
  showProgress?: boolean
  onClick?: () => void
}

export default function AchievementBadge({ 
  achievement, 
  size = 'medium', 
  showProgress = true,
  onClick 
}: AchievementBadgeProps) {
  const config = RARITY_CONFIG[achievement.rarity]
  const Icon = achievement.icon
  const isUnlocked = achievement.unlocked ?? false
  const hasProgress = achievement.progress !== undefined && achievement.maxProgress !== undefined
  const progressPercent = hasProgress ? (achievement.progress! / achievement.maxProgress!) * 100 : 0

  const sizeConfig = {
    small: { iconSize: 16, padding: 'p-2', textSize: 'text-xs' },
    medium: { iconSize: 24, padding: 'p-3', textSize: 'text-sm' },
    large: { iconSize: 32, padding: 'p-4', textSize: 'text-base' }
  }
  const sc = sizeConfig[size]

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative group rounded-xl border transition-all duration-300 ${sc.padding} ${
        onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      } ${!isUnlocked ? 'opacity-60' : ''}`}
      style={{
        backgroundColor: isUnlocked ? config.bgColor : 'rgba(31, 41, 55, 0.5)',
        borderColor: isUnlocked ? config.borderColor : 'rgba(55, 65, 81, 0.5)'
      }}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg -z-10"
          style={{ backgroundColor: config.glow }}
        />
      )}

      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 rounded-xl bg-gray-900/50 flex items-center justify-center">
          <Lock size={sc.iconSize * 0.8} className="text-gray-500" />
        </div>
      )}

      {/* Icon */}
      <div
        className="rounded-lg flex items-center justify-center mb-2"
        style={{ color: isUnlocked ? config.color : '#6b7280' }}
      >
        <Icon size={sc.iconSize} />
      </div>

      {/* Title */}
      <h4 
        className={`font-bold ${sc.textSize} ${isUnlocked ? 'text-white' : 'text-gray-500'}`}
      >
        {achievement.title}
      </h4>

      {/* Progress bar */}
      {showProgress && hasProgress && (
        <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: config.color
            }}
          />
        </div>
      )}

      {/* Progress text */}
      {showProgress && hasProgress && (
        <p className="text-xs text-gray-500 mt-1">
          {achievement.progress} / {achievement.maxProgress}
        </p>
      )}

      {/* Rarity indicator */}
      <div 
        className="absolute top-1 right-1 w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
        title={achievement.rarity}
      />
    </button>
  )
}

// Achievement notification popup
interface AchievementNotificationProps {
  achievement: Achievement
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false)
  const config = RARITY_CONFIG[achievement.rarity]
  const Icon = achievement.icon

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 50)
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-20 right-4 z-50 transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-lg shadow-2xl"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 40px ${config.glow}`
        }}
      >
        {/* Animated icon */}
        <div className="relative">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center animate-bounce"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon size={28} style={{ color: config.color }} />
          </div>
          {/* Sparkle effects */}
          <Sparkles 
            size={16} 
            className="absolute -top-1 -right-1 animate-pulse"
            style={{ color: config.color }}
          />
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Achievement Unlocked!</p>
          <h4 className="text-lg font-bold text-white">{achievement.title}</h4>
          <p className="text-sm text-gray-400">{achievement.description}</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false)
            setTimeout(onClose, 300)
          }}
          className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Achievement grid display
interface AchievementGridProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

export function AchievementGrid({ achievements, onAchievementClick }: AchievementGridProps) {
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Achievements</h3>
        <span className="text-sm text-gray-400">
          {unlockedCount} / {achievements.length} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-forest-500 to-forest-400 rounded-full transition-all duration-500"
          style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="medium"
            onClick={onAchievementClick ? () => onAchievementClick(achievement) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

// Progress tracker for journey mode
interface JourneyProgressProps {
  currentEra: 'triassic' | 'jurassic' | 'cretaceous'
  dinosaursDiscovered: number
  totalDinosaurs: number
}

export function JourneyProgress({ currentEra, dinosaursDiscovered, totalDinosaurs }: JourneyProgressProps) {
  const eras = ['triassic', 'jurassic', 'cretaceous'] as const
  const currentIndex = eras.indexOf(currentEra)

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <h4 className="text-sm font-medium text-gray-400 mb-3">Journey Through the Ages</h4>
      
      {/* Era progress */}
      <div className="flex items-center gap-2 mb-4">
        {eras.map((era, index) => {
          const config = RARITY_CONFIG[era === 'triassic' ? 'legendary' : era === 'jurassic' ? 'rare' : 'epic']
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          
          return (
            <div key={era} className="flex-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  isComplete ? 'bg-forest-500' : isCurrent ? 'bg-forest-500/50' : 'bg-gray-700'
                }`}
              />
              <p className={`text-xs mt-1 capitalize ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                {era}
              </p>
            </div>
          )
        })}
      </div>

      {/* Dinosaur count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Dinosaurs discovered</span>
        <span className="text-white font-bold">{dinosaursDiscovered} / {totalDinosaurs}</span>
      </div>
    </div>
  )
}
