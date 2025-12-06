import React from 'react';
import { StyleSheet, View } from 'react-native';
import CosmicBackground from '../components/backgrounds/CosmicBackground'; // adjust path if in layout

export default function PagerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CosmicBackground noPadding>
      <View style={styles.container}>
        {children}
      </View>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // let cosmic gradient show through
  },
});