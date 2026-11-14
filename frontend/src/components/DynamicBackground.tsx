// DynamicBackground.tsx — Immersive animated background for DinoProject
// Features:
// - Animated gradient cycle (dawn → day → dusk → night)
// - Parallax layers (sky, mountains, foliage) responding to scroll/mouse
// - Lightweight particle effects (dust/fireflies)
// - Three.js fog and distant dinosaur silhouettes
// - Fully responsive and performance-optimized
import { useEffect, useRef, useState, useCallback, memo } from 'react'
import * as THREE from 'three'

// Time of day phases for gradient animation
type TimePhase = 'dawn' | 'day' | 'dusk' | 'night'

const GRADIENT_COLORS: Record<TimePhase, { top: string; mid: string; bottom: string }> = {
  dawn: { top: '#1a1a2e', mid: '#4a3f6b', bottom: '#ff6b6b' },
  day: { top: '#0a1628', mid: '#0d2137', bottom: '#1a3a4a' },
  dusk: { top: '#1a1a2e', mid: '#4a2c5a', bottom: '#ff8c42' },
  night: { top: '#050810', mid: '#0a1020', bottom: '#141e30' },
}

// Dinosaur silhouette paths for Three.js scene
const DINO_SILHOUETTES = {
  trex: 'M0,0 L8,0 L10,-2 L12,-2 L14,0 L16,2 L18,2 L20,0 L22,0 L24,2 L24,6 L22,8 L20,8 L18,10 L16,10 L14,8 L10,8 L8,10 L6,10 L4,8 L2,8 L0,6 Z',
  brachio: 'M0,8 L2,4 L4,2 L6,0 L8,0 L10,2 L10,4 L12,6 L14,6 L16,8 L18,8 L20,10 L18,10 L16,10 L14,10 L12,10 L10,10 L8,10 L6,10 L4,10 L2,10 L0,10 Z',
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  type: 'dust' | 'firefly'
}

function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [timePhase, setTimePhase] = useState<TimePhase>('day')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const threeRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    fog: THREE.FogExp2
    dinos: THREE.Mesh[]
  } | null>(null)

  // Cycle through time phases every 30 seconds (adjustable)
  useEffect(() => {
    const phases: TimePhase[] = ['dawn', 'day', 'dusk', 'night']
    let currentIndex = 1 // Start at day
    
    const cycleTime = () => {
      currentIndex = (currentIndex + 1) % phases.length
      setTimePhase(phases[currentIndex])
    }
    
    const interval = setInterval(cycleTime, 30000) // 30 seconds per phase
    return () => clearInterval(interval)
  }, [])

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }
    
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Initialize particle system
  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Create particles
    const particles: Particle[] = []
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30)) // Responsive count
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.5 + 0.2,
        type: Math.random() > 0.7 ? 'firefly' : 'dust',
      })
    }
    particlesRef.current = particles
    
    // Animation loop
    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, i) => {
        // Update position
        p.x += p.speedX
        p.y -= p.speedY // Float upward
        
        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        
        // Draw particle
        ctx.beginPath()
        
        if (p.type === 'firefly' && timePhase === 'night') {
          // Glowing firefly effect at night
          const glow = Math.sin(frame * 0.05 + i) * 0.3 + 0.7
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
          gradient.addColorStop(0, `rgba(180, 255, 100, ${p.opacity * glow})`)
          gradient.addColorStop(0.4, `rgba(120, 200, 80, ${p.opacity * glow * 0.5})`)
          gradient.addColorStop(1, 'rgba(80, 150, 50, 0)')
          ctx.fillStyle = gradient
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        } else if (p.type === 'firefly' && timePhase === 'dusk') {
          // Dimmer fireflies at dusk
          const glow = Math.sin(frame * 0.03 + i) * 0.2 + 0.4
          ctx.fillStyle = `rgba(200, 180, 100, ${p.opacity * glow})`
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        } else {
          // Regular dust particle
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        }
        
        ctx.fill()
      })
      
      frame++
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [timePhase])

  // Initialize Three.js scene for fog and dinosaur silhouettes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 50
    camera.position.y = 5
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: false, // Better performance
      powerPreference: 'low-power'
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Cap pixel ratio for performance
    
    // Fog
    const fog = new THREE.FogExp2(0x0a1628, 0.015)
    scene.fog = fog
    
    // Create dinosaur silhouettes as simple shapes
    const dinos: THREE.Mesh[] = []
    const dinoMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.15,
      side: THREE.DoubleSide
    })
    
    // Create 3-4 distant dinosaur shapes
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.PlaneGeometry(8 + Math.random() * 6, 6 + Math.random() * 4)
      const dino = new THREE.Mesh(geometry, dinoMaterial.clone())
      
      dino.position.x = (Math.random() - 0.5) * 120
      dino.position.y = -5 + Math.random() * 3
      dino.position.z = -30 - Math.random() * 40
      
      // Random variation
      ;(dino.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.random() * 0.08
      
      dino.userData = {
        baseX: dino.position.x,
        speed: 0.005 + Math.random() * 0.01,
        direction: Math.random() > 0.5 ? 1 : -1,
        bobSpeed: 0.5 + Math.random() * 0.5,
        bobAmount: 0.2 + Math.random() * 0.3
      }
      
      scene.add(dino)
      dinos.push(dino)
    }
    
    // Add subtle ground plane
    const groundGeo = new THREE.PlaneGeometry(200, 50)
    const groundMat = new THREE.MeshBasicMaterial({ 
      color: 0x0a1520,
      transparent: true,
      opacity: 0.5
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -8
    ground.position.z = -30
    scene.add(ground)
    
    threeRef.current = { scene, camera, renderer, fog, dinos }
    
    // Animation
    let time = 0
    const animate = () => {
      time += 0.016
      
      // Animate dinosaurs
      dinos.forEach(dino => {
        const data = dino.userData
        // Slow horizontal movement
        dino.position.x += data.speed * data.direction
        
        // Reverse direction at bounds
        if (Math.abs(dino.position.x - data.baseX) > 30) {
          data.direction *= -1
        }
        
        // Subtle bobbing
        dino.position.y = -5 + Math.sin(time * data.bobSpeed) * data.bobAmount
      })
      
      // Update fog based on time phase
      const fogColors: Record<TimePhase, number> = {
        dawn: 0x2a1a3e,
        day: 0x0a1628,
        dusk: 0x2a1a2e,
        night: 0x050810
      }
      fog.color.setHex(fogColors[timePhase])
      
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    
    animate()
    
    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      scene.clear()
    }
  }, [timePhase])

  const colors = GRADIENT_COLORS[timePhase]
  
  // Calculate parallax offsets
  const parallaxOffset = {
    far: { x: mousePos.x * 5, y: mousePos.y * 3 + scrollY * 0.05 },
    mid: { x: mousePos.x * 10, y: mousePos.y * 5 + scrollY * 0.1 },
    near: { x: mousePos.x * 15, y: mousePos.y * 8 + scrollY * 0.15 },
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{ isolation: 'isolate' }}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 transition-all duration-[5000ms] ease-in-out"
        style={{
          background: `linear-gradient(180deg, ${colors.top} 0%, ${colors.mid} 50%, ${colors.bottom} 100%)`,
        }}
      />
      
      {/* Stars (visible at night/dusk) */}
      <div 
        className="absolute inset-0 transition-opacity duration-[3000ms]"
        style={{ 
          opacity: timePhase === 'night' ? 0.8 : timePhase === 'dusk' ? 0.3 : 0,
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                           radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                           radial-gradient(1px 1px at 90px 40px, white, transparent),
                           radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
                           radial-gradient(1px 1px at 230px 80px, white, transparent),
                           radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent),
                           radial-gradient(1px 1px at 370px 60px, white, transparent),
                           radial-gradient(2px 2px at 450px 180px, rgba(255,255,255,0.8), transparent)`,
          backgroundSize: '500px 200px',
        }}
      />
      
      {/* Far mountains layer (slowest parallax) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40vh] transition-transform duration-150 ease-out"
        style={{ 
          transform: `translate(${parallaxOffset.far.x}px, ${parallaxOffset.far.y}px)`,
        }}
      >
        <svg 
          viewBox="0 0 1440 320" 
          className="absolute bottom-0 w-[120%] -left-[10%]"
          preserveAspectRatio="none"
        >
          <path 
            fill={timePhase === 'night' ? '#0a0f18' : timePhase === 'dusk' ? '#1a1525' : '#0d1a25'}
            fillOpacity="0.6"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
      
      {/* Mid mountains layer */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[35vh] transition-transform duration-100 ease-out"
        style={{ 
          transform: `translate(${parallaxOffset.mid.x}px, ${parallaxOffset.mid.y}px)`,
        }}
      >
        <svg 
          viewBox="0 0 1440 320" 
          className="absolute bottom-0 w-[130%] -left-[15%]"
          preserveAspectRatio="none"
        >
          <path 
            fill={timePhase === 'night' ? '#080c14' : timePhase === 'dusk' ? '#151020' : '#0a1520'}
            fillOpacity="0.7"
            d="M0,256L60,245.3C120,235,240,213,360,218.7C480,224,600,256,720,261.3C840,267,960,245,1080,224C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </div>
      
      {/* Near foliage layer (fastest parallax) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[25vh] transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(${parallaxOffset.near.x}px, ${parallaxOffset.near.y}px)`,
        }}
      >
        <svg 
          viewBox="0 0 1440 200" 
          className="absolute bottom-0 w-[150%] -left-[25%]"
          preserveAspectRatio="none"
        >
          {/* Tree/foliage silhouettes */}
          <path 
            fill={timePhase === 'night' ? '#050810' : timePhase === 'dusk' ? '#100a15' : '#081018'}
            fillOpacity="0.85"
            d="M0,150L30,140C60,130,120,110,180,115C240,120,300,150,360,155C420,160,480,140,540,130C600,120,660,120,720,125C780,130,840,140,900,145C960,150,1020,150,1080,140C1140,130,1200,110,1260,105C1320,100,1380,110,1410,115L1440,120L1440,200L1410,200C1380,200,1320,200,1260,200C1200,200,1140,200,1080,200C1020,200,960,200,900,200C840,200,780,200,720,200C660,200,600,200,540,200C480,200,420,200,360,200C300,200,240,200,180,200C120,200,60,200,30,200L0,200Z"
          />
          {/* Additional foliage detail */}
          <ellipse cx="100" cy="160" rx="40" ry="50" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
          <ellipse cx="300" cy="155" rx="35" ry="45" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
          <ellipse cx="550" cy="160" rx="45" ry="55" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
          <ellipse cx="800" cy="150" rx="38" ry="48" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
          <ellipse cx="1050" cy="155" rx="42" ry="52" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
          <ellipse cx="1300" cy="160" rx="36" ry="46" fill={timePhase === 'night' ? '#040608' : '#060810'} fillOpacity="0.9" />
        </svg>
      </div>
      
      {/* Three.js canvas for fog and dinosaur silhouettes */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-60"
        style={{ mixBlendMode: 'multiply' }}
      />
      
      {/* Particle canvas */}
      <canvas 
        ref={particleCanvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      
      {/* Atmospheric glow (dawn/dusk) */}
      {(timePhase === 'dawn' || timePhase === 'dusk') && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[40vh] transition-opacity duration-[3000ms]"
          style={{
            background: timePhase === 'dawn' 
              ? 'linear-gradient(180deg, transparent 0%, rgba(255,100,100,0.1) 50%, rgba(255,150,100,0.2) 100%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(255,100,50,0.08) 50%, rgba(255,180,80,0.15) 100%)',
          }}
        />
      )}
    </div>
  )
}

export default memo(DynamicBackground)
