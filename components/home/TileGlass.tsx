import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface TileProps {
  label: string;
  theme: { glow: string; edge: string; text: string };
  isCenter?: boolean;
  useMetallicBorder?: boolean;
}

export default function TileGlass({
  label,
  theme,
  isCenter,
  useMetallicBorder = false,
}: TileProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.12)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const size = isCenter ? 115 : 100;

  // ✨ Aura breathing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.20,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.12,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowOpacity]);

  // ✨ Highlight shimmer rotation
  const rotate = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    Animated.loop(
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, [highlightAnim]);

  // ✨ Ripple effect
  const triggerRipple = () => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.3);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
    triggerRipple();
  };
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  // 🎨 Per-theme metallic gradient
  const metallicColors: [string, string, string, string, string] = [
    theme.edge,
    theme.text,
    '#e6f3ff',
    theme.text,
    theme.edge,
  ];

  // ⭐ THE TILE CORE — unchanged interior tile (your original design)
  const TileCore = (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.tile,
        {
          backgroundColor: useMetallicBorder
            ? 'rgba(255,255,255,0.02)' // darker interior for metallic
            : 'rgba(255,255,255,0.05)', // original for non-metallic
        },
      ]}
    >
      {/* Inner Rim */}
      <View style={[styles.innerRim, { borderColor: theme.edge }]} />

      {/* Inner Border */}
      <View pointerEvents="none" style={[styles.rim, { borderColor: theme.edge }]} />

      {/* Ambient Glow */}
      <Animated.View
        style={[
          styles.innerGlow,
          { backgroundColor: theme.glow, opacity: glowOpacity },
        ]}
      />

      {/* Ripple */}
      <Animated.View
        style={[
          styles.ripple,
          {
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
            backgroundColor: theme.text,
          },
        ]}
      />

      {/* Rotating Highlight */}
      <Animated.View
        style={[styles.highlightWrapper, { transform: [{ rotate }] }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.glassHighlight,
            {
              opacity: useMetallicBorder ? 0.06 : 0.12, // reduced for metallic tiles
            },
          ]}
        />
      </Animated.View>

      {/* Label */}
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );

  // ⭐ FINAL RENDER — metallic wrapper or normal tile
  return (
    <Animated.View
      style={[
        styles.shadowWrapper,
        {
          width: size,
          height: size,
          shadowColor: theme.glow,
          transform: [{ scale }],
        },
      ]}
    >
      {useMetallicBorder ? (
        <LinearGradient
          colors={metallicColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.metallicBorder}
        >
          <View style={styles.metallicInner}>

            {/* NEW: Darkened opaque backdrop to prevent washout */}
            <View style={styles.solidBackground} />

            {TileCore}
          </View>
        </LinearGradient>
      ) : (
        TileCore
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    marginHorizontal: 6,
    borderRadius: 24,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },

  metallicBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 2,
  },

  metallicInner: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },

  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,15,0.94)', // deeper cosmic tone
  },

  tile: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  innerRim: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.52,
  },

  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.1,
    borderRadius: 22,
  },

  innerGlow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 16,
  },

  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0,
  },

  highlightWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  glassHighlight: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },

  label: {
    fontSize: 14,
    letterSpacing: 0.6,
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});