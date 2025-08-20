// Advanced Animation Hooks for Relife Smart Alarm
// Powerful hooks for creating smooth, delightful animations

import { useAnimation, useMotionValue, useTransform, useSpring, useInView, useScroll } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

// ================================================================
// ANIMATION CONFIGURATIONS
// ================================================================

export const animationPresets = {
  // Spring configurations
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  bouncy: { type: "spring" as const, stiffness: 200, damping: 10 },
  snappy: { type: "spring" as const, stiffness: 300, damping: 30 },
  smooth: { type: "spring" as const, stiffness: 100, damping: 25 },
  elastic: { type: "spring" as const, stiffness: 400, damping: 8 },

  // Timing configurations
  fast: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },

  // Easing curves
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  backOut: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
  anticipate: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number]
};

// ================================================================
// ENTRANCE ANIMATIONS
// ================================================================

export const useEntranceAnimation = (
  delay: number = 0,
  direction: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' = 'up',
  distance: number = 50
) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = useMemo(() => {
    const directionMaps = {
      up: { y: distance, x: 0 },
      down: { y: -distance, x: 0 },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
      scale: { scale: 0.8, x: 0, y: 0 },
      fade: { x: 0, y: 0 }
    };

    return {
      hidden: {
        opacity: 0,
        ...directionMaps[direction]
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: {
          ...animationPresets.gentle,
          delay
        }
      }
    };
  }, [delay, direction, distance]);

  return {
    ref,
    variants,
    initial: "hidden",
    animate: isInView ? "visible" : "hidden"
  };
};

// ================================================================
// HOVER ANIMATIONS
// ================================================================

export const useHoverAnimation = (config: {
  scale?: number;
  y?: number;
  rotate?: number;
  glow?: boolean;
  lift?: boolean;
}) => {
  const {
    scale = 1.02,
    y = -2,
    rotate = 0,
    glow = false,
    lift = true
  } = config;

  const hoverVariants = {
    initial: {
      scale: 1,
      y: 0,
      rotate: 0,
      boxShadow: glow
        ? "0 4px 20px rgba(0, 0, 0, 0.1)"
        : "0 4px 20px rgba(0, 0, 0, 0.1)"
    },
    hover: {
      scale,
      y: lift ? y : 0,
      rotate,
      boxShadow: glow
        ? "0 20px 40px rgba(59, 130, 246, 0.2)"
        : "0 20px 40px rgba(0, 0, 0, 0.15)",
      transition: animationPresets.gentle
    }
  };

  return hoverVariants;
};

// ================================================================
// STAGGER ANIMATIONS
// ================================================================

export const useStaggerChildren = (delayBetweenChildren: number = 0.1) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delayBetweenChildren,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: animationPresets.gentle
    }
  };

  return { containerVariants, itemVariants };
};

// ================================================================
// SCROLL ANIMATIONS
// ================================================================

export const useScrollAnimation = (
  threshold: number = 0.3,
  triggerOnce: boolean = true
) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: threshold,
    once: triggerOnce,
    margin: "-10% 0px -10% 0px"
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return {
    ref,
    isInView,
    hasAnimated,
    shouldAnimate: triggerOnce ? hasAnimated : isInView
  };
};

export const useParallaxScroll = (offset: number = 50) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return { ref, y };
};

// ================================================================
// MOUSE TRACKING ANIMATIONS
// ================================================================

export const useMouseTracking = (
  strength: number = 1,
  damping: number = 0.1
) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: damping * 100, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7.5, -7.5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7.5, 7.5]), springConfig);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      mouseX.set(x * strength);
      mouseY.set(y * strength);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY, strength]);

  return {
    ref,
    rotateX,
    rotateY,
    style: {
      rotateX,
      rotateY,
      transformStyle: "preserve-3d" as const
    }
  };
};

// ================================================================
// TYPING ANIMATIONS
// ================================================================

export const useTypingAnimation = (
  text: string,
  speed: number = 50,
  startDelay: number = 0
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (startDelay > 0) {
      const delayTimeout = setTimeout(() => {
        setCurrentIndex(0);
      }, startDelay);
      return () => clearTimeout(delayTimeout);
    }
  }, [startDelay]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed, isComplete]);

  const restart = () => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  };

  return {
    displayedText,
    isComplete,
    restart,
    progress: text.length > 0 ? currentIndex / text.length : 0
  };
};

// ================================================================
// COUNTER ANIMATIONS
// ================================================================

export const useCounterAnimation = (
  target: number,
  duration: number = 2000,
  startDelay: number = 0,
  easing: (t: number) => number = (t: number) => t * t * (3 - 2 * t) // smoothstep
) => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const animate = (timestamp: number) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    setCurrent(Math.round(target * easedProgress));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
    }
  };

  const start = () => {
    setIsAnimating(true);
    startTimeRef.current = 0;

    const delayedStart = () => {
      animationRef.current = requestAnimationFrame(animate);
    };

    if (startDelay > 0) {
      setTimeout(delayedStart, startDelay);
    } else {
      delayedStart();
    }
  };

  const reset = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCurrent(0);
    setIsAnimating(false);
    startTimeRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    current,
    isAnimating,
    start,
    reset,
    progress: target > 0 ? current / target : 0
  };
};

// ================================================================
// GESTURE ANIMATIONS
// ================================================================

export const useGestureAnimation = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const gestureVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: animationPresets.gentle
    },
    hover: {
      scale: 1.02,
      transition: animationPresets.gentle
    },
    press: {
      scale: 0.95,
      transition: animationPresets.fast
    },
    drag: {
      scale: 1.05,
      rotate: 5,
      transition: animationPresets.gentle
    }
  };

  const getVariant = () => {
    if (isDragging) return 'drag';
    if (isPressing) return 'press';
    return 'idle';
  };

  return {
    variants: gestureVariants,
    animate: getVariant(),
    whileHover: 'hover',
    whileTap: 'press',
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    onTapStart: () => setIsPressing(true),
    onTap: () => setIsPressing(false)
  };
};

// ================================================================
// NOTIFICATION ANIMATIONS
// ================================================================

export const useNotificationAnimation = () => {
  const slideVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
      scale: 0.8
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      x: '100%',
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };

  const stackVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return { slideVariants, stackVariants };
};

// ================================================================
// LOADING ANIMATIONS
// ================================================================

export const useLoadingAnimation = (isLoading: boolean) => {
  const loadingVariants = {
    loading: {
      opacity: 0.7,
      pointerEvents: 'none' as const,
      transition: animationPresets.fast
    },
    loaded: {
      opacity: 1,
      pointerEvents: 'auto' as const,
      transition: animationPresets.normal
    }
  };

  const spinnerVariants = {
    spin: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return {
    contentVariants: loadingVariants,
    spinnerVariants,
    pulseVariants,
    animate: isLoading ? 'loading' : 'loaded'
  };
};

// ================================================================
// COMBINED ANIMATION UTILITIES
// ================================================================

export const useAnimationSequence = (
  animations: Array<{
    duration: number;
    delay?: number;
    animation: any;
  }>
) => {
  const controls = useAnimation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSequence = async () => {
    setIsPlaying(true);

    for (let i = 0; i < animations.length; i++) {
      setCurrentStep(i);
      const { animation, delay = 0 } = animations[i];

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await controls.start(animation);
    }

    setIsPlaying(false);
    setCurrentStep(0);
  };

  const stopSequence = () => {
    controls.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return {
    controls,
    currentStep,
    isPlaying,
    playSequence,
    stopSequence
  };
};

export default {
  useEntranceAnimation,
  useHoverAnimation,
  useStaggerChildren,
  useScrollAnimation,
  useParallaxScroll,
  useMouseTracking,
  useTypingAnimation,
  useCounterAnimation,
  useGestureAnimation,
  useNotificationAnimation,
  useLoadingAnimation,
  useAnimationSequence,
  animationPresets
};