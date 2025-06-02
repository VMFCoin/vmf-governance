import { Variants } from 'framer-motion';

// Spring configurations for different animation types
export const springConfigs = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 1,
  },
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    mass: 1.2,
  },
} as const;

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springConfigs.gentle,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

// Stagger container variants
export const staggerContainer: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Fade in variants
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// Slide up variants
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    z: 0,
  },
  hover: {
    scale: 1.02,
    rotateX: 5,
    rotateY: 5,
    z: 50,
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Modal variants
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

// Toast variants
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    x: 300,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springConfigs.bouncy,
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// Vote chart animation variants
export const chartVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  enter: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.5,
        ease: 'easeInOut',
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
};

// Number counting animation
export const numberCountVariants = {
  initial: { scale: 1 },
  update: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// Button press variants
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Form step variants
export const stepVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2,
    },
  },
};

// Confetti particle variants
export const confettiVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    y: 0,
  },
  animate: {
    opacity: [0, 1, 1, 0],
    scale: [0, 1, 1, 0.8],
    y: [0, -100, -200, -300],
    x: [-20, 20, -10, 30],
    rotate: [0, 180, 360, 540],
    transition: {
      duration: 3,
      ease: 'easeOut',
      times: [0, 0.1, 0.8, 1],
    },
  },
};

// Skeleton pulse variants
export const skeletonVariants: Variants = {
  initial: {
    opacity: 0.6,
  },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Tooltip variants
export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Utility function to check if animations should be reduced
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// PHASE 10.1 ENHANCEMENTS - New Animation Variants

// Enhanced proposal type selection variants
export const proposalTypeContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,
    },
  },
};

export const proposalTypeCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  selected: {
    scale: 1.02,
    boxShadow: '0 0 30px rgba(178, 34, 52, 0.4)',
    borderColor: 'rgba(178, 34, 52, 0.8)',
    transition: springConfigs.bouncy,
  },
  unselected: {
    scale: 1,
    boxShadow: '0 0 0px rgba(178, 34, 52, 0)',
    borderColor: 'rgba(27, 41, 81, 0.3)',
    transition: springConfigs.gentle,
  },
};

// Enhanced step indicator variants
export const stepContainerVariants: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const stepItemVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  enter: {
    scale: 1,
    opacity: 1,
    transition: springConfigs.bouncy,
  },
  active: {
    scale: 1.1,
    backgroundColor: '#B22234',
    color: '#FFFFFF',
    transition: springConfigs.snappy,
  },
  completed: {
    scale: 1,
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    transition: springConfigs.gentle,
  },
  inactive: {
    scale: 1,
    backgroundColor: 'rgba(27, 41, 81, 0.3)',
    color: 'rgba(248, 249, 250, 0.6)',
    transition: springConfigs.gentle,
  },
};

export const progressBarVariants: Variants = {
  initial: {
    scaleX: 0,
  },
  animate: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: 'easeInOut',
    },
  },
};

// Enhanced voting interaction variants
export const votingButtonVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 0 0px rgba(178, 34, 52, 0)',
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 0 20px rgba(178, 34, 52, 0.3)',
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
  loading: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: ['#B22234', '#22C55E', '#B22234'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

export const voteCountVariants: Variants = {
  initial: {
    scale: 1,
  },
  update: {
    scale: [1, 1.2, 1],
    color: ['#F8F9FA', '#FFD700', '#F8F9FA'],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

export const loadingSpinnerVariants: Variants = {
  initial: {
    rotate: 0,
    opacity: 0,
  },
  animate: {
    rotate: 360,
    opacity: 1,
    transition: {
      rotate: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Enhanced proposal card variants
export const enhancedCardVariants: Variants = {
  initial: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    z: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    rotateX: 2,
    rotateY: 2,
    z: 50,
    boxShadow: '0 20px 40px rgba(178, 34, 52, 0.15)',
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
  active: {
    scale: 1,
    boxShadow: [
      '0 4px 20px rgba(0, 0, 0, 0.1)',
      '0 8px 30px rgba(178, 34, 52, 0.2)',
      '0 4px 20px rgba(0, 0, 0, 0.1)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const cardGradientOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// Form validation error variants
export const formErrorVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    height: 0,
  },
  enter: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
  shake: {
    x: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// Success celebration variants
export const celebrationVariants: Variants = {
  initial: {
    scale: 0,
    rotate: 0,
  },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Utility function to get animation variants based on user preference
export const getAnimationVariants = (variants: Variants) => {
  if (shouldReduceMotion()) {
    // Return simplified variants for reduced motion
    return {
      initial: { opacity: 0 },
      enter: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    };
  }
  return variants;
};
