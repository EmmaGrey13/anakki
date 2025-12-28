// app/(pages)/main.tsx
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useNakkiStore } from '../../store/useNakkiStore';
import DashboardScreen from './dashboard';
import HomeScreen from './home';
import NakkiScreen from './nakki';
import SystemScreen from './system';
import VibeScreen from './vibe';

const { width } = Dimensions.get('window');

export default function PagesLayout() {
  const pagerRef = useRef<PagerView>(null);
  const { isNakkiActive } = useNakkiStore();

  const basePages = [
    { key: 'dashboard', element: <DashboardScreen /> },
    { key: 'nakki', element: <NakkiScreen /> },
    { key: 'home', element: <HomeScreen /> },
    { key: 'vibe', element: <VibeScreen /> },
    { key: 'system', element: <SystemScreen /> },
  ];

  // Create infinite loop by adding buffer pages at start and end
  const loopingPages = [
    { key: 'buffer-head', element: <SystemScreen /> },
    ...basePages,
    { key: 'buffer-tail', element: <DashboardScreen /> },
  ];

  const INITIAL_PAGE = 1; // Start at first real page (after buffer)

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    
    // Trigger haptic feedback on page change
    Haptics.selectionAsync();
    
    // Handle infinite scroll wraparound
    if (position === 0) {
      // Jumped to buffer head, move to actual last page
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(basePages.length);
      });
    } else if (position === basePages.length + 1) {
      // Jumped to buffer tail, move to actual first page
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(INITIAL_PAGE);
      });
    }
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={INITIAL_PAGE}
        onPageSelected={handlePageSelected}
      >
        {loopingPages.map((page) => (
          <View key={page.key} style={styles.pageWrapper}>
            {page.element}
          </View>
        ))}
      </PagerView>

      {isNakkiActive && <View style={styles.overlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020814',
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 3, 10, 0.8)',
  },
});