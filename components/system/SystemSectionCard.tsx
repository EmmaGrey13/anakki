// components/system/SystemSectionCard.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { tileThemes } from '../../components/home/TileThemes';

type Category = 'you' | 'experience' | 'connections' | 'meta';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  intent?: string;
  category?: Category;
  isDestructive?: boolean;
};

export default function SystemSectionCard({
  icon,
  title,
  subtitle,
  intent,
  category = 'you',
  isDestructive = false,
}: Props) {
  const router = useRouter();

  const aura = useRef(new Animated.Value(0.08)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const themeMap = {
    you: tileThemes.core,
    experience: tileThemes.five,
    connections: tileThemes.six,
    meta: tileThemes.seven,
  } as const;

  const theme = isDestructive
    ? { text: '#ff6b6b', edge: '#ff6b6b', glow: '#ff6b6b' }
    : themeMap[category];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 0.16,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0.08,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const triggerRipple = () => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.25);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePress = () => {
    triggerRipple();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (intent) {
      setTimeout(() => {
        router.push(`/system/${intent}` as any);
      }, 150);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >

        {/* ✨ Glass Background */}
        <View style={styles.glassBackground} />

        {/* ✨ Rim */}
        <View
          style={[
            styles.rimOuter,
            { borderColor: theme.edge + '40' },
          ]}
        />

        {/* ✨ Ambient Glow Pulsing */}
        <Animated.View
          style={[
            styles.ambientGlow,
            { backgroundColor: theme.glow, opacity: aura },
          ]}
        />

        {/* ✨ Static Diagonal Reflection (correct version) */}
        <View style={styles.staticReflectionContainer}>
          <AnimatedLinearGradient />
        </View>

        {/* ✨ Ripple Effect */}
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

        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: theme.glow + '12' }]}>
          <View style={[styles.iconGlow, { backgroundColor: theme.glow + '25' }]} />
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={theme.text}
            style={{ zIndex: 1 }}
          />
        </View>

        {/* Text */}
        <View style={styles.textWrapper}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ————————————————————————————————
   STATIC DIAGONAL GLASS REFLECTION COMPONENT
———————————————————————————————— */
function AnimatedLinearGradient() {
  return (
    <LinearGradient
      colors={[
        'rgba(255,255,255,0.06)',   // light streak
        'rgba(255,255,255,0.015)',  // softer fade
        'rgba(255,255,255,0)',      // transparent
      ]}
      start={{ x: -0.4, y: 0.1 }}
      end={{ x: 1.2, y: 1.2 }}
      style={{ flex: 1 }}
    />
  );
}

import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 20,
  },

  rimOuter: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 20,
  },

  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },

  staticReflectionContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22, // adjust 0.14–0.28
  },

  ripple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: '50%',
    left: '50%',
    marginLeft: -70,
    marginTop: -70,
    opacity: 0,
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    overflow: 'hidden',
  },

  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.18,
  },

  textWrapper: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 2,
  },

  subtitle: {
    color: 'rgba(200,220,255,0.65)',
    fontSize: 12.5,
    lineHeight: 16,
  },

  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});