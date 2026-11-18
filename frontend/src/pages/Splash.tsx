// Splash.tsx — Immersive intro splash page for DinoProject
// A cinematic single-screen introduction with 3D dinosaur, parallax backgrounds, and animated elements
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { api } from '../lib/api'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { isWebGLAvailable } from '../lib/webgl'
import { ChevronRight, Compass, Brain, Map, Users, Sparkles } from 'lucide-react'

interface Dinosaur {
  id: number
  name: string
  modelUrl: string | null
}

export default function Splash() {
  useDocumentTitle('Welcome to DinoProject')
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showContent, setShowContent] = useState(false)
  const [webglAvailable] = useState(() => isWebGLAvailable())

  // Detect mobile or slow connection - skip 3D on mobile for faster load
  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ))

  // Track mouse in a ref so the 3D scene is NOT recreated on every move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 3D Scene setup - runs once (or when isMobile changes). Never on mouse move.
  useEffect(() => {
    // On mobile or without WebGL, skip 3D entirely and show content immediately
    if (isMobile || !webglAvailable) {
      setLoaded(true)
      setProgress(100)
      setShowContent(true)
      return
    }

    let cancelled = false

    // Fallback timeout - show content after 4 seconds even if 3D isn't loaded
    const fallbackTimer = setTimeout(() => {
      if (cancelled) return
      setLoaded(true)
      setProgress(100)
      setShowContent(true)
    }, 4000)

    const canvas = canvasRef.current
    if (!canvas) {
      clearTimeout(fallbackTimer)
      setLoaded(true)
      setProgress(100)
      setShowContent(true)
      return
    }

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.5, 6)
    camera.lookAt(0, 1, 0)

    // Keep the renderer transparent so the CSS gradient is consistent on desktop
    // and mobile. Some GPUs render the canvas texture above as a washed-out grey.
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      })
    } catch {
      clearTimeout(fallbackTimer)
      setLoaded(true)
      setProgress(100)
      setShowContent(true)
      return
    }
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Atmospheric fog
    scene.fog = new THREE.FogExp2(0x0d1f17, 0.08)

    // Dramatic lighting
    const ambient = new THREE.AmbientLight(0x2a4a3a, 0.5)
    scene.add(ambient)

    // Main spotlight on dinosaur
    const spotlight = new THREE.SpotLight(0x4caf50, 3, 20, Math.PI / 6, 0.5)
    spotlight.position.set(5, 10, 5)
    spotlight.castShadow = true
    spotlight.shadow.mapSize.width = 1024
    spotlight.shadow.mapSize.height = 1024
    scene.add(spotlight)

    // Rim light for drama
    const rimLight = new THREE.DirectionalLight(0x00ff88, 1)
    rimLight.position.set(-5, 5, -5)
    scene.add(rimLight)

    // Ground plane (subtle)
    const groundGeo = new THREE.PlaneGeometry(50, 50)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1510,
      roughness: 0.9,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Atmospheric particles (dust/spores)
    const particleCount = 200
    const particlesGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = Math.random() * 10
      positions[i + 2] = (Math.random() - 0.5) * 20
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particlesMat = new THREE.PointsMaterial({
      color: 0x88ffaa,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    // Load dinosaur model
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
    )
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let mixer: THREE.AnimationMixer | null = null
    let model: THREE.Group | null = null
    let targetY = -3 // Start below ground for emergence effect

    // Phase A: lightweight featured list (not full dinosaur payload)
    api
      .get('/api/dinosaurs/featured')
      .then((res) => {
        if (cancelled) return
        const dinos = res.data.filter(
          (d: Dinosaur) =>
            d.modelUrl &&
            d.modelUrl !== 'DEV_PENDING' &&
            d.modelUrl.startsWith('http')
        )
        if (dinos.length === 0) {
          setLoaded(true)
          setShowContent(true)
          return
        }

        // Pick T-Rex if available, otherwise random
        const trex = dinos.find((d: Dinosaur) =>
          d.name.toLowerCase().includes('tyrannosaurus')
        )
        const selectedDino =
          trex || dinos[Math.floor(Math.random() * dinos.length)]

        loader.load(
          selectedDino.modelUrl!,
          (gltf) => {
            if (cancelled) return
            model = gltf.scene

            // Scale and position
            const box = new THREE.Box3().setFromObject(model)
            const size = new THREE.Vector3()
            box.getSize(size)
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 3 / maxDim
            model.scale.setScalar(scale)

            // Recenter
            box.setFromObject(model)
            const center = new THREE.Vector3()
            box.getCenter(center)
            model.position.x = -center.x
            model.position.z = -center.z
            model.position.y = targetY // Start below

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            scene.add(model)

            // Animation
            if (gltf.animations?.length) {
              mixer = new THREE.AnimationMixer(model)
              gltf.animations.forEach((clip) => mixer!.clipAction(clip).play())
            }

            setLoaded(true)

            // Emergence animation
            setTimeout(() => {
              if (!cancelled) targetY = -box.min.y * scale // Ground level
            }, 500)

            setTimeout(() => {
              if (!cancelled) setShowContent(true)
            }, 1500)
          },
          (xhr) => {
            if (!cancelled && xhr.total > 0) {
              setProgress(Math.round((xhr.loaded / xhr.total) * 100))
            }
          },
          () => {
            if (!cancelled) {
              setLoaded(true)
              setShowContent(true)
            }
          }
        )
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(true)
          setShowContent(true)
        }
      })

    const clock = new THREE.Clock()
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      if (mixer) mixer.update(delta)

      // Smooth model emergence
      if (model) {
        model.position.y += (targetY - model.position.y) * 0.02
        model.rotation.y = Math.sin(elapsed * 0.3) * 0.1 // Subtle sway
      }

      // Animate particles
      const posArray = particlesGeo.attributes.position.array as Float32Array
      for (let i = 0; i < posArray.length; i += 3) {
        // Use elapsed time rather than a fixed frame increment so movement is
        // smooth and has the same speed on high- and low-refresh-rate displays.
        posArray[i] += Math.sin(elapsed + i) * delta * 0.03
        posArray[i + 1] += delta * 0.55
        if (posArray[i + 1] > 10) posArray[i + 1] = 0
      }
      particlesGeo.attributes.position.needsUpdate = true

      // Camera subtle movement from ref (does NOT recreate the scene)
      const { x, y } = mousePosRef.current
      camera.position.x = 0 + x * 0.3
      camera.position.y = 1.5 + y * 0.2
      camera.lookAt(0, 1, 0)

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.forceContextLoss()
      renderer.dispose()
      dracoLoader.dispose()
    }
  }, [isMobile, webglAvailable]) // Only re-run if mobile detection changes — never on mouse move

  const handleEnter = () => {
    navigate('/timeline')
  }

  const handleSkip = () => {
    navigate('/home')
  }

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#050a08]">
      {/* Shared background: the transparent desktop scene sits over this too. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, #1a3a2a 0%, #0d1f17 40%, #050a08 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(45deg, transparent 30%, rgba(74, 222, 128, 0.1) 50%, transparent 70%)',
            animation: 'shimmer 3s infinite',
          }}
        />
      </div>

      {/* 3D Canvas - only render on desktop with WebGL support */}
      {!isMobile && webglAvailable && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Jungle silhouettes (static for stability — no mouse-driven re-render) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 200\'%3E%3Cpath fill=\'%230a1510\' d=\'M0,200 L0,120 Q60,80 120,100 T240,90 T360,110 T480,85 T600,100 T720,75 T840,95 T960,80 T1080,100 T1200,85 T1320,95 T1440,90 L1440,200 Z\'/%3E%3C/svg%3E") repeat-x bottom',
          backgroundSize: 'auto 100%',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 150\'%3E%3Cpath fill=\'%23071210\' d=\'M0,150 L0,100 Q80,60 160,80 T320,70 T480,90 T640,65 T800,85 T960,70 T1120,80 T1280,60 T1440,75 L1440,150 Z\'/%3E%3C/svg%3E") repeat-x bottom',
          backgroundSize: 'auto 100%',
        }}
      />

      {/* Stars/particles overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/50 rounded-full"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 13) % 60}%`,
              animation: `splash-particle-float ${4 + (i % 4)}s ease-in-out ${(i % 7) * -0.8}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Loading State */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full" />
              <div
                className="absolute inset-0 border-4 border-green-400 rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-green-400 font-bold text-lg">{progress}%</span>
              </div>
            </div>
            <p className="text-gray-400 text-lg">Awakening ancient giants...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 z-10 transition-all duration-1000 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo/Icon */}
        <div className="mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center backdrop-blur-sm animate-pulse">
            <Sparkles className="text-green-400 w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        {/* Main Tagline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-4 sm:mb-6 leading-tight">
          <span className="block text-white drop-shadow-2xl">Explore the</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 animate-gradient">
            Prehistoric World
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-2xl mb-6 sm:mb-8 leading-relaxed">
          Discover 100+ species with 3D models, test your knowledge with 500+
          quiz questions, explore fossils across 6 continents, and join 10,000+
          prehistoric enthusiasts.
        </p>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            { icon: Compass, label: 'Timeline Explorer' },
            { icon: Brain, label: 'Quizzes' },
            { icon: Map, label: 'Fossil Map' },
            { icon: Users, label: 'Community' },
          ].map((feature, i) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-gray-300 text-xs sm:text-sm transition-all hover:bg-white/10 hover:border-green-500/50"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <feature.icon size={14} className="text-green-400 sm:w-4 sm:h-4" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg sm:text-xl rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative">Start Exploring</span>
          <ChevronRight
            size={24}
            className="relative group-hover:translate-x-1 transition-transform"
          />
        </button>

        {/* Skip to home */}
        <button
          onClick={handleSkip}
          className="mt-4 sm:mt-6 text-gray-500 hover:text-gray-300 text-sm transition-colors underline-offset-4 hover:underline"
        >
          or skip to homepage
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050a08] to-transparent pointer-events-none" />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-16 h-16 sm:w-24 sm:h-24 border-l-2 border-t-2 border-green-500/30 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-16 h-16 sm:w-24 sm:h-24 border-r-2 border-t-2 border-green-500/30 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-16 h-16 sm:w-24 sm:h-24 border-l-2 border-b-2 border-green-500/30 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-16 h-16 sm:w-24 sm:h-24 border-r-2 border-b-2 border-green-500/30 rounded-br-3xl pointer-events-none" />

      {/* Brand watermark */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-gray-600 text-xs sm:text-sm font-medium tracking-wider">
        DINOPROJECT
      </div>
    </div>
  )
}
