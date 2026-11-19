// HeroDinoViewer.tsx — Interactive 3D viewer for hero section with dinosaur selector
// Shows a stable set of dinosaurs, using a 3D model when available and a clear
// fallback when a model has not been added yet or cannot be rendered.
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isWebGLAvailable, reportWebGLFailure } from '../lib/webgl'
import { resolveDinosaurModelUrl } from '../lib/dinosaurModels'
import { DinoFootprint } from './DinoIcons'

interface Dinosaur {
  id: number
  name: string
  species: string | null
  period: string | null
  diet: string | null
  modelUrl: string | null
  imageUrl1: string | null
}

interface HeroOption extends Dinosaur {
  hasModel: boolean
}

interface Props {
  dinosaurs: Dinosaur[]
}

const HERO_MODEL_ORDER: Record<string, number> = {
  Tyrannosaurus: 0,
  Aardonyx: 1,
}

const HERO_OPTION_LIMIT = 4
const PINNED_HERO_MODEL = 'Aardonyx'
const MODEL_LOAD_TIMEOUT_MS = 20000
const HIGH_POLY_THRESHOLD = 600_000

const UNAVAILABLE_MODEL_URLS = new Set([
  'https://raw.githubusercontent.com/Ironheart4/dino-models/main/models/Velociraptor.glb',
])

function isUsableModelUrl(url: string | null): url is string {
  return Boolean(url && url !== 'DEV_PENDING' && url.startsWith('http') && !UNAVAILABLE_MODEL_URLS.has(url))
}

function countTriangles(root: THREE.Object3D): number {
  let triangles = 0
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    const { geometry } = mesh
    triangles += geometry.index
      ? geometry.index.count / 3
      : (geometry.attributes.position?.count ?? 0) / 3
  })
  return triangles
}

export default function HeroDinoViewer({ dinosaurs }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const [webglUnavailable, setWebglUnavailable] = useState(() => !isWebGLAvailable())

  // Always keep the working hero model visible. Additional model-backed
  // dinosaurs are shuffled, then missing-model dinosaurs fill the remaining
  // selector slots so the hero never collapses back to a single option.
  const heroOptions = useMemo<HeroOption[]>(() => {
    const withModels: HeroOption[] = []
    const withoutModels: HeroOption[] = []

    for (const dino of dinosaurs) {
      const modelUrl = resolveDinosaurModelUrl(dino)
      const option = { ...dino, modelUrl, hasModel: isUsableModelUrl(modelUrl) }
      if (option.hasModel) withModels.push(option)
      else withoutModels.push(option)
    }

    withModels.sort((a, b) => (HERO_MODEL_ORDER[a.name] ?? 9) - (HERO_MODEL_ORDER[b.name] ?? 9))

    const pinned = withModels.find(d => d.name === PINNED_HERO_MODEL) ?? withModels[0]
    const rest = withModels.filter(d => d !== pinned)
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }

    return [...(pinned ? [pinned] : []), ...rest, ...withoutModels].slice(0, HERO_OPTION_LIMIT)
  }, [dinosaurs])

  const activeIndex = heroOptions.length
    ? ((currentIndex % heroOptions.length) + heroOptions.length) % heroOptions.length
    : 0
  const currentDino = heroOptions[activeIndex] || null
  const activeModelUrl = currentDino?.hasModel ? currentDino.modelUrl : null
  const activeModelFailed = Boolean(activeModelUrl && failedUrls.includes(activeModelUrl))
  const canShowModel = Boolean(activeModelUrl && !activeModelFailed && !webglUnavailable)

  const loadableIndexes = useMemo(
    () => heroOptions.flatMap((dino, index) =>
      dino.hasModel && dino.modelUrl && !failedUrls.includes(dino.modelUrl) ? [index] : []
    ),
    [heroOptions, failedUrls]
  )

  // Auto-cycle only after the current model has settled, and only among
  // models that can actually render. This avoids switching mid-load.
  useEffect(() => {
    if (webglUnavailable || loading || loadableIndexes.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const position = loadableIndexes.indexOf(prev)
        return loadableIndexes[(position + 1) % loadableIndexes.length]
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [loadableIndexes, loading, webglUnavailable])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    if (!activeModelUrl || activeModelFailed) {
      setLoading(false)
      return
    }

    const modelUrl = activeModelUrl
    setLoading(true)

    if (webglUnavailable || !isWebGLAvailable()) {
      setWebglUnavailable(true)
      setLoading(false)
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
    let handleContextLost: ((event: Event) => void) | null = null

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    const dropModel = () => {
      setFailedUrls(prev => prev.includes(modelUrl) ? prev : [...prev, modelUrl])
    }

    const loadTimeout = window.setTimeout(() => {
      if (cancelled) return
      setLoading(false)
      dropModel()
    }, MODEL_LOAD_TIMEOUT_MS)

    // Load model
    loader.loadAsync(modelUrl)
      .then((gltf) => {
        if (cancelled) return
        window.clearTimeout(loadTimeout)

        const root = gltf.scene || gltf.scenes[0]
        if (!root) {
          setLoading(false)
          dropModel()
          return
        }

        if (!isWebGLAvailable()) {
          setWebglUnavailable(true)
          setLoading(false)
          return
        }

        // Match the detail-page viewer's performance settings for high-poly
        // models. Aardonyx has ~1M triangles, so full-DPR + MSAA is the main
        // cause of choppy orbiting in the hero.
        const highPoly = countTriangles(root) > HIGH_POLY_THRESHOLD

        try {
          renderer = new THREE.WebGLRenderer({
            antialias: !highPoly,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
          })
        } catch {
          reportWebGLFailure()
          setWebglUnavailable(true)
          setLoading(false)
          return
        }

        renderer.setSize(width, height)
        renderer.setPixelRatio(highPoly ? 1 : Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.display = 'block'
        container.appendChild(renderer.domElement)

        if (highPoly) {
          root.traverse((object) => {
            const mesh = object as THREE.Mesh
            if (!mesh.isMesh) return
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            for (const material of materials) {
              if (material instanceof THREE.Material && material.side === THREE.DoubleSide) {
                material.side = THREE.FrontSide
                material.needsUpdate = true
              }
            }
          })
        }

        handleContextLost = (event: Event) => {
          event.preventDefault()
          if (cancelled) return
          setLoading(false)
          dropModel()
        }
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost)

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
        controls.autoRotateSpeed = highPoly ? 1.5 : 2
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
        let contextLossHandled = false
        const animate = () => {
          animationId = requestAnimationFrame(animate)
          if (cancelled) return
          if (!contextLossHandled && currentRenderer.getContext().isContextLost()) {
            contextLossHandled = true
            setLoading(false)
            dropModel()
            return
          }
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
        window.clearTimeout(loadTimeout)
        setLoading(false)
        dropModel()
      })

    return () => {
      cancelled = true
      window.clearTimeout(loadTimeout)
      if (animationId) cancelAnimationFrame(animationId)
      if (handleResize) window.removeEventListener('resize', handleResize)
      if (renderer && handleContextLost) {
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
      }
      controls?.dispose()
      if (renderer) {
        renderer.dispose()
        if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
      dracoLoader.dispose()
      scene?.clear()
    }
  }, [activeModelUrl, activeModelFailed, webglUnavailable])

  const handlePrev = () => {
    if (!heroOptions.length) return
    setCurrentIndex(prev => (prev - 1 + heroOptions.length) % heroOptions.length)
  }

  const handleNext = () => {
    if (!heroOptions.length) return
    setCurrentIndex(prev => (prev + 1) % heroOptions.length)
  }

  if (!currentDino) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <DinoFootprint size={64} className="mx-auto mb-3 text-green-400/50" />
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

  const fallbackImage = currentDino.imageUrl1 && currentDino.imageUrl1 !== 'DEV_PENDING'
    ? currentDino.imageUrl1
    : null
  const unavailableMessage = webglUnavailable
    ? '3D view is unavailable in this browser.'
    : activeModelFailed
      ? fallbackImage
        ? '3D view unavailable — showing image.'
        : '3D view unavailable for this dinosaur.'
      : '3D model does not exist for this dinosaur yet.'

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 3D Viewer Area */}
      <div ref={mountRef} className="flex-1 min-h-0" />

      {/* Loading overlay */}
      {loading && canShowModel && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-green-400 mx-auto mb-2" />
            <p className="text-white/80 text-sm">Loading {currentDino.name}...</p>
          </div>
        </div>
      )}

      {/* Image / missing-model fallback */}
      {!canShowModel && !loading && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {fallbackImage ? (
            <img
              src={fallbackImage}
              alt={currentDino.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800/80">
              <DinoFootprint size={96} className="text-green-400/25" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/45 to-gray-900/10" />
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-center text-xs text-gray-200 sm:text-sm">
            {unavailableMessage}
          </p>
        </div>
      )}

      {/* Navigation Arrows */}
      {heroOptions.length > 1 && (
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
        {heroOptions.length > 1 && (
          <div className="flex gap-1.5 sm:gap-2 justify-center overflow-x-auto py-1 sm:py-2 scrollbar-hide">
            {heroOptions.map((dino, idx) => (
              <button
                key={dino.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === activeIndex
                    ? 'border-green-400 scale-110 shadow-lg shadow-green-400/30' 
                    : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                }`}
                title={dino.hasModel ? dino.name : `${dino.name} — 3D model coming soon`}
                aria-label={dino.name}
                aria-current={idx === activeIndex}
              >
                {dino.imageUrl1 && dino.imageUrl1 !== 'DEV_PENDING' ? (
                  <img 
                    src={dino.imageUrl1} 
                    alt={dino.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <DinoFootprint size={18} className="text-green-400/60 sm:hidden" />
                    <DinoFootprint size={24} className="hidden text-green-400/60 sm:block" />
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
