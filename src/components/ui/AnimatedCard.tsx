'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  enableTilt?: boolean;
  tiltStrength?: number;
  enableGlow?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  className = '',
  enableTilt = true,
  tiltStrength = 10,
  enableGlow = true,
  glowColor = 'rgba(220, 38, 38, 0.3)',
  onClick,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring animations for smooth movement
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });

  // Transform mouse position to rotation values
  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [tiltStrength, -tiltStrength]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [-tiltStrength, tiltStrength]
  );

  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !enableTilt) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative bg-backgroundCard border border-patriotBlue/30 rounded-xl p-6 shadow-lg backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        enableGlow && 'hover:shadow-2xl',
        className
      )}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {/* Glow effect */}
      {enableGlow && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mouseXSpring}px ${mouseYSpring}px, ${glowColor}, transparent 40%)`,
          }}
          whileHover={{
            opacity: 1,
            transition: { duration: 0.3 },
          }}
        />
      )}

      {/* Subtle border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl border border-transparent opacity-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent, ${glowColor}, transparent)`,
          backgroundClip: 'padding-box',
        }}
        whileHover={{
          opacity: 0.5,
          transition: { duration: 0.3 },
        }}
      />

      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(50px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
