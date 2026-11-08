import React, { useEffect, useRef, useState } from 'react';

export interface ScrollRevealOnceProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export const ScrollRevealOnce: React.FC<ScrollRevealOnceProps> = ({
  children,
  className = '',
  delayMs = 0,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Disconnect after first intersection so elements never re-animate on scroll up.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        animationDelay: `${delayMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
      className={`scroll-reveal-once ${
        isVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'
      } ${className}`}
    >
      {children}
    </div>
  );
};
