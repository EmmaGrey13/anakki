import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppLayout from '../../layout/AppLayout';
import { ConversationProvider } from '../../layout/ConversationContext';

export default function PagesLayout() {
  return (
    <ConversationProvider>
      <AppLayout>
        <View style={styles.container}>
          <StatusBar translucent backgroundColor="transparent" style="light" />
          <Slot />
        </View>
      </AppLayout>
    </ConversationProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
});