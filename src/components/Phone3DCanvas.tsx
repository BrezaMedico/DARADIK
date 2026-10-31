import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

interface Phone3DCanvasProps {
  isIntroActive?: boolean;
  className?: string;
}

export const Phone3DCanvas: React.FC<Phone3DCanvasProps> = ({
  isIntroActive = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isEntranceDone, setIsEntranceDone] = useState<boolean>(false);
  const isIntroActiveRef = useRef<boolean>(isIntroActive);
  isIntroActiveRef.current = isIntroActive;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animFrameId: number | null = null;
    let isDisposed = false;

    // Base resting pose (slight elegant tilt facing camera, matching original mockup)
    const BASE_YAW = -0.26; // ~ -15° (slight turn showing titanium side)
    const BASE_PITCH = 0.09; // ~ +5.2° (gentle backward tilt)
    const BASE_ROLL = -0.06; // ~ -3.4° (slight dynamic roll)
    let baseX = 0; // horizontal offset to balance right side

    // Subdued tilt bounds for mouse & sensor ("putar tipis, jangan terlalu diputar")
    const MAX_TILT_YAW = 0.13; // ~7.5° max
    const MAX_TILT_PITCH = 0.09; // ~5.2° max
    const MAX_TILT_ROLL = 0.03; // ~1.7° max

    // Target offsets driven by mouse or device orientation (-1 to +1)
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    // Entrance animation state
    // "muncul hp dari bawah putih mengikuti gradasi dengan cara memutar 2 kali ke kanan (720°)"
    let entranceStarted = false;
    let entranceStartTime = 0;
    const ENTRANCE_DURATION = 1950; // ms
    const START_Y = -95; // starts comfortably down within the bottom gradient mist
    const START_SPIN = -4 * Math.PI; // 720° rotation to the right (2 full spins)
    let currentAnimY = START_Y;
    let currentAnimSpin = START_SPIN;
    let entranceFinished = false;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 10, 1000);
    camera.position.set(0, 0, 240);

    // WebGL Renderer with High Quality & Alpha
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // Studio Lights for iPhone 16 Pro Max Titanium Body (no harsh glare on screen)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    // Key directional light angled from upper-right to catch titanium chamfer & bevels
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
    keyLight.position.set(130, 160, 110);
    scene.add(keyLight);

    // Soft cyan/blue fill light matching DARADIK palette
    const fillLight = new THREE.DirectionalLight(0xa5cceb, 0.95);
    fillLight.position.set(-120, -50, 90);
    scene.add(fillLight);

    // Rim specular light for titanium edges & camera module
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.35);
    rimLight.position.set(0, 120, -100);
    scene.add(rimLight);

    // Parent hierarchy
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(0, START_Y, 0);
    phoneGroup.rotation.set(BASE_PITCH, BASE_YAW + START_SPIN, BASE_ROLL);
    scene.add(phoneGroup);

    // Resize Handler
    const updateSize = () => {
      if (!container || isDisposed) return;
      const width = container.clientWidth || 360;
      const height = container.clientHeight || 520;
      camera.aspect = width / height;

      // Adjust camera distance & horizontal offset ("agak perbesar dikit & agak ke kananin")
      if (width < 380) {
        camera.position.z = 260;
        baseX = 0;
      } else if (width < 640) {
        camera.position.z = 248;
        baseX = 0;
      } else if (width < 1024) {
        camera.position.z = 240;
        baseX = 2;
      } else {
        camera.position.z = 236; // Perbesar model 3D
        baseX = 5; // Geser sedikit ke kanan agar komposisi seimbang
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // Load Materials & Model
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/iphone16/');
    mtlLoader.load(
      'iphone16promax_model.mtl',
      (materials) => {
        if (isDisposed) return;
        materials.preload();

        // Tune titanium & body materials for premium realism
        Object.values(materials.materials).forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            mat.side = THREE.FrontSide;
          }
        });

        // Display Texture: Gunakan MeshBasicMaterial agar layar bebas pantulan cahaya putih
        // dan konten UI terbaca sangat tajam, jernih, dan tidak pudar/putih
        const rawDisplayMat = materials.materials['Display_Texture'] as any;
        let screenMat: THREE.MeshBasicMaterial | null = null;
        if (rawDisplayMat && rawDisplayMat.map) {
          rawDisplayMat.map.wrapS = THREE.RepeatWrapping;
          rawDisplayMat.map.repeat.x = -1;
          rawDisplayMat.map.offset.x = 1;
          rawDisplayMat.map.colorSpace = THREE.SRGBColorSpace;
          rawDisplayMat.map.anisotropy = 16;
          rawDisplayMat.map.generateMipmaps = true;
          rawDisplayMat.map.minFilter = THREE.LinearMipmapLinearFilter;
          rawDisplayMat.map.magFilter = THREE.LinearFilter;
          rawDisplayMat.map.needsUpdate = true;

          screenMat = new THREE.MeshBasicMaterial({
            map: rawDisplayMat.map,
            toneMapped: true,
          });
          materials.materials['Display_Texture'] = screenMat;
        }

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/models/iphone16/');
        objLoader.load(
          'iPhone_16_Pro_Max.obj',
          (object) => {
            if (isDisposed) return;

            // Pastikan mesh layar menggunakan screenMat bebas pantulan
            if (screenMat) {
              object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material = child.material.map((m) =>
                        m.name === 'Display_Texture' ? screenMat! : m
                      );
                    } else if (child.material.name === 'Display_Texture') {
                      child.material = screenMat;
                    }
                  }
                }
              });
            }

            // Orient model upright & facing forward
            object.rotation.set(-Math.PI / 2, 0, Math.PI);
            phoneGroup.add(object);
            setIsLoaded(true);

            // If intro already finished when loaded, trigger entrance animation
            if (!isIntroActiveRef.current) {
              entranceStarted = true;
              entranceStartTime = performance.now();
            }
          },
          undefined,
          (err) => {
            console.error('[DARADIK 3D Phone] Error loading OBJ:', err);
          }
        );
      },
      undefined,
      (err) => {
        console.error('[DARADIK 3D Phone] Error loading MTL:', err);
      }
    );

    // Mouse movement listener (Window scope for fluid tracking across hero)
    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w) * 2 - 1; // -1 (left) to +1 (right)
      const ny = (e.clientY / h) * 2 - 1; // -1 (top) to +1 (bottom)
      targetTiltX = Math.max(-1, Math.min(1, nx));
      targetTiltY = Math.max(-1, Math.min(1, ny));
    };

    // Mobile Gyroscope / DeviceOrientation sensor
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right tilt in [-90, 90]
        const normGamma = Math.max(-1, Math.min(1, e.gamma / 28));
        // beta: front-to-back tilt in [-180, 180], typical holding phone is ~45°
        const normBeta = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
        targetTiltX = normGamma;
        targetTiltY = normBeta;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    // Main Animation Loop
    const renderLoop = (now: number) => {
      if (isDisposed) return;

      // Check if intro has ended to start entrance animation
      if (!entranceStarted && !isIntroActiveRef.current && phoneGroup.children.length > 0) {
        entranceStarted = true;
        entranceStartTime = now;
      }

      // 1. Entrance Rise & 2x Rotation
      if (entranceStarted && !entranceFinished) {
        const elapsed = now - entranceStartTime;
        const progress = Math.min(1, Math.max(0, elapsed / ENTRANCE_DURATION));

        // Smooth cubic ease-out
        const eased = 1 - Math.pow(1 - progress, 3.2);

        currentAnimY = START_Y * (1 - eased);
        currentAnimSpin = START_SPIN * (1 - eased);

        if (progress >= 1) {
          entranceFinished = true;
          currentAnimY = 0;
          currentAnimSpin = 0;
          setIsEntranceDone(true);
        }
      }

      // 2. Smooth Lerp for Mouse / Sensor Tilting (Tipis & Halus)
      currentTiltX += (targetTiltX - currentTiltX) * 0.055;
      currentTiltY += (targetTiltY - currentTiltY) * 0.055;

      const finalYaw = BASE_YAW + currentAnimSpin + currentTiltX * MAX_TILT_YAW;
      const finalPitch = BASE_PITCH - currentTiltY * MAX_TILT_PITCH;
      const finalRoll = BASE_ROLL + currentTiltX * MAX_TILT_ROLL;

      phoneGroup.position.set(baseX, currentAnimY, 0);
      phoneGroup.rotation.set(finalPitch, finalYaw, finalRoll);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      isDisposed = true;
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[420px] sm:h-[490px] lg:h-[560px] xl:h-[610px] flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        maskImage: isEntranceDone
          ? 'none'
          : 'linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.2) 6%, rgba(0, 0, 0, 0.8) 18%, black 30%, black 100%)',
        WebkitMaskImage: isEntranceDone
          ? 'none'
          : 'linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.2) 6%, rgba(0, 0, 0, 0.8) 18%, black 30%, black 100%)',
      }}
      aria-label="Visualisasi 3D Interaktif iPhone 16 Pro Max DARADIK"
    >
      {/* Subtle loader shimmer before 3D model loads */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-52 h-88 sm:w-60 sm:h-98 rounded-[42px] border-2 border-white/20 bg-white/5 backdrop-blur-xs animate-pulse flex items-center justify-center">
            <span className="text-xs font-semibold text-white/70">Memuat Model 3D...</span>
          </div>
        </div>
      )}

      {/* Gradasi kabut putih & biru di bagian bawah agar saat HP muncul tidak terpotong tajam */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-32 sm:h-44 pointer-events-none bg-gradient-to-t from-[#FAF8F5] via-[#E6ECE8]/75 to-transparent transition-opacity duration-700 ease-out z-10 ${
          isEntranceDone ? 'opacity-0' : 'opacity-90'
        }`}
        aria-hidden="true"
      />
    </div>
  );
};
