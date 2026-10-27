import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Star } from 'lucide-react';

interface Hero3DSceneProps {
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({
  variant = 'desktop',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Desktop interactive mouse-tilt parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || variant === 'mobile' || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 to 1
      const y = (e.clientY - rect.top) / rect.height; // 0 to 1

      // Subtle tilt: max 8 degrees on Y, -7 degrees on X
      const targetY = (x - 0.5) * 16;
      const targetX = (y - 0.5) * -14;

      setRotateY(targetY);
      setRotateX(targetX);
    },
    [prefersReducedMotion, variant]
  );

  const handleMouseEnter = () => {
    if (!prefersReducedMotion && variant === 'desktop') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const isMobile = variant === 'mobile';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hero-3d-stage relative select-none ${
        isMobile
          ? 'w-full aspect-[16/9] max-h-[175px] sm:max-h-[220px] rounded-2xl'
          : 'w-full aspect-[4/3] max-h-[440px] rounded-3xl'
      } ${className}`}
      style={{
        perspective: isMobile ? '800px' : '1200px'
      }}
    >
      {/* 3D Tilting Card Container */}
      <div
        className={`hero-3d-card w-full h-full relative overflow-hidden shadow-xl border border-emerald-200/90 bg-gradient-to-tr from-emerald-50 via-white to-amber-50/40 ${
          isMobile ? 'rounded-2xl' : 'rounded-3xl'
        } ${!isHovered && !prefersReducedMotion ? 'hero-3d-ambient-drift' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          transform:
            isHovered && !prefersReducedMotion
              ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
              : undefined,
          transition: isHovered
            ? 'transform 0.15s cubic-bezier(0.2, 0, 0.38, 0.9)'
            : 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Layer 0: Volumetric 3D Ambient Light Flare (Atmospheric Living Room Window Sunbeam) */}
        <div
          className="absolute -top-10 -left-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-emerald-300/25 via-amber-200/20 to-transparent blur-2xl pointer-events-none"
          style={{
            transform: 'translateZ(-20px)',
            willChange: 'transform'
          }}
          aria-hidden="true"
        />

        {/* Layer 1: The Artisan Scene Visual Canvas */}
        <div
          className="w-full h-full relative"
          style={{
            transform: 'translateZ(0px)',
            willChange: 'transform'
          }}
        >
          <img
            src="/hero-illustration.jpg"
            alt="UrbanCare verified local technicians - certified Sikh artisan with turban, electricians, and plumbers serving Kharar and Mohali, Punjab"
            className={`w-full h-full object-cover select-none ${
              isMobile ? 'object-[center_15%]' : 'object-center'
            }`}
            width={1200}
            height={896}
            loading="eager"
            decoding="async"
          />

          {/* Layer 2: Subtle Cinematic Lighting Sweep Overlay (Occurs every 7s) */}
          <div
            className="hero-3d-sheen absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              transform: 'translateZ(15px)'
            }}
          />

          {/* Depth Vignette Overlay to maintain contrast */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none"
            aria-hidden="true"
            style={{
              transform: 'translateZ(20px)'
            }}
          />
        </div>

        {/* Layer 3: Stereoscopic Floating Trust Badges (Elevated on Z-Axis for Parallax) */}
        {isMobile ? (
          /* Mobile Compact Micro Badges (Corner anchored, zero face/tool obstruction) */
          <>
            <div
              className="absolute top-2 left-2 bg-white/95 backdrop-blur-md border border-emerald-200/90 text-[#0D3B2E] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center space-x-1"
              style={{
                transform: 'translateZ(35px)',
                willChange: 'transform'
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Verified Artisans</span>
            </div>

            <div
              className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md border border-gray-200/90 text-gray-800 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-2xs flex items-center space-x-1"
              style={{
                transform: 'translateZ(40px)',
                willChange: 'transform'
              }}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-[#0D3B2E] shrink-0" />
              <span>₹0 Advance</span>
            </div>

            <div
              className="absolute bottom-2 right-2 bg-[#0D3B2E]/95 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center space-x-1"
              style={{
                transform: 'translateZ(45px)',
                willChange: 'transform'
              }}
            >
              <Star className="w-2.5 h-2.5 fill-[#F79324] text-[#F79324] shrink-0" />
              <span>4.9 (500+ Jobs)</span>
            </div>
          </>
        ) : (
          /* Desktop Wide Hero 3D Elevated Badges */
          <>
            <div
              className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-emerald-200 text-[#0D3B2E] text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center space-x-2 transition-transform duration-200"
              style={{
                transform: isHovered
                  ? `translateZ(50px) translate3d(${(rotateY * 0.4).toFixed(1)}px, ${(rotateX * -0.4).toFixed(1)}px, 0)`
                  : 'translateZ(40px)',
                willChange: 'transform'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verified Local Artisans</span>
            </div>

            <div
              className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-200 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center space-x-1.5 transition-transform duration-200"
              style={{
                transform: isHovered
                  ? `translateZ(55px) translate3d(${(rotateY * 0.35).toFixed(1)}px, ${(rotateX * -0.35).toFixed(1)}px, 0)`
                  : 'translateZ(45px)',
                willChange: 'transform'
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E]" />
              <span>₹0 Advance • 30-Day Warranty</span>
            </div>

            <div
              className="absolute bottom-4 right-4 bg-[#0D3B2E]/95 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center space-x-1.5 transition-transform duration-200"
              style={{
                transform: isHovered
                  ? `translateZ(60px) translate3d(${(rotateY * 0.5).toFixed(1)}px, ${(rotateX * -0.5).toFixed(1)}px, 0)`
                  : 'translateZ(50px)',
                willChange: 'transform'
              }}
            >
              <Star className="w-3.5 h-3.5 fill-[#F79324] text-[#F79324]" />
              <span>4.9 (500+ Local Reviews)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
