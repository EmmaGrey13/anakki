// app/components/backgrounds/CosmicBackground.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

type CosmicBackgroundProps = {
  children: React.ReactNode;
};

export default function CosmicBackground({ children }: CosmicBackgroundProps) {
  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020814',
  },
  content: {
    flex: 1,
  },
});