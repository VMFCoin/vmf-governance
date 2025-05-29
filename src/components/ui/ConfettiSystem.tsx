'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
  };
  rotationSpeed: number;
}

interface ConfettiSystemProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const defaultColors = [
  '#dc2626', // patriotRed
  '#ffffff', // patriotWhite
  '#1e3a8a', // patriotBlue
  '#fbbf24', // starGold
  '#10b981', // green
  '#f59e0b', // amber
];

export default function ConfettiSystem({
  isActive,
  duration = 3000,
  particleCount = 50,
  colors = defaultColors,
  onComplete,
}: ConfettiSystemProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const createConfettiPiece = useCallback(
    (index: number): ConfettiPiece => {
      const angle = (Math.PI * 2 * index) / particleCount;
      const velocity = 15 + Math.random() * 15;

      return {
        id: `confetti-${index}-${Date.now()}`,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - Math.random() * 10,
        },
        rotationSpeed: (Math.random() - 0.5) * 720,
      };
    },
    [particleCount, colors]
  );

  const generateConfetti = useCallback(() => {
    const newConfetti = Array.from({ length: particleCount }, (_, i) =>
      createConfettiPiece(i)
    );
    setConfetti(newConfetti);
  }, [particleCount, createConfettiPiece]);

  useEffect(() => {
    if (isActive) {
      generateConfetti();

      const timer = setTimeout(() => {
        setConfetti([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
    }
  }, [isActive, duration, generateConfetti, onComplete]);

  const confettiVariants = {
    initial: (piece: ConfettiPiece) => ({
      x: piece.x,
      y: piece.y,
      rotate: piece.rotation,
      scale: 0,
      opacity: 1,
    }),
    animate: (piece: ConfettiPiece) => ({
      x: piece.x + piece.velocity.x * 3,
      y: piece.y + piece.velocity.y * 3 + 500, // gravity effect
      rotate: piece.rotation + piece.rotationSpeed,
      scale: [0, 1, 1, 0.8],
      opacity: [1, 1, 0.8, 0],
      transition: {
        duration: duration / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.1, 0.8, 1],
      },
    }),
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {confetti.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
            }}
            variants={confettiVariants}
            custom={piece}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Burst confetti effect
interface BurstConfettiProps {
  isActive: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

export function BurstConfetti({
  isActive,
  origin = { x: 0.5, y: 0.5 },
  particleCount = 30,
  colors = defaultColors,
  onComplete,
}: BurstConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const createBurstPiece = useCallback(
    (index: number): ConfettiPiece => {
      const angle =
        (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5) * 0.5;
      const velocity = 10 + Math.random() * 20;

      return {
        id: `burst-${index}-${Date.now()}`,
        x: window.innerWidth * origin.x,
        y: window.innerHeight * origin.y,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
        },
        rotationSpeed: (Math.random() - 0.5) * 1080,
      };
    },
    [particleCount, colors, origin]
  );

  useEffect(() => {
    if (isActive) {
      const newConfetti = Array.from({ length: particleCount }, (_, i) =>
        createBurstPiece(i)
      );
      setConfetti(newConfetti);

      const timer = setTimeout(() => {
        setConfetti([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, particleCount, createBurstPiece, onComplete]);

  const burstVariants = {
    initial: (piece: ConfettiPiece) => ({
      x: piece.x,
      y: piece.y,
      rotate: piece.rotation,
      scale: 0,
      opacity: 1,
    }),
    animate: (piece: ConfettiPiece) => ({
      x: piece.x + piece.velocity.x * 4,
      y: piece.y + piece.velocity.y * 2 + 300,
      rotate: piece.rotation + piece.rotationSpeed,
      scale: [0, 1.2, 1, 0],
      opacity: [1, 1, 0.6, 0],
      transition: {
        duration: 2,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.2, 0.8, 1],
      },
    }),
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {confetti.map(piece => (
          <motion.div
            key={piece.id}
            className="absolute rounded-sm"
            style={{
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
            }}
            variants={burstVariants}
            custom={piece}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Fireworks confetti effect
interface FireworksConfettiProps {
  isActive: boolean;
  duration?: number;
  burstCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

export function FireworksConfetti({
  isActive,
  duration = 4000,
  burstCount = 5,
  colors = defaultColors,
  onComplete,
}: FireworksConfettiProps) {
  const [activeBursts, setActiveBursts] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      const bursts: number[] = [];

      for (let i = 0; i < burstCount; i++) {
        const delay = (i * duration) / burstCount + Math.random() * 500;

        const timer = setTimeout(() => {
          setActiveBursts(prev => [...prev, i]);

          // Remove burst after animation
          setTimeout(() => {
            setActiveBursts(prev => prev.filter(id => id !== i));
          }, 2000);
        }, delay);

        bursts.push(timer as any);
      }

      const completeTimer = setTimeout(() => {
        setActiveBursts([]);
        onComplete?.();
      }, duration + 2000);

      return () => {
        bursts.forEach(clearTimeout);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive, duration, burstCount, onComplete]);

  return (
    <>
      {activeBursts.map(burstId => (
        <BurstConfetti
          key={burstId}
          isActive={true}
          origin={{
            x: 0.2 + Math.random() * 0.6,
            y: 0.2 + Math.random() * 0.4,
          }}
          particleCount={20 + Math.random() * 20}
          colors={colors}
        />
      ))}
    </>
  );
}
