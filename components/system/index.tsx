import { StyleSheet, Text, View } from 'react-native';

export default function SystemLanding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Overview</Text>
      <Text style={styles.subtitle}>
        Welcome to your Control Center. Choose a section to begin customizing your experience.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020814',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(200,220,255,0.6)',
    textAlign: 'center',
  },
});