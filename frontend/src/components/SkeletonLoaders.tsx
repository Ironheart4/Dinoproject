// SkeletonLoaders.tsx — Animated skeleton loading placeholders
// Provides smooth loading states for cards, text, and other UI elements
// Uses shimmer animation for visual feedback during data fetching

interface SkeletonProps {
  className?: string
}

// Basic skeleton element
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} aria-hidden="true" />
  )
}

// Text line skeleton
export function SkeletonText({ lines = 3, className = '' }: { lines?: number, className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

// Title skeleton
export function SkeletonTitle({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton h-8 w-3/4 rounded-lg ${className}`} aria-hidden="true" />
  )
}

// Avatar skeleton
export function SkeletonAvatar({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <div
      className={`skeleton rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

// Dinosaur card skeleton
export function SkeletonDinoCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 overflow-hidden" aria-hidden="true">
      {/* Image placeholder */}
      <div className="skeleton h-44 sm:h-52 rounded-none" />
      
      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Title */}
        <div className="skeleton h-6 w-3/4 rounded" />
        
        {/* Species */}
        <div className="skeleton h-4 w-1/2 rounded" />
        
        {/* Tags */}
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Grid of dinosaur card skeletons
export function SkeletonDinoGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-busy="true" aria-label="Loading dinosaurs">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonDinoCard key={i} />
      ))}
    </div>
  )
}

// Hero section skeleton
export function SkeletonHero() {
  return (
    <div className="relative py-12 sm:py-16 lg:py-24" aria-hidden="true">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Text content */}
        <div className="space-y-6">
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="skeleton h-16 w-3/4 rounded-lg" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-full rounded" />
            <div className="skeleton h-6 w-2/3 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="skeleton h-14 w-40 rounded-xl" />
            <div className="skeleton h-14 w-40 rounded-xl" />
          </div>
        </div>
        
        {/* 3D Viewer placeholder */}
        <div className="skeleton h-[350px] sm:h-[400px] lg:h-[500px] rounded-3xl" />
      </div>
    </div>
  )
}

// Stats bar skeleton
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-8 w-16 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

// Timeline item skeleton
export function SkeletonTimelineItem() {
  return (
    <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl" aria-hidden="true">
      <div className="skeleton h-20 w-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-1/2 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  )
}

// Forum post skeleton
export function SkeletonForumPost() {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50" aria-hidden="true">
      <div className="flex items-start gap-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
        </div>
      </div>
    </div>
  )
}

// Quiz option skeleton
export function SkeletonQuizOption() {
  return (
    <div className="skeleton h-16 w-full rounded-xl" aria-hidden="true" />
  )
}

// Full quiz page skeleton
export function SkeletonQuiz() {
  return (
    <div className="max-w-3xl mx-auto space-y-6" aria-hidden="true">
      {/* Question */}
      <div className="skeleton h-8 w-3/4 rounded mx-auto" />
      
      {/* Question image (optional) */}
      <div className="skeleton h-48 w-full rounded-xl" />
      
      {/* Options */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonQuizOption key={i} />
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="skeleton h-2 w-full rounded-full" />
    </div>
  )
}

// Leaderboard skeleton
export function SkeletonLeaderboard({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="skeleton h-8 w-8 rounded-full" />
          <SkeletonAvatar size={36} />
          <div className="flex-1">
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

// Generic loading spinner with prehistoric theme
export function DinoSpinner({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="animate-spin"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="url(#gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="2" y1="2" x2="12" y2="2">
            <stop stopColor="#398f61" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Loading overlay for sections
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-inherit">
      <DinoSpinner size={56} className="text-forest-400 mb-4" />
      <p className="text-gray-300 font-medium">{message}</p>
    </div>
  )
}
