// app/(pages)/main.tsx
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import DotNavigator from '../../components/navigation/DotNavigator';
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
  const [dotIndex, setDotIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const basePages = [
    { key: 'dashboard', element: <DashboardScreen /> },
    { key: 'nakki', element: <NakkiScreen /> },
    { key: 'home', element: <HomeScreen /> },
    { key: 'vibe', element: <VibeScreen /> },
    { key: 'system', element: <SystemScreen /> },
  ];

  const loopingPages = [
    { key: 'buffer-head', element: <SystemScreen /> },
    { key: 'dashboard', element: <DashboardScreen /> },
    { key: 'nakki', element: <NakkiScreen /> },
    { key: 'home', element: <HomeScreen /> },
    { key: 'vibe', element: <VibeScreen /> },
    { key: 'system', element: <SystemScreen /> },
    { key: 'buffer-tail', element: <DashboardScreen /> },
  ];

  const INITIAL_PAGE = 1;

  const handlePageScroll = (e: any) => {
    const { position, offset } = e.nativeEvent;
    const raw = position + offset;
    scrollX.setValue(raw);

    let index = position - INITIAL_PAGE;
    if (offset > 0.5) index = index + 1;
    const normalized = ((index % basePages.length) + basePages.length) % basePages.length;
    setDotIndex(normalized);
  };

  const handlePageSelected = (e: any) => {
    const pos = e.nativeEvent.position;
    if (pos === 0) {
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(basePages.length);
      });
    } else if (pos === basePages.length + 1) {
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
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
      >
        {loopingPages.map((page) => (
          <View key={page.key} style={styles.pageWrapper}>
            {page.element}
          </View>
        ))}
      </PagerView>

      <DotNavigator
        count={basePages.length}
        activeIndex={dotIndex}
      />

      {isNakkiActive && (
        <View style={styles.overlay}>
        </View>
      )}
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
    backgroundColor: 'rgba(2,3,10,0.8)',
  },
});