// ============================================================================
// DinoViewer.tsx — 3D Dinosaur Model Viewer Component
// ============================================================================
// PURPOSE: Renders interactive 3D dinosaur models using Three.js
// Used on DinoDetail pages to display the dinosaur in 3D
//
// HOW IT WORKS:
// 1. Creates a Three.js scene (3D world) with lights and camera
// 2. Loads the 3D model from URL (GLB/GLTF format)
// 3. Centers and scales the model to fit the viewer
// 4. Adds OrbitControls so users can rotate/zoom
// 5. Plays any animations embedded in the model
//
// PROPS:
//   url         - URL to the 3D model file (GLB or GLTF)
//   background  - Background color (default: black)
//   autoRotate  - Auto-rotate the model (default: true)
//   height      - Height of the viewer (number or '100%')
//
// SUPPORTED FORMATS:
//   - GLB (binary GLTF - recommended, smaller file size)
//   - GLTF (JSON-based, can reference external textures)
//   - Draco-compressed models (automatically decoded)
//
// COMMON ISSUES:
//   - CORS errors: Model host must allow cross-origin requests
//     Solution: Use raw.githubusercontent.com for GitHub-hosted models
//   - Model too big/small: Component auto-scales, but very large models may lag
//   - No animation: Not all models have animations; static models work fine
//
// EXAMPLE USAGE:
//   <DinoViewer 
//     url="https://example.com/trex.glb"
//     height={500}
//     autoRotate={true}
//   />
// ============================================================================
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Dna, Loader2, AlertTriangle } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type Props = {
  url: string | null | undefined;  // URL to the 3D model (required)
  className?: string;               // Additional CSS classes
  background?: string;              // Background color (hex)
  autoRotate?: boolean;             // Auto-rotate the model
  height?: number | string;         // Viewer height (px or '100%')
};

export default function DinoViewer({
  url,
  className = "",
  background = "#000000",
  autoRotate = true,
  height = 400,
}: Props) {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  const mountRef = useRef<HTMLDivElement | null>(null);           // Container element
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);   // Three.js renderer
  const [loading, setLoading] = useState(true);                    // Loading state
  const [error, setError] = useState<string | null>(null);         // Error message
  const [loadProgress, setLoadProgress] = useState(0);             // Load progress %

  // ============================================================================
  // MAIN EFFECT - Setup and load 3D scene
  // This runs when url, background, autoRotate, or height changes
  // ============================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !url) {
      setLoading(false);
      return;
    }

    // Check for placeholder URLs
    if (url === "DEV_PENDING" || !url.startsWith("http")) {
      setLoading(false);
      setError("3D model not available yet");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadProgress(0);

    // ========================================================================
    // HELPER: Get container dimensions for responsive sizing
    // ========================================================================
    const getContainerSize = () => {
      const w = container.clientWidth || 600;
      const h = typeof height === 'number' ? height : (container.clientHeight || 500);
      return { w, h };
    };
    
    const { w: width, h } = getContainerSize();

    // ========================================================================
    // STEP 1: Create Scene (the 3D world)
    // ========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    // ========================================================================
    // STEP 2: Create Camera (what we see the 3D world through)
    // PerspectiveCamera mimics human eye perspective
    // ========================================================================
    const camera = new THREE.PerspectiveCamera(
      40,           // FOV (field of view) in degrees
      width / h,    // Aspect ratio
      0.1,          // Near clipping plane
      1000          // Far clipping plane
    );
    camera.position.set(0, 1, 5);  // Initial position

    // ========================================================================
    // STEP 3: Create Renderer (converts 3D scene to 2D image)
    // ========================================================================
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,              // Disable for performance
      alpha: false,                   // No transparency needed
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(1);        // Use 1 for performance (vs devicePixelRatio)
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // ========================================================================
    // STEP 4: Add Lights (illuminate the 3D model)
    // Without lights, the model would appear completely black!
    // ========================================================================
    
    // Hemisphere light: sky color from above, ground color from below
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    // Directional light: like sunlight, casts shadows in one direction
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(-3, 10, -10);
    scene.add(dir);

    // Second directional light from opposite side for balance
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dir2.position.set(5, 5, 5);
    scene.add(dir2);

    // Ambient light: general illumination from all directions
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // ========================================================================
    // STEP 5: Add OrbitControls (mouse/touch interaction)
    // Allows users to rotate, pan, and zoom the view
    // ========================================================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);        // Point camera looks at
    controls.enableDamping = true;        // Smooth rotation
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;     // Auto-spin if enabled
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 1;             // Minimum zoom distance
    controls.maxDistance = 20;            // Maximum zoom distance

    // Animation mixer for playing model animations
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();
    let animationId: number;

    // ========================================================================
    // STEP 6: Setup DRACO Decoder (for compressed models)
    // Many 3D models use Draco compression to reduce file size
    // ========================================================================
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    // ========================================================================
    // STEP 7: Load the 3D Model
    // ========================================================================
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    console.log("Loading 3D model from:", url);
    
    // First check if URL is accessible (CORS check)
    fetch(url, { mode: 'cors' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log("URL is accessible, loading model...");
        return loader.loadAsync(url);
      })
      .then((gltf) => {
        console.log("Model loaded successfully:", gltf);
        const root = gltf.scene || gltf.scenes[0];

        // ====================================================================
        // STEP 8: Scale and center the model
        // Models come in various sizes - we normalize them to fit our view
        // ====================================================================
        
        // Calculate model's bounding box (its 3D dimensions)
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Scale model to fit nicely (target size: 2.2 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / (maxDim || 1);
        root.scale.setScalar(scale);

        // Recalculate bounding box after scaling
        box.setFromObject(root);
        box.getCenter(center);
        box.getSize(size);
        
        // Center model at origin (0, 0, 0)
        root.position.x = -center.x;
        root.position.z = -center.z;
        root.position.y = -box.min.y;  // Place bottom at y=0

        scene.add(root);
        
        // ====================================================================
        // STEP 9: Position camera to see the model properly
        // ====================================================================
        const modelCenter = new THREE.Vector3(0, size.y / 2, 0);
        controls.target.copy(modelCenter);
        camera.position.set(0, size.y / 2, Math.max(size.x, size.z) * 2 + 2);
        camera.lookAt(modelCenter);
        controls.update();

        // ====================================================================
        // STEP 10: Play animations if the model has any
        // ====================================================================
        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((clip) => mixer!.clipAction(clip).play());
        }

        setLoading(false);
        setLoadProgress(100);
      })
      .catch((err: any) => {
        console.error("GLTF load error:", err);
        console.error("Failed URL:", url);
        setLoading(false);
        
        // Provide helpful error messages
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setError("Network error loading model. Check your connection.");
        } else {
          setError(`Failed to load 3D model: ${err.message || 'Unknown error'}`);
        }
      });

    // ========================================================================
    // ANIMATION LOOP - Runs every frame (~60 FPS)
    // ========================================================================
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();           // Time since last frame
      if (mixer) mixer.update(dt);           // Update model animations
      controls.update();                      // Update camera controls (damping, auto-rotate)
      renderer.render(scene, camera);        // Draw the scene
    };
    animate();

    // ========================================================================
    // RESIZE HANDLER - Keep viewer responsive
    // ========================================================================
    const handleResize = () => {
      if (!container) return;
      const { w, h: newH } = getContainerSize();
      camera.aspect = w / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, newH);
    };
    window.addEventListener("resize", handleResize);
    
    // Also observe container size changes (for flex layouts)
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ========================================================================
    // CLEANUP - Remove everything when component unmounts
    // This prevents memory leaks!
    // ========================================================================
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      dracoLoader.dispose();
      rendererRef.current = null;
      
      // Remove canvas from DOM
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose all geometries and materials to free GPU memory
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [url, background, autoRotate, height]);

  // ============================================================================
  // RENDER: Placeholder when no URL provided
  // ============================================================================
  if (!url || url === "DEV_PENDING") {
    return (
      <div className={`${className} bg-gray-800 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center text-gray-400">
          <Dna size={48} className="mx-auto mb-2" />
          <p>3D Model Coming Soon</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: Main viewer with loading/error overlays
  // ============================================================================
  return (
    <div className={`${className} relative`}>
      {/* Container for Three.js canvas */}
      <div
        ref={mountRef}
        className="rounded-lg overflow-hidden bg-black"
        style={{ width: "100%", height: typeof height === 'number' ? `${height}px` : height }}
      />
      
      {/* Loading overlay with spinner and progress */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-green-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading 3D model...</p>
            {loadProgress > 0 && loadProgress < 100 && (
              <div className="mt-2 w-32 mx-auto">
                <div className="bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{loadProgress}%</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error overlay with message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
          <div className="text-center text-red-400">
            <AlertTriangle size={40} className="mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
