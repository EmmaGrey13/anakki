// app/(pages)/system.tsx
import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from '../../components/backgrounds/CosmicBackground';
import SystemSectionCard from '../../components/system/SystemSectionCard';
import { TextStyles } from '../../styles/textStyles';

const AnimatedScrollView = Animated.createAnimatedComponent(Animated.ScrollView);

export default function SystemScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const glyphRippleScale = useRef(new Animated.Value(0)).current;
  const glyphRippleOpacity = useRef(new Animated.Value(0)).current;

  // Ripple animation
  const triggerGlyphRipple = () => {
    glyphRippleScale.setValue(0);
    glyphRippleOpacity.setValue(0.4);

    Animated.parallel([
      Animated.timing(glyphRippleScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glyphRippleOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Scroll effects
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
      {/* ✨ Reflection / Holographic Sheen */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 80, 200],
              outputRange: [0.08, 0.16, 0.08],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-120, 0, 120],
                  outputRange: [-20, 0, 20],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={{
            flex: 1,
            opacity: scrollY.interpolate({
              inputRange: [0, 100, 200],
              outputRange: [0.15, 0.3, 0.15],
            }),
            transform: [
              {
                scale: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [1, 1.04],
                }),
              },
            ],
          }}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255,255,255,0.025)',
                opacity: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0.1, 0.03],
                }),
              }}
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* ✅ MAIN CONTENT WRAPPER */}
      <View style={styles.wrapper}>
        <AnimatedScrollView
          style={{ flex: 1 }}
          bounces
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 17,
            paddingHorizontal: 20,
          }}
        >
          {/* HEADER */}
          <Animated.View
            style={[
              styles.headerRow,
              {
                transform: [{ translateY: headerTranslate }],
                opacity: headerOpacity,
              },
            ]}
          >
            <View>
              <Text style={TextStyles.label}>SYSTEM CORE</Text>
              <Text style={TextStyles.h1}>Control Center</Text>
            </View>
            <Pressable onPress={triggerGlyphRipple} style={styles.glyphContainer}>
              <View style={styles.glyphGlow} />
              <View style={styles.glyphDot} />
              <Animated.View
                style={[
                  styles.glyphRipple,
                  {
                    transform: [{ scale: glyphRippleScale }],
                    opacity: glyphRippleOpacity,
                  },
                ]}
              />
            </Pressable>
          </Animated.View>

          {/* YOU */}
          <View style={styles.sectionContainer}>
            <Text style={TextStyles.label}>You</Text>
            <View style={styles.labelSpacer} />
            <View style={styles.sectionGroup}>
              <SystemSectionCard
                icon="account-circle-outline"
                title="Profile & Identity"
                subtitle="Name, avatar, goals, and core preferences."
                intent="profile"
                category="you"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="trophy-outline"
                title="Ascension Path"
                subtitle="Streaks, milestones, and long-term progress."
                intent="ascension"
                category="you"
              />
            </View>
          </View>

          {/* EXPERIENCE */}
          <View style={styles.sectionContainer}>
            <Text style={TextStyles.label}>Experience</Text>
            <View style={styles.labelSpacer} />
            <View style={styles.sectionGroup}>
              <SystemSectionCard
                icon="palette-outline"
                title="Themes & Atmosphere"
                subtitle="Color, brightness, and motion sensitivity."
                intent="themes"
                category="experience"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="robot-happy-outline"
                title="Nakki Personality"
                subtitle="Tone, depth, and how proactive your AI feels."
                intent="nakki"
                category="experience"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="bell-outline"
                title="Signals & Notifications"
                subtitle="Reminders, pings, and daily briefings."
                intent="signals"
                category="experience"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="account-tie"
                title="Coaching & Programs"
                subtitle="Coaching and entrepreneurship portal."
                intent="coaching"
                category="experience"
              />
            </View>
          </View>

          {/* CONNECTIONS */}
          <View style={styles.sectionContainer}>
            <Text style={TextStyles.label}>Connections</Text>
            <View style={styles.labelSpacer} />
            <View style={styles.sectionGroup}>
              <SystemSectionCard
                icon="watch-variant"
                title="Devices & Biometrics"
                subtitle="Wearables, sensors, trackers, and more."
                intent="devices"
                category="connections"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="link-variant"
                title="Apps & Integrations"
                subtitle="Nutrition, training, calendar, and labs."
                intent="integrations"
                category="connections"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="shield-check-outline"
                title="Privacy & Data"
                subtitle="What's stored, what's synced, and where."
                intent="privacy"
                category="connections"
              />
            </View>
          </View>

          {/* META */}
          <View style={styles.sectionContainer}>
            <Text style={TextStyles.label}>Meta</Text>
            <View style={styles.labelSpacer} />
            <View style={styles.sectionGroup}>
              <SystemSectionCard
                icon="headset"
                title="Support & Feedback"
                subtitle="Ask for help or send ideas to evolve Anakki."
                intent="support"
                category="meta"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="flask-outline"
                title="Labs & Early Features"
                subtitle="Opt in to experimental abilities and UIs."
                intent="labs"
                category="meta"
              />
              <View style={styles.cardSpacer} />
              <SystemSectionCard
                icon="power-standby"
                title="Sign Out"
                subtitle="Securely log out of this device."
                intent="logout"
                category="meta"
                isDestructive
              />
            </View>
          </View>
        </AnimatedScrollView>
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
  },
  glyphContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glyphGlow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(100,200,255,0.25)',
    shadowColor: 'rgba(120,220,255,1)',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  glyphDot: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(180,235,255,0.96)',
    shadowColor: 'rgba(180,235,255,0.8)',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  glyphRipple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(180,235,255,0.5)',
  },
  // Spacing
  sectionContainer: {
    marginTop: 28,
  },
  labelSpacer: {
    height: 10,
  },
  sectionGroup: {},
  cardSpacer: {
    height: 10,
  },
});