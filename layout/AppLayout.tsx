import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, View } from 'react-native';
import DrawerPanel from '../components/nakki/DrawerPanel';
import { DrawerContext } from './DrawerContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 600, // slower slide
      easing: Easing.out(Easing.quad), // gentle ease-out
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 600, // slower slide back
      easing: Easing.in(Easing.quad), // gentle ease-in
      useNativeDriver: true,
    }).start(() => setDrawerVisible(false));
  };

  return (
    <DrawerContext.Provider value={{ openDrawer }}>
      <View style={styles.container}>
        {children}

        {drawerVisible && (
          <Animated.View style={[styles.overlay, { opacity: drawerAnim }]}>
            <Pressable style={styles.backdrop} onPress={closeDrawer} />
            <Animated.View
              style={[
                styles.drawer,
                {
                  transform: [
                    {
                      translateX: drawerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-screenWidth, 0], // slide from left edge
                      }),
                    },
                  ],
                },
              ]}
            >
              <DrawerPanel onClose={closeDrawer} />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // cosmic background fills edge-to-edge
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 100,
  },
  backdrop: { flex: 1 },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0, // full width
    backgroundColor: 'rgba(10,15,30,1)',
  },
});