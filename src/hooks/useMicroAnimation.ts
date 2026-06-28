// src/hooks/useMicroAnimation.ts
import { useMemo } from 'react';

/**
 * Custom hook to generate Framer Motion animation props for micro-interactions.
 * Provides consistent hover, tap, and transition effects.
 *
 * @param options - Configuration for the animations.
 * @param options.hoverScale - Scale factor on hover.
 * @param options.tapScale - Scale factor on tap.
 * @param options.duration - Duration of the transition.
 * @param options.type - Type of transition (e.g., 'spring', 'tween').
 * @param options.stiffness - Stiffness for spring transitions.
 * @param options.damping - Damping for spring transitions.
 * @returns An object containing `whileHover`, `whileTap`, and `transition` props for Framer Motion.
 */
export const useMicroAnimation = (options: {
  hoverScale?: number;
  tapScale?: number;
  duration?: number;
  type?: 'spring' | 'tween';
  stiffness?: number;
  damping?: number;
} = {}) => {
  const {
    hoverScale = 1.02, // Default slight scale up on hover
    tapScale = 0.97,   // Default slight scale down on tap
    duration = 0.2,
    type = 'spring',
    stiffness = 400,
    damping = 17,
  } = options;

  const animationProps = useMemo(() => ({
    whileHover: { scale: hoverScale },
    whileTap: { scale: tapScale },
    transition: {
      type,
      duration,
      stiffness,
      damping,
    },
  }), [hoverScale, tapScale, duration, type, stiffness, damping]);

  return animationProps;
};
