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
  const isIntroActiveRef = useRef<boolean>(isIntroActive);
  isIntroActiveRef.current = isIntroActive;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animFrameId: number | null = null;
    let isDisposed = false;

    // Angled resting pose exposes the titanium side frame so the model reads as 3D rather than flat.
    const BASE_YAW = -0.42;
    const BASE_PITCH = 0.05;
    const BASE_ROLL = -0.17;
    let baseX = 0;

    const MAX_TILT_YAW = 0.12;
    const MAX_TILT_PITCH = 0.08;
    const MAX_TILT_ROLL = 0.03;

    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    // Start below the bottom hero gradient mask so the phone rises smoothly into view.
    let entranceStarted = false;
    let entranceStartTime = 0;
    const ENTRANCE_DURATION = 1800;
    const START_Y = -115;
    const START_SPIN = -2 * Math.PI;
    let currentAnimY = START_Y;
    let currentAnimSpin = START_SPIN;
    let entranceFinished = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 10, 1000);
    camera.position.set(0, 0, 280);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
    keyLight.position.set(130, 160, 110);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5cceb, 0.95);
    fillLight.position.set(-120, -50, 90);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.35);
    rimLight.position.set(0, 120, -100);
    scene.add(rimLight);

    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(0, START_Y, 0);
    phoneGroup.rotation.set(BASE_PITCH, BASE_YAW + START_SPIN, BASE_ROLL);
    scene.add(phoneGroup);

    const updateSize = () => {
      if (!container || isDisposed) return;
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 440;
      camera.aspect = width / height;

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      if (screenWidth < 480) {
        camera.position.set(0, 14, 272);
        baseX = 0;
      } else if (screenWidth < 768) {
        camera.position.set(0, 14, 268);
        baseX = 0;
      } else if (screenWidth < 1024) {
        camera.position.set(0, 10, 272);
        baseX = 0;
      } else {
        camera.position.set(3, 0, 325);
        baseX = 3;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/iphone16/');
    mtlLoader.load(
      'iphone16promax_model.mtl',
      (materials) => {
        if (isDisposed) return;
        materials.preload();

        Object.values(materials.materials).forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
            mat.side = THREE.FrontSide;
          }
        });

        // Use unlit MeshBasicMaterial with flipped UVs so screen text stays crisp without specular glare.
        const textureLoader = new THREE.TextureLoader();
        const screenTexture = textureLoader.load(
          '/models/iphone16/screen_texture.png',
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.repeat.x = -1;
            tex.offset.x = 1;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 16;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            if (screenMat) {
              screenMat.map = tex;
              screenMat.needsUpdate = true;
            }
          }
        );
        screenTexture.wrapS = THREE.RepeatWrapping;
        screenTexture.repeat.x = -1;
        screenTexture.offset.x = 1;
        screenTexture.colorSpace = THREE.SRGBColorSpace;

        const screenMat = new THREE.MeshBasicMaterial({
          map: screenTexture,
          toneMapped: true,
        });
        materials.materials['Display_Texture'] = screenMat;

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/models/iphone16/');
        objLoader.load(
          'iPhone_16_Pro_Max.obj',
          (object) => {
            if (isDisposed) return;

            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (
                  child.name === 'Screen_Screenshot_Texture' ||
                  child.material?.name === 'Display_Texture'
                ) {
                  child.material = screenMat;
                } else if (Array.isArray(child.material)) {
                  child.material = child.material.map((m) =>
                    m.name === 'Display_Texture' ? screenMat : m
                  );
                }
              }
            });

            object.rotation.set(-Math.PI / 2, 0, Math.PI);
            phoneGroup.add(object);
            setIsLoaded(true);

            // Start the entrance immediately if the intro splash already finished while loading.
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

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w) * 2 - 1;
      const ny = (e.clientY / h) * 2 - 1;
      targetTiltX = Math.max(-1, Math.min(1, nx));
      targetTiltY = Math.max(-1, Math.min(1, ny));
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const normGamma = Math.max(-1, Math.min(1, e.gamma / 28));
        const normBeta = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
        targetTiltX = normGamma;
        targetTiltY = normBeta;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    const isMobileWidth = () => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    // Mask the lower canvas edge on mobile so the overlapping hero headline blends without a hard cut.
    const applyFade = (fadePct: number) => {
      if (isMobileWidth()) {
        const mobileMask =
          'linear-gradient(to bottom, black 46%, rgba(0,0,0,0.55) 66%, transparent 84%)';
        container.style.maskImage = mobileMask;
        container.style.webkitMaskImage = mobileMask;
      } else {
        if (fadePct <= 0.2) {
          container.style.maskImage = 'none';
          container.style.webkitMaskImage = 'none';
        } else {
          const val = `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.35) ${(fadePct * 0.45).toFixed(1)}%, black ${fadePct.toFixed(1)}%)`;
          container.style.maskImage = val;
          container.style.webkitMaskImage = val;
        }
      }
    };
    applyFade(42);

    const renderLoop = (now: number) => {
      if (isDisposed) return;

      if (!entranceStarted && !isIntroActiveRef.current && phoneGroup.children.length > 0) {
        entranceStarted = true;
        entranceStartTime = now;
      }

      if (entranceStarted && !entranceFinished) {
        const elapsed = now - entranceStartTime;
        const progress = Math.min(1, Math.max(0, elapsed / ENTRANCE_DURATION));
        const eased = 1 - Math.pow(1 - progress, 3.2);

        currentAnimY = START_Y * (1 - eased);
        currentAnimSpin = START_SPIN * (1 - eased);
        applyFade(42 * (1 - eased));

        if (progress >= 1) {
          entranceFinished = true;
          currentAnimY = 0;
          currentAnimSpin = 0;
          applyFade(0);
        }
      }

      currentTiltX += (targetTiltX - currentTiltX) * 0.055;
      currentTiltY += (targetTiltY - currentTiltY) * 0.055;

      const finalYaw = BASE_YAW + currentAnimSpin + currentTiltX * MAX_TILT_YAW;
      const finalPitch = BASE_PITCH - currentTiltY * MAX_TILT_PITCH;
      const finalRoll = BASE_ROLL + currentTiltX * MAX_TILT_ROLL;

      const floatT = entranceFinished ? Math.sin(now / 1100) : 0;
      phoneGroup.position.set(baseX, currentAnimY + floatT * 4, 0);
      phoneGroup.rotation.set(finalPitch + floatT * 0.015, finalYaw + floatT * 0.03, finalRoll);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

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
      className={`relative w-full h-[330px] sm:h-[370px] lg:h-[560px] flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ filter: 'drop-shadow(0 22px 22px rgba(10, 25, 50, 0.22)) drop-shadow(0 6px 8px rgba(10, 25, 50, 0.12))' }}
      aria-label="Visualisasi 3D Interaktif iPhone 16 Pro Max DARADIK"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-44 h-76 sm:w-50 sm:h-86 rounded-[36px] border-2 border-white/20 bg-white/5 backdrop-blur-xs animate-pulse flex items-center justify-center">
            <span className="text-xs font-semibold text-white/70">Memuat Model 3D...</span>
          </div>
        </div>
      )}
    </div>
  );
};
