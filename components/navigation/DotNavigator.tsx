import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface DotNavigatorProps {
  count: number;
  activeIndex: number;
}

export default function DotNavigator({ count, activeIndex }: DotNavigatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => {

        const isActive = i === activeIndex;

        return (
          <View key={`dot-${i}`} style={[styles.dotWrapper]}>
            <Animated.View
              style={[
                styles.dotBase,
                {
                  // No scaling — keep size identical
                  transform: [{ scale: 1 }],
                  opacity: isActive ? 1 : 0.45,
                },
              ]}
            >
              {/* Outer Rim */}
              <View
                style={[
                  styles.rim,
                  {
                    borderColor: isActive
                      ? 'rgba(255,255,255,0.58)' // PURE soft white rim
                      : 'rgba(140,180,255,0.35)', // original faint blue rim
                  },
                ]}
              />

              {/* Inner Body (same for active + inactive) */}
              <View style={styles.innerBody} />
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 10;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 31,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },

  dotWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  dotBase: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DOT_SIZE,
    borderWidth: 1, // **same thin line thickness**
  },

  innerBody: {
    ...StyleSheet.absoluteFillObject,
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: DOT_SIZE,
    backgroundColor: 'rgba(255,255,255,0.08)', // same soft inner glow as inactive
  },
});