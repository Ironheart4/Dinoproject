// ParallaxSection.tsx — Parallax scroll effects and animated sections
// Features:
// - Parallax background scrolling
// - Scroll-triggered animations
// - Intersection observer for reveal animations
import { useEffect, useRef, useState, ReactNode } from 'react'

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  backgroundImage?: string
  backgroundColor?: string
  parallaxSpeed?: number // 0 = no parallax, 1 = full speed
  overlay?: 'none' | 'dark' | 'gradient' | 'jungle'
  id?: string
}

export function ParallaxSection({
  children,
  className = '',
  backgroundImage,
  backgroundColor,
  parallaxSpeed = 0.3,
  overlay = 'none',
  id
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        const scrolled = window.scrollY
        const sectionTop = rect.top + scrolled
        const offsetValue = (scrolled - sectionTop) * parallaxSpeed
        setOffset(offsetValue)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [parallaxSpeed])

  const overlayClasses = {
    none: '',
    dark: 'bg-gray-900/70',
    gradient: 'bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900',
    jungle: 'bg-jungle'
  }

  return (
    <section ref={sectionRef} id={id} className={`relative overflow-hidden ${className}`}>
      {/* Parallax background */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            transform: `translateY(${offset}px)`,
            backgroundColor: backgroundColor || undefined
          }}
        />
      )}

      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayClasses[overlay]} -z-5`} />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  )
}

// Scroll reveal animation wrapper
interface RevealOnScrollProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
}

export function RevealOnScroll({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '50px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, once])

  const transforms = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    fade: 'none'
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : transforms[direction],
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

// Stagger children animations
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 100,
  direction = 'up'
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const transforms = {
    up: 'translateY(30px)',
    down: 'translateY(-30px)',
    left: 'translateX(30px)',
    right: 'translateX(-30px)',
    fade: 'none'
  }

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : transforms[direction],
                transition: `opacity 500ms ease-out ${index * staggerDelay}ms, transform 500ms ease-out ${index * staggerDelay}ms`
              }}
            >
              {child}
            </div>
          ))
        : children
      }
    </div>
  )
}

// Floating element animation
interface FloatingElementProps {
  children: ReactNode
  className?: string
  amplitude?: number // How far it floats
  duration?: number // Animation duration in seconds
  delay?: number // Animation delay in seconds
}

export function FloatingElement({
  children,
  className = '',
  amplitude = 10,
  duration = 4,
  delay = 0
}: FloatingElementProps) {
  return (
    <div
      className={className}
      style={{
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
        '--float-amplitude': `${amplitude}px`
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

// Scroll progress indicator
interface ScrollProgressProps {
  color?: string
  height?: number
}

export function ScrollProgress({ color = '#398f61', height = 3 }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setProgress(scrollPercent)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]" style={{ height }}>
      <div
        className="h-full transition-all duration-150"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`
        }}
      />
    </div>
  )
}

// Section divider with decorative elements
interface SectionDividerProps {
  variant?: 'wave' | 'angle' | 'curved' | 'line'
  flip?: boolean
  color?: string
}

export function SectionDivider({ variant = 'wave', flip = false, color = '#141922' }: SectionDividerProps) {
  const paths = {
    wave: 'M0,64 C240,128 480,0 720,64 C960,128 1200,0 1440,64 L1440,128 L0,128 Z',
    angle: 'M0,128 L1440,0 L1440,128 Z',
    curved: 'M0,96 Q720,192 1440,96 L1440,128 L0,128 Z',
    line: 'M0,120 L1440,120 L1440,128 L0,128 Z'
  }

  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`}>
      <svg
        viewBox="0 0 1440 128"
        preserveAspectRatio="none"
        className="w-full h-16 sm:h-20"
        style={{ display: 'block' }}
      >
        <path d={paths[variant]} fill={color} />
      </svg>
    </div>
  )
}

// Animated counter for stats
interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return

    const stepTime = duration / end
    let current = 0
    const timer = setInterval(() => {
      current += 1
      setCount(current)
      if (current >= end) {
        clearInterval(timer)
        setCount(end)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [started, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}
