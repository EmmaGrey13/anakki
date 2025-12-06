// app/lib/gradients.ts

/**
 * 🎨 ANAKKI UNIFIED GRADIENT & COLOR SYSTEM
 * Consistent alien-futuristic palette across the entire app
 */

// ─────────────────────────────────────────────────────────────
// 🌈 Gradient Definitions
// ─────────────────────────────────────────────────────────────

export const Gradients = {
  // Ambient background glow (used in home, system)
  ambientGlow: {
    colors: ['#ffffff10', '#6ee7f910', '#4fa8e010'] as const,
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
  },

  // Metallic border (used in nakki input bar, featured cards)
  metallicBorder: {
    colors: ['#5c9edc', '#AEC7FF', '#e6f3ff', '#AEC7FF', '#5c9edc'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // User message bubble
  userBubble: {
    colors: ['rgba(100,140,200,0.22)', 'rgba(150,180,230,0.28)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Glass card overlay
  glassCard: {
    colors: ['rgba(15,20,40,0.65)', 'rgba(10,15,35,0.75)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Bottom fade (used in nakki)
  bottomFade: {
    colors: ['transparent', 'rgba(2,4,15,0.7)', 'rgba(1,2,10,0.95)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Glyph glow (pulsing indicator)
  glyphGlow: {
    colors: ['rgba(100,200,255,0.4)', 'rgba(120,220,255,0.2)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Active/selected state
  activeState: {
    colors: ['rgba(110,231,249,0.25)', 'rgba(79,168,224,0.15)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Destructive action
  destructive: {
    colors: ['rgba(255,100,100,0.22)', 'rgba(255,80,80,0.28)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Default border gradient
  defaultBorder: {
    colors: ['rgba(100,140,200,0.3)', 'rgba(80,120,180,0.25)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Disabled state
  disabled: {
    colors: ['rgba(100,100,100,0.3)', 'rgba(80,80,80,0.25)'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// ─────────────────────────────────────────────────────────────
// 🎨 Color Palette
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // Primary cyan-blue palette
  primary: {
    cyan: '#6ee7f9',
    blue: '#4fa8e0',
    lightBlue: '#AEC7FF',
    paleBlue: '#e6f3ff',
    deepBlue: '#5c9edc',
  },

  // Background layers
  background: {
    deepest: 'rgba(1,2,10,0.95)',
    deep: 'rgba(2,4,15,0.92)',
    base: 'rgba(5,7,20,0.96)',
    elevated: 'rgba(10,15,30,0.85)',
    glass: 'rgba(15,20,40,0.65)',
  },

  // Text hierarchy
  text: {
    primary: 'rgba(234,242,255,0.96)',
    secondary: 'rgba(225,235,255,0.88)',
    tertiary: 'rgba(200,220,255,0.7)',
    placeholder: 'rgba(200,220,255,0.5)',
    muted: 'rgba(180,200,230,0.45)',
  },

  // Accent colors
  accent: {
    glow: 'rgba(100,200,255,0.23)',
    glowBright: 'rgba(180,235,255,0.95)',
    shimmer: 'rgba(120,220,255,1)',
    ripple: 'rgba(180,235,255,0.6)',
  },

  // Semantic colors
  semantic: {
    success: 'rgba(100,255,150,0.85)',
    warning: 'rgba(255,200,100,0.85)',
    error: 'rgba(255,100,100,0.85)',
    info: 'rgba(100,200,255,0.85)',
  },

  // Overlay/modal
  overlay: {
    backdrop: 'rgba(0,0,0,0.85)',
    light: 'rgba(255,255,255,0.08)',
  },
};

// ─────────────────────────────────────────────────────────────
// 🌟 Shadow Presets
// ─────────────────────────────────────────────────────────────

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 18,
  },

  glow: {
    shadowColor: 'rgba(120,220,255,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
};

// ─────────────────────────────────────────────────────────────
// 📏 Spacing System
// ─────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ─────────────────────────────────────────────────────────────
// 📐 Border Radius System
// ─────────────────────────────────────────────────────────────

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  round: 999,
};