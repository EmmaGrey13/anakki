// app/(tabs)/home.tsx
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/backgrounds/CosmicBackground';
import TileGrid from '../../components/home/TileGrid';
import {
  createScrollInterpolations,
  createShimmerAnimation,
} from '../../lib/animations';

const { width } = Dimensions.get('window');
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    createShimmerAnimation(shimmerAnim).start();
  }, []);

  const scrollInterpolations = createScrollInterpolations(scrollY);

  return (
    <CosmicBackground>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <AnimatedScrollView
        style={{ flex: 1 }}
        bounces
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate={0.998} // Add this - makes it snap back quicker
        alwaysBounceVertical={false} // Add this to disable zoom bounce
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 10,
          paddingHorizontal: 0,
        }}
      >
        <Animated.View
          style={{
            transform: [{ translateY: scrollInterpolations.headerTranslate }],
          }}
        >
          <TileGrid />
        </Animated.View>
      </AnimatedScrollView>
    </CosmicBackground>
  );
}