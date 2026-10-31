import React, { useEffect, useRef, useState } from 'react';

interface IntroSplashScreenProps {
  onFinish: () => void;
}

interface StrokeStep {
  id: string;
  clipId: string;
  clipPoints: string;
  d: string;
  strokeWidth: number;
  start: number;
  end: number;
}

/**
 * Exact sequential stroke segments that trace the centerline of `/logo-daradik.png` (883x212)
 * in one continuous left-to-right writing flow: d -> a -> r -> a -> d -> i -> k.
 */
const DARADIK_WRITE_STEPS: StrokeStep[] = [
  // 1. 'd' vertical stem (top down to the 45-deg cut x + y = 257)
  {
    id: 'd1-stem',
    clipId: 'clip-d1-stem',
    clipPoints: '110,0 152,0 152,105 110,147',
    d: 'M 130.5 12 L 130.5 126',
    strokeWidth: 46,
    start: 0.0,
    end: 0.075,
  },
  // 2. 'd' circular bowl (counter-clockwise from top-right around left to bottom)
  {
    id: 'd1-bowl',
    clipId: 'clip-d1-bowl',
    clipPoints: '0,60 112,60 112,145 78,179 148,179 148,212 0,212',
    d: 'M 122 96 A 51 51 0 1 0 84 185',
    strokeWidth: 48,
    start: 0.065,
    end: 0.19,
  },
  // 3. 'd-a' diagonal bridge + 'a' top arch + 'a' right stem
  {
    id: 'd1-a1-bridge',
    clipId: 'clip-d1-a1-bridge',
    clipPoints:
      '76,212 76,178 110,145 157,98 157,60 305,60 305,212 261,212 261,124 197,124 151,170 151,212',
    d: 'M 78 185 C 94 185 104 179 115 168 L 194 95 A 51 51 0 0 1 280.5 134 L 280.5 200',
    strokeWidth: 48,
    start: 0.18,
    end: 0.34,
  },
  // 4. 'a' bottom-left bowl (continues from bottom of 'a' stem around to diagonal cut x + y = 321)
  {
    id: 'a1-bowl',
    clipId: 'clip-a1-bowl',
    clipPoints: '150,212 150,169 196,123 263,123 263,212',
    d: 'M 272 168 A 51 51 0 0 1 182 138',
    strokeWidth: 50,
    start: 0.33,
    end: 0.41,
  },
  // 5. 'r' vertical stem (bottom to top)
  {
    id: 'r-stem',
    clipId: 'clip-r-stem',
    clipPoints: '310,60 356,60 356,212 310,212',
    d: 'M 336.5 200 L 336.5 68',
    strokeWidth: 46,
    start: 0.41,
    end: 0.475,
  },
  // 6. 'r' top-right shoulder curve
  {
    id: 'r-arch',
    clipId: 'clip-r-arch',
    clipPoints: '354,60 412,60 412,96 385,120 354,120',
    d: 'M 338 104 A 50 50 0 0 1 404 83',
    strokeWidth: 48,
    start: 0.465,
    end: 0.515,
  },
  // 7. Second 'a' arch & left bowl (starting at diagonal cut x + y = 641, counter-clockwise to bottom)
  {
    id: 'a2-bowl',
    clipId: 'clip-a2-bowl',
    clipPoints: '385,120 412,95 412,60 541,60 541,100 494,147 464,177 498,177 498,212 385,212',
    d: 'M 514 114 A 51 51 0 1 0 472 185',
    strokeWidth: 48,
    start: 0.515,
    end: 0.63,
  },
  // 8a. Second 'a' lower-right terminal foot
  {
    id: 'a2-foot',
    clipId: 'clip-a2-foot',
    clipPoints: '495,164 542,164 542,212 495,212',
    d: 'M 514 164 L 520 202',
    strokeWidth: 46,
    start: 0.62,
    end: 0.655,
  },
  // 8b. 'a-d' diagonal bridge + second 'd' top arch
  {
    id: 'a2-d2-bridge',
    clipId: 'clip-a2-d2-bridge',
    clipPoints:
      '462,212 462,176 494,145 541,98 541,60 643,60 643,124 581,124 535,170 535,212',
    d: 'M 464 185 C 480 185 489 179 499 168 L 577 95 A 51 51 0 0 1 650 106',
    strokeWidth: 48,
    start: 0.62,
    end: 0.74,
  },
  // 9. Second 'd' tall stem + right & bottom bowl (down stem and clockwise around bottom bowl to cut x + y = 705)
  {
    id: 'd2-stem-bowl',
    clipId: 'clip-d2-stem-bowl',
    clipPoints: '541,212 541,164 580,123 641,123 641,0 685,0 685,212',
    d: 'M 661 12 L 661 134 A 51 51 0 0 1 564 138',
    strokeWidth: 50,
    start: 0.73,
    end: 0.845,
  },
  // 10. 'i' vertical stem + dot
  {
    id: 'i-stem',
    clipId: 'clip-i-stem',
    clipPoints: '695,62 745,62 745,212 695,212',
    d: 'M 720 68 L 720 200',
    strokeWidth: 46,
    start: 0.845,
    end: 0.89,
  },
  {
    id: 'i-dot',
    clipId: 'clip-i-dot',
    clipPoints: '695,0 745,0 745,60 695,60',
    d: 'M 720 8 L 720 54',
    strokeWidth: 50,
    start: 0.885,
    end: 0.915,
  },
  // 11. 'k' tall vertical stem
  {
    id: 'k-stem',
    clipId: 'clip-k-stem',
    clipPoints: '755,0 800,0 800,212 755,212',
    d: 'M 778.5 12 L 778.5 200',
    strokeWidth: 46,
    start: 0.91,
    end: 0.955,
  },
  // 12. 'k' diagonal arms (top-right arm into center joint and out to bottom-right leg)
  {
    id: 'k-arms',
    clipId: 'clip-k-arms',
    clipPoints: '796,60 883,60 883,212 796,212',
    d: 'M 866 70 L 792 134 L 866 196',
    strokeWidth: 48,
    start: 0.95,
    end: 1.0,
  },
];

function clamp01(val: number): number {
  if (val <= 0) return 0;
  if (val >= 1) return 1;
  return val;
}

/**
 * Smooth ease-in-out curve so the single line starts gently, flows steadily, and settles smoothly.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({
  onFinish,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const hasFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let fadeTimer = 0;
    let finishTimer = 0;
    let fallbackTimer = 0;

    const safeFinish = () => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      onFinishRef.current();
    };

    // Garansi mutlak: Layar intro tidak akan pernah stuck lebih dari 2.8 detik
    fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !hasFinishedRef.current) {
        setIsFadingOut(true);
        window.setTimeout(() => safeFinish(), 400);
      }
    }, 2800);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setProgress(1);
      fadeTimer = window.setTimeout(() => {
        if (!cancelled) setIsFadingOut(true);
      }, 200);
      finishTimer = window.setTimeout(() => {
        if (!cancelled) safeFinish();
      }, 550);
      return () => {
        cancelled = true;
        window.clearTimeout(fadeTimer);
        window.clearTimeout(finishTimer);
        window.clearTimeout(fallbackTimer);
      };
    }

    const writeDuration = 1850; // ms for the continuous stroke-writing animation
    const startTime = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const rawT = clamp01(elapsed / writeDuration);
      const easedT = easeInOutCubic(rawT);
      setProgress(easedT);

      if (rawT < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        fadeTimer = window.setTimeout(() => {
          if (!cancelled) setIsFadingOut(true);
        }, 220);
        finishTimer = window.setTimeout(() => {
          if (!cancelled) safeFinish();
        }, 720);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const handleSkip = () => {
    if (!hasFinishedRef.current) {
      hasFinishedRef.current = true;
      setIsFadingOut(true);
      window.setTimeout(() => onFinishRef.current(), 250);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] select-none transition-opacity duration-500 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Memuat DARADIK"
      role="status"
    >
      {/* Subtle Ambient Background Accent Matching Website Theme */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(201, 223, 220, 0.35) 0%, rgba(250, 248, 245, 0) 65%)',
        }}
      />

      {/* Center Animated DARADIK Wordmark */}
      <div
        className={`relative px-8 w-full max-w-[320px] sm:max-w-[440px] md:max-w-[520px] transition-transform duration-500 ease-out ${
          isFadingOut ? 'scale-[1.03]' : 'scale-100'
        }`}
      >
        <svg
          viewBox="0 0 883 212"
          className="w-full h-auto overflow-visible block"
          aria-hidden="true"
        >
          <defs>
            {DARADIK_WRITE_STEPS.map((step) => (
              <clipPath key={step.clipId} id={step.clipId}>
                <polygon points={step.clipPoints} />
              </clipPath>
            ))}

            <mask
              id="daradik-write-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="883"
              height="212"
            >
              <rect x="0" y="0" width="883" height="212" fill="black" />
              {DARADIK_WRITE_STEPS.map((step) => {
                const segProg = clamp01(
                  (progress - step.start) / (step.end - step.start)
                );
                if (segProg <= 0) return null;

                return (
                  <g key={step.id} clipPath={`url(#${step.clipId})`}>
                    <path
                      d={step.d}
                      fill="none"
                      stroke="white"
                      strokeWidth={step.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - segProg}
                    />
                  </g>
                );
              })}
              {/* Ensure 100% solid reveal on completion */}
              {progress >= 0.995 && (
                <rect x="0" y="0" width="883" height="212" fill="white" />
              )}
            </mask>
          </defs>

          {/* Faint Guide Track Silhouette Underneath */}
          <image
            href="/logo-daradik.png"
            width="883"
            height="212"
            opacity="0.08"
          />

          {/* Active Continuous Stroke-Written Logo */}
          <image
            href="/logo-daradik.png"
            width="883"
            height="212"
            mask="url(#daradik-write-mask)"
          />
        </svg>
      </div>
    </div>
  );
};
