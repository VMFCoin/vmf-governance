'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { confettiVariants } from '@/lib/animations';

interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  delay: number;
}

interface AdvancedConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

export default function AdvancedConfetti({
  isActive,
  duration = 3000,
  particleCount = 50,
  colors = defaultColors,
  onComplete,
}: AdvancedConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate particles
      const newParticles: ConfettiParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: `particle-${i}-${Date.now()}`,
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: ['circle', 'square', 'triangle'][
            Math.floor(Math.random() * 3)
          ] as 'circle' | 'square' | 'triangle',
          size: Math.random() * 8 + 4,
          delay: Math.random() * 0.5,
        });
      }

      setParticles(newParticles);

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isActive, duration, particleCount, colors, onComplete]);

  const getShapeElement = (particle: ConfettiParticle) => {
    const baseClasses = 'absolute';
    const style = {
      backgroundColor: particle.color,
      width: particle.size,
      height: particle.size,
    };

    switch (particle.shape) {
      case 'circle':
        return <div className={`${baseClasses} rounded-full`} style={style} />;
      case 'square':
        return <div className={baseClasses} style={style} />;
      case 'triangle':
        return (
          <div
            className={baseClasses}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid ${particle.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute"
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              y: [
                particle.y,
                particle.y - 200,
                particle.y - 400,
                particle.y - 600,
              ],
              x: [
                particle.x,
                particle.x + (Math.random() - 0.5) * 100,
                particle.x + (Math.random() - 0.5) * 200,
                particle.x + (Math.random() - 0.5) * 300,
              ],
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0.5],
              rotate: [0, 180, 360, 540],
            }}
            transition={{
              duration: duration / 1000,
              delay: particle.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              times: [0, 0.1, 0.8, 1],
            }}
            exit={{
              opacity: 0,
              scale: 0,
              transition: { duration: 0.2 },
            }}
          >
            {getShapeElement(particle)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing confetti state
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
  };

  const stop = () => {
    setIsActive(false);
  };

  const handleComplete = () => {
    setIsActive(false);
  };

  return {
    isActive,
    trigger,
    stop,
    handleComplete,
  };
}
