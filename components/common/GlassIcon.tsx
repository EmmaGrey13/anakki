// components/common/GlassIcon.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

// 🔥 Exported so any screen can match wrapper height perfectly
export const ICON_WRAPPER_SIZE = 38;

type Props = {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function GlassIcon({
  name,
  size = 20,
  color = '#FFFFFF',
  onPress,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.94,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.wrapper}
        hitSlop={10}
      >
        {/* Glow */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.32],
              }),
            },
          ]}
        />

        {/* Rim */}
        <Animated.View
          style={[
            styles.rim,
            {
              borderColor: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  'rgba(120,160,255,0.18)',
                  'rgba(120,160,255,0.45)',
                ],
              }),
            },
          ]}
        />

        {/* Inner Frost */}
        <Animated.View
          style={[
            styles.inner,
            {
              backgroundColor: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  'rgba(20,26,45,0.12)',
                  'rgba(20,26,45,0.32)',
                ],
              }),
            },
          ]}
        />

        <MaterialCommunityIcons name={name} size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    borderRadius: ICON_WRAPPER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: ICON_WRAPPER_SIZE / 2,
  },

  inner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ICON_WRAPPER_SIZE / 2,
  },

  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120,160,255,1)',
    borderRadius: ICON_WRAPPER_SIZE / 2,
  },
});