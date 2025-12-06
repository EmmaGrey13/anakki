import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function SystemLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020814' }}>
      <Slot />
    </View>
  );
}