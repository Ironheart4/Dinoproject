// HeroDinoViewer.tsx — Mini 3D viewer for hero section showing random dinosaurs
// Cycles through available dinosaurs with their 3D models
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Dinosaur {
  id: number
  name: string
  species: string | null
  period: string | null
  modelUrl: string | null
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
  )

  const currentDino = dinosWithModels[currentIndex] || null

  // Cycle through dinosaurs every 8 seconds
  useEffect(() => {
    if (dinosWithModels.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % dinosWithModels.length)
    }, 8000)
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

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
    camera.position.set(0, 1, 4)

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
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
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
    controls.target.set(0, 0.5, 0)

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

        // Auto-scale and center
        const box = new THREE.Box3().setFromObject(root)
        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1.8 / (maxDim || 1)
        root.scale.setScalar(scale)

        box.setFromObject(root)
        const center = new THREE.Vector3()
        box.getCenter(center)
        root.position.sub(center)
        root.position.y -= box.min.y * scale

        scene.add(root)

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
    <div className="relative w-full h-full">
      {/* 3D Viewer */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl">
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

      {/* Dino info overlay */}
      {!loading && !error && (
        <Link 
          to={`/dino/${currentDino.id}`}
          className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-3 hover:bg-black/70 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition">
                {currentDino.name}
              </h3>
              <p className="text-gray-300 text-sm">{currentDino.period || 'Unknown period'}</p>
            </div>
            <div className="text-green-400 text-sm font-medium">
              View Details →
            </div>
          </div>
        </Link>
      )}

      {/* Pagination dots */}
      {dinosWithModels.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {dinosWithModels.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-green-400 w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
