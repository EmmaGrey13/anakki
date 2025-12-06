// app/(pages)/vibe.tsx
import React, { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/backgrounds/CosmicBackground';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function VibeScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [-60, 0, 60],
    outputRange: [-8, 0, 8],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  return (
    <CosmicBackground>
      <AnimatedScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 10,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >

        {/* Placeholder cards */}
        <View style={styles.contentContainer}>
          <View style={styles.placeholderCard} />
          <View style={styles.placeholderCard} />
          <View style={styles.placeholderCard} />
        </View>
      </AnimatedScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
  },
  contentContainer: {
    // gap is not supported in all RN versions, so use marginBottom instead
  },
  placeholderCard: {
    height: 120,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
});