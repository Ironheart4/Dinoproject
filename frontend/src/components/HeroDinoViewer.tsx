// HeroDinoViewer.tsx — Interactive 3D viewer for hero section with dinosaur selector
// Shows dinosaurs with their 3D models, allows user selection
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isWebGLAvailable, reportWebGLFailure } from '../lib/webgl'

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
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const [webglUnavailable, setWebglUnavailable] = useState(() => !isWebGLAvailable())

  // Filter dinosaurs with valid model URLs
  const modelDinos = useMemo(
    () => dinosaurs.filter(d =>
      d.modelUrl && d.modelUrl !== 'DEV_PENDING' && d.modelUrl.startsWith('http')
    ).slice(0, 8),
    [dinosaurs]
  )
  const dinosWithModels = useMemo(
    () => modelDinos.filter(d => !failedUrls.includes(d.modelUrl!)),
    [modelDinos, failedUrls]
  )

  const activeIndex = dinosWithModels.length ? currentIndex % dinosWithModels.length : 0
  const currentDino = dinosWithModels[activeIndex] || null

  // Auto-cycle every 10 seconds (but user can override)
  useEffect(() => {
    if (webglUnavailable || dinosWithModels.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % dinosWithModels.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [dinosWithModels.length, webglUnavailable])

  useEffect(() => {
    const container = mountRef.current
    const modelUrl = currentDino?.modelUrl
    if (!container || !modelUrl) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)

    if (webglUnavailable || !isWebGLAvailable()) {
      setWebglUnavailable(true)
      setLoading(false)
      setError(true)
      return
    }

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400

    let cancelled = false
    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let controls: OrbitControls | null = null
    let mixer: THREE.AnimationMixer | null = null
    let clock: THREE.Clock | null = null
    let animationId = 0
    let handleResize: (() => void) | null = null

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    const dropModel = () => {
      setFailedUrls(prev => prev.includes(modelUrl) ? prev : [...prev, modelUrl])
    }

    // Load model
    loader.loadAsync(modelUrl)
      .then((gltf) => {
        if (cancelled) return

        const root = gltf.scene || gltf.scenes[0]
        if (!root) {
          setLoading(false)
          setError(true)
          dropModel()
          return
        }

        try {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          })
        } catch {
          reportWebGLFailure()
          setWebglUnavailable(true)
          setLoading(false)
          setError(true)
          return
        }

        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(0x000000, 0)
        container.appendChild(renderer.domElement)

        scene = new THREE.Scene()
        scene.background = null // Transparent

        // Camera - adjusted after model is measured
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
        camera.position.set(0, 1, 5)

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

        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false
        controls.enablePan = false
        controls.autoRotate = true
        controls.autoRotateSpeed = 2
        controls.enableDamping = true
        controls.dampingFactor = 0.05

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

        // Animation loop
        clock = new THREE.Clock()
        const currentRenderer = renderer
        const currentScene = scene
        const animate = () => {
          animationId = requestAnimationFrame(animate)
          const dt = clock!.getDelta()
          if (mixer) mixer.update(dt)
          controls?.update()
          currentRenderer.render(currentScene, camera)
        }
        animate()

        // Resize handler
        handleResize = () => {
          const w = container.clientWidth
          const h = container.clientHeight
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          currentRenderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
        setError(true)
        dropModel()
      })

    return () => {
      cancelled = true
      if (animationId) cancelAnimationFrame(animationId)
      if (handleResize) window.removeEventListener('resize', handleResize)
      controls?.dispose()
      if (renderer) {
        renderer.dispose()
        renderer.forceContextLoss()
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
      dracoLoader.dispose()
      scene?.clear()
    }
  }, [currentDino?.modelUrl, webglUnavailable])

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + dinosWithModels.length) % dinosWithModels.length)
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % dinosWithModels.length)
  }

  if (!currentDino) {
    const fallbackDino = modelDinos[0] || dinosaurs[0]

    if (modelDinos.length > 0) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          {fallbackDino?.imageUrl1 && fallbackDino.imageUrl1 !== 'DEV_PENDING' ? (
            <img
              src={fallbackDino.imageUrl1}
              alt={fallbackDino.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800 text-6xl">🦖</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-gray-300">3D models are temporarily unavailable.</p>
            <Link
              to="/encyclopedia"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              Browse Encyclopedia
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-3">🦕</div>
          <p className="text-sm mb-4">
            {dinosaurs.length ? '3D models are coming soon.' : 'No dinosaurs are available right now.'}
          </p>
          <Link
            to="/encyclopedia"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
          >
            Browse Encyclopedia
          </Link>
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
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {currentDino.imageUrl1 && currentDino.imageUrl1 !== 'DEV_PENDING' ? (
            <div className="relative h-full w-full">
              <img
                src={currentDino.imageUrl1}
                alt={currentDino.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
              <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-gray-300">
                3D view unavailable — showing image
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-300">
              <div className="text-6xl mb-2">🦖</div>
              <p className="text-sm">3D view unavailable</p>
            </div>
          )}
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
                  idx === activeIndex
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
