// app/lib/animations.ts
import { Animated, Easing as RNEasing } from 'react-native';

/* ────────────────────────────────────────────────────────────────
   Timing Durations
───────────────────────────────────────────────────────────────── */
export const Timing = {
  instant: 150,
  quick: 300,
  standard: 600,
  slow: 1200,
  glacial: 2400,
};

/* ────────────────────────────────────────────────────────────────
   Easing Presets
───────────────────────────────────────────────────────────────── */
export const Easing = {
  standard: RNEasing.inOut(RNEasing.ease),
  bounce: RNEasing.out(RNEasing.back(1.5)),
  smooth: RNEasing.out(RNEasing.quad),
  linear: RNEasing.linear,
  elastic: RNEasing.elastic(1),
  spring: RNEasing.out(RNEasing.back(0.8)),
};

/* ────────────────────────────────────────────────────────────────
   Parallax Ranges
───────────────────────────────────────────────────────────────── */
export const Parallax = {
  subtle: { input: [-60, 0, 60], output: [-12, 0, 12] },
  medium: { input: [-80, 0, 80], output: [-20, 0, 20] },
  strong: { input: [-100, 0, 100], output: [-30, 0, 30] },
};

/* ────────────────────────────────────────────────────────────────
   Spring Configurations
───────────────────────────────────────────────────────────────── */
export const Springs = {
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
};

/* ────────────────────────────────────────────────────────────────
   ⭐ createShimmerAnimation
   → Used by HomePage to animate the ambient glow
───────────────────────────────────────────────────────────────── */
export function createShimmerAnimation(animatedValue: Animated.Value) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: Timing.glacial,
        easing: Easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: Timing.glacial,
        easing: Easing.standard,
        useNativeDriver: true,
      }),
    ])
  );
}

/* ────────────────────────────────────────────────────────────────
   ⭐ createScrollInterpolations
   → Returns values HomePage expects: shimmerOpacity, headerTranslate
───────────────────────────────────────────────────────────────── */
export function createScrollInterpolations(scrollY: Animated.Value) {
  return {
    shimmerOpacity: scrollY.interpolate({
      inputRange: [0, 50, 120],
      outputRange: [1, 0.6, 0.2],
      extrapolate: 'clamp',
    }),

    headerTranslate: scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [0, -60],
      extrapolate: 'clamp',
    }),
  };
}