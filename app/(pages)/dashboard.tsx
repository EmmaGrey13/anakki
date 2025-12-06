// app/(pages)/dashboard.tsx
import React, { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/backgrounds/CosmicBackground';
import { Colors } from '../../lib/gradients';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const uniformInset = Math.max(insets.top, insets.bottom);

  const widgetTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [-20, 0, 20],
    extrapolate: 'clamp',
  });

  return (
    <CosmicBackground>
      <View style={styles.wrapper}>
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
          {/* Top row */}
          <Animated.View 
            style={[
              styles.row,
              { transform: [{ translateY: widgetTranslate }] }
            ]}
          >
            <View style={[styles.widgetHalf, styles.rightSpacer]} />
            <View style={styles.widgetHalf} />
          </Animated.View>

          {/* Full width widget */}
          <View style={styles.fullWidthWidget} />
        </AnimatedScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },
  container: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  widgetHalf: {
    flex: 1,
    height: 140,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rightSpacer: {
    marginRight: 16,
  },
  fullWidthWidget: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});