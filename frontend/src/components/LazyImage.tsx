// LazyImage.tsx — Performance-Optimized Image Loading Component
// =============================================================
// PURPOSE: Improves page load performance by lazy-loading images
// FEATURES:
// - Intersection Observer: Only loads images when near viewport
// - Blur placeholder: Shows shimmer animation while loading
// - Error handling: Shows friendly fallback if image fails
// - Smooth fade-in: Images transition from transparent to visible
//
// PERFORMANCE BENEFITS:
// - Reduces initial page load time
// - Saves bandwidth for off-screen images
// - 100px preload margin ensures smooth scrolling
//
// USAGE:
// <LazyImage
//   src="/images/trex.jpg"
//   alt="T-Rex"
//   className="w-full h-48"
//   placeholderColor="#1f2937"
// />
//
// BROWSER SUPPORT: All modern browsers (uses IntersectionObserver)
// =============================================================
import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react'

// =============================================================
// TYPE DEFINITIONS
// =============================================================

/** Props extend native img attributes for full flexibility */
interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string                    // Image source URL (required)
  alt: string                    // Alt text for accessibility (required)
  placeholderColor?: string      // Background color while loading
  className?: string             // CSS classes for sizing/styling
}

// =============================================================
// MAIN COMPONENT
// =============================================================

export default function LazyImage({ 
  src, 
  alt, 
  placeholderColor = '#1f2937',  // Default: Tailwind gray-800
  className = '',
  ...props   // Pass through any other img attributes
}: LazyImageProps) {
  // State for tracking load progress
  const [isLoaded, setIsLoaded] = useState(false)   // Image fully loaded
  const [isInView, setIsInView] = useState(false)   // Image in/near viewport
  const [error, setError] = useState(false)         // Image failed to load
  const imgRef = useRef<HTMLImageElement>(null)

  // Set up Intersection Observer to detect when image is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)        // Start loading the image
          observer.disconnect()    // No need to observe anymore
        }
      },
      { 
        rootMargin: '100px',  // Start loading 100px before visible (smooth scroll)
        threshold: 0.01       // Trigger when even 1% is visible
      }
    )

    // Start observing the placeholder div
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    // Cleanup observer on unmount
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Shimmer placeholder - shows while loading */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]" />
      )}
      
      {/* Actual image - only loads when in viewport */}
      {isInView && !error && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'  // Fade in when loaded
          }`}
          onLoad={() => setIsLoaded(true)}    // Mark as loaded
          onError={() => setError(true)}      // Handle load failures
          loading="lazy"                       // Native lazy loading backup
          decoding="async"                     // Non-blocking decode
          {...props}
        />
      )}
      
      {/* Error fallback - shows if image fails to load */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
          <div className="text-center">
            <span className="text-3xl">🦕</span>
            <p className="text-xs mt-1">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  )
}
