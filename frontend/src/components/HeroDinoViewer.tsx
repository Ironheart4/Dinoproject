// HeroDinoViewer.tsx — Interactive 3D viewer for hero section with dinosaur selector
// Shows dinosaurs with their 3D models, allows user selection
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Dinosaur {
  id: number
  name: string
  species: string | null
  period: string | null
  diet: string | null
  modelUrl: string | null
  imageUrl1: string | null
}

interface Props {
  dinosaurs: Dinosaur[]
}

export default function HeroDinoViewer({ dinosaurs }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState(false)

  // Filter dinosaurs with valid model URLs
  const dinosWithModels = dinosaurs.filter(d => 
    d.modelUrl && d.modelUrl !== 'DEV_PENDING' && d.modelUrl.startsWith('http')
  ).slice(0, 8) // Limit to 8 for the selector

  const currentDino = dinosWithModels[currentIndex] || null

  // Auto-cycle every 10 seconds (but user can override)
  useEffect(() => {
    if (dinosWithModels.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % dinosWithModels.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [dinosWithModels.length])

  useEffect(() => {
    const container = mountRef.current
    if (!container || !currentDino?.modelUrl) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400

    // Scene
    const scene = new THREE.Scene()
    scene.background = null // Transparent

    // Camera - will be adjusted after model loads
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
    camera.position.set(0, 1, 5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(5, 10, 7)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4CAF50, 0.4)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xFFB300, 0.3)
    rimLight.position.set(0, -5, -10)
    scene.add(rimLight)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 2
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // DRACO Loader
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    // GLTF Loader
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let mixer: THREE.AnimationMixer | null = null
    const clock = new THREE.Clock()
    let animationId: number

    // Load model
    loader.loadAsync(currentDino.modelUrl)
      .then((gltf) => {
        const root = gltf.scene || gltf.scenes[0]

        // Calculate bounding box and center model
        const box = new THREE.Box3().setFromObject(root)
        const size = new THREE.Vector3()
        box.getSize(size)
        const center = new THREE.Vector3()
        box.getCenter(center)

        // Scale model to fit nicely
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / (maxDim || 1)
        root.scale.setScalar(scale)

        // Recalculate after scaling
        box.setFromObject(root)
        box.getCenter(center)
        box.getSize(size)

        // Center model at origin
        root.position.x = -center.x
        root.position.z = -center.z
        root.position.y = -box.min.y // Sit on ground

        scene.add(root)

        // Update camera and controls to look at model center
        const modelCenter = new THREE.Vector3(0, size.y / 2, 0)
        controls.target.copy(modelCenter)
        
        // Position camera to see the whole model
        const distance = Math.max(size.x, size.z) * 1.5 + 2
        camera.position.set(0, size.y / 2, distance)
        camera.lookAt(modelCenter)
        controls.update()

        // Play animations
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(root)
          gltf.animations.forEach(clip => mixer!.clipAction(clip).play())
        }

        setLoading(false)
      })
      .catch((err) => {
        console.error('Hero model load error:', err)
        setLoading(false)
        setError(true)
      })

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      if (mixer) mixer.update(dt)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      dracoLoader.dispose()
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [currentDino?.modelUrl])

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + dinosWithModels.length) % dinosWithModels.length)
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % dinosWithModels.length)
  }

  if (!currentDino) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-2">🦕</div>
          <p className="text-sm">Loading dinosaurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 3D Viewer Area */}
      <div ref={mountRef} className="flex-1 min-h-0" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-green-400 mx-auto mb-2" />
            <p className="text-white/80 text-sm">Loading {currentDino.name}...</p>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-300">
            <div className="text-6xl mb-2">🦖</div>
            <p className="text-sm">Model unavailable</p>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {dinosWithModels.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition z-10"
            aria-label="Previous dinosaur"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition z-10"
            aria-label="Next dinosaur"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Bottom Info Bar with Thumbnails */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 sm:p-4 pt-6 sm:pt-8">
        {/* Dino Info */}
        <Link 
          to={`/dino/${currentDino.id}`}
          className="block mb-2 sm:mb-3 group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-base sm:text-xl group-hover:text-green-400 transition truncate">
                {currentDino.name}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
                <span className="text-gray-300 truncate">{currentDino.period || 'Unknown period'}</span>
                {currentDino.diet && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                    currentDino.diet === 'carnivorous' ? 'bg-red-500/30 text-red-300' :
                    currentDino.diet === 'herbivorous' ? 'bg-green-500/30 text-green-300' :
                    'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {currentDino.diet}
                  </span>
                )}
              </div>
            </div>
            <div className="text-green-400 text-xs sm:text-sm font-medium group-hover:translate-x-1 transition-transform whitespace-nowrap">
              View →
            </div>
          </div>
        </Link>

        {/* Thumbnail Selector */}
        {dinosWithModels.length > 1 && (
          <div className="flex gap-1.5 sm:gap-2 justify-center overflow-x-auto py-1 sm:py-2 scrollbar-hide">
            {dinosWithModels.map((dino, idx) => (
              <button
                key={dino.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex 
                    ? 'border-green-400 scale-110 shadow-lg shadow-green-400/30' 
                    : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                }`}
                title={dino.name}
              >
                {dino.imageUrl1 && dino.imageUrl1 !== 'DEV_PENDING' ? (
                  <img 
                    src={dino.imageUrl1} 
                    alt={dino.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-sm sm:text-lg">
                    🦖
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
