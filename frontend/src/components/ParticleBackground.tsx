// ParticleBackground.tsx — Immersive animated background with particles, fog, and jungle silhouettes
// Creates a prehistoric jungle atmosphere with floating particles, ambient fog, and tree silhouettes
import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
  pulse: number
  pulseSpeed: number
}

interface FogLayer {
  x: number
  speed: number
  opacity: number
  scale: number
}

interface Props {
  variant?: 'hero' | 'subtle' | 'jungle'
  showSilhouettes?: boolean
  showFog?: boolean
  particleCount?: number
}

export default function ParticleBackground({ 
  variant = 'hero', 
  showSilhouettes = true,
  showFog = true,
  particleCount: customCount 
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    setCanvasSize()

    // Particle colors based on variant
    const colorPalettes = {
      hero: ['#398f61', '#5aab7f', '#8cc9a7', '#f97316', '#fb923c', '#fdba74'],
      subtle: ['#398f61', '#5aab7f', '#9a9079'],
      jungle: ['#398f61', '#5aab7f', '#8cc9a7', '#193d2d', '#28724d']
    }
    const colors = colorPalettes[variant]

    // Calculate particle count based on screen size and variant
    const baseCount = variant === 'subtle' ? 30 : 60
    const particleCount = customCount ?? Math.min(baseCount, Math.floor(canvas.offsetWidth / 25))
    
    // Create particles
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: Math.random() * (variant === 'subtle' ? 3 : 5) + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3 - 0.15,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      })
    }

    // Create fog layers
    const fogLayers: FogLayer[] = showFog ? [
      { x: 0, speed: 0.15, opacity: 0.08, scale: 1 },
      { x: canvas.offsetWidth * 0.5, speed: 0.1, opacity: 0.05, scale: 1.2 },
      { x: canvas.offsetWidth, speed: 0.08, opacity: 0.03, scale: 1.5 }
    ] : []

    // Draw jungle silhouette
    const drawJungleSilhouette = (yOffset: number, opacity: number, scale: number) => {
      if (!showSilhouettes) return
      
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const baseY = height - yOffset
      
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.fillStyle = '#0c0f14'
      
      ctx.beginPath()
      ctx.moveTo(0, height)
      
      // Draw tree-like shapes
      const segments = 20
      const segmentWidth = width / segments
      
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth
        const noise = Math.sin(i * 0.5) * 30 + Math.sin(i * 1.3) * 20 + Math.sin(i * 2.1) * 10
        const treeHeight = (40 + Math.sin(i * 0.7) * 25 + Math.random() * 15) * scale
        
        // Create palm-like tree shapes
        if (i % 3 === 0 && i > 0 && i < segments) {
          const treeX = x
          const treeBaseY = baseY + noise - 10
          
          // Draw tree trunk (simple triangle)
          ctx.lineTo(treeX - 8, treeBaseY)
          ctx.lineTo(treeX, treeBaseY - treeHeight)
          ctx.lineTo(treeX + 8, treeBaseY)
        } else {
          ctx.lineTo(x, baseY + noise)
        }
      }
      
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // Draw fog cloud
    const drawFog = (fog: FogLayer) => {
      const gradient = ctx.createRadialGradient(
        fog.x, canvas.offsetHeight * 0.7, 0,
        fog.x, canvas.offsetHeight * 0.7, canvas.offsetWidth * 0.5 * fog.scale
      )
      gradient.addColorStop(0, `rgba(57, 143, 97, ${fog.opacity})`)
      gradient.addColorStop(0.5, `rgba(57, 143, 97, ${fog.opacity * 0.5})`)
      gradient.addColorStop(1, 'rgba(57, 143, 97, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    }

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.016 // ~60fps
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Draw fog layers (background)
      fogLayers.forEach(fog => {
        fog.x += fog.speed
        if (fog.x > canvas.offsetWidth * 1.5) {
          fog.x = -canvas.offsetWidth * 0.5
        }
        drawFog(fog)
      })

      // Draw background silhouette (furthest)
      if (variant !== 'subtle') {
        drawJungleSilhouette(60, 0.15, 0.6)
        drawJungleSilhouette(30, 0.25, 0.8)
      }

      // Draw particles
      particles.forEach((p) => {
        // Update position
        p.x += p.speedX
        p.y += p.speedY
        p.pulse += p.pulseSpeed

        // Wrap around edges
        if (p.x < -10) p.x = canvas.offsetWidth + 10
        if (p.x > canvas.offsetWidth + 10) p.x = -10
        if (p.y < -10) p.y = canvas.offsetHeight + 10
        if (p.y > canvas.offsetHeight + 10) p.y = -10

        // Calculate pulsing opacity
        const pulseOpacity = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3)

        // Draw particle with glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = pulseOpacity
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })

      // Draw foreground silhouette (closest - darkest)
      if (variant !== 'subtle') {
        drawJungleSilhouette(0, 0.4, 1)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      setCanvasSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [variant, showSilhouettes, showFog, customCount])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: variant === 'subtle' ? 0.4 : 0.7 }}
      aria-hidden="true"
    />
  )
}
