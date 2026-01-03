import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Dna, Loader2, AlertTriangle } from "lucide-react";

type Props = {
  url: string | null | undefined;
  className?: string;
  background?: string;
  autoRotate?: boolean;
  height?: number;
};

export default function DinoViewer({
  url,
  className = "",
  background = "#0b1220",
  autoRotate = true,
  height = 400,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !url) {
      setLoading(false);
      return;
    }

    // Check for DEV_PENDING or invalid URL
    if (url === "DEV_PENDING" || !url.startsWith("http")) {
      setLoading(false);
      setError("3D model not available yet");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadProgress(0);

    // Ensure container has dimensions
    const width = container.clientWidth || 600;
    const h = height || 400;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, h);
    renderer.setPixelRatio(1); // Use 1 for better performance
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(-3, 10, -10);
    scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dir2.position.set(5, 5, 5);
    scene.add(dir2);

    // Add ambient light for better visibility
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;

    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();
    let animationId: number;

    // Setup DRACO loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    // Load GLTF
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    console.log("Loading 3D model from:", url);
    
    // First, fetch the file to ensure it's accessible
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

        // Auto-scale and center
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / (maxDim || 1);
        root.scale.setScalar(scale);

        box.setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);
        root.position.y -= box.min.y * scale;

        scene.add(root);

        // Play animations if present
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
        // Check if it's a network/CORS error
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setError("Network error loading model. Check your connection.");
        } else {
          setError(`Failed to load 3D model: ${err.message || 'Unknown error'}`);
        }
      });

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (mixer) mixer.update(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      dracoLoader.dispose();
      rendererRef.current = null;
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
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

  return (
    <div className={`${className} relative`}>
      <div
        ref={mountRef}
        className="rounded-lg overflow-hidden bg-gray-900"
        style={{ width: "100%", height }}
      />
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
