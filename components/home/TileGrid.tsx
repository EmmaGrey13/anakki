// components/home/TileGrid.tsx
import React from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import TileGlass from '../../components/home/TileGlass';
import { tileThemes } from '../../components/home/TileThemes';

const { width } = Dimensions.get('window');
const tileSize = width / 4.1;

const tiles = [
  { label: 'Sleep', theme: tileThemes.seven, },
  { label: 'Meditate', theme: tileThemes.seven },
  { label: 'Moon', theme: tileThemes.seven },
  { label: 'Alarm', theme: tileThemes.six },
  { label: 'Schedule', theme: tileThemes.six },
  { label: 'Cycle', theme: tileThemes.six },
  { label: 'Fast', theme: tileThemes.five },
  { label: 'Vision', theme: tileThemes.five },
  { label: 'Circadian', theme: tileThemes.five },
  { label: 'Neuro', theme: tileThemes.four },
  { label: 'ANAKKI', theme: tileThemes.core },
  { label: 'Bio', theme: tileThemes.four },
  { label: 'Hydrate', theme: tileThemes.three },
  { label: 'Meal', theme: tileThemes.three },
  { label: 'Photo', theme: tileThemes.three },
  { label: 'Strength', theme: tileThemes.two },
  { label: 'Steps', theme: tileThemes.two },
  { label: 'Measure', theme: tileThemes.two },
  { label: 'Journal', theme: tileThemes.one },
  { label: 'Recipes', theme: tileThemes.one },
  { label: 'Groceries', theme: tileThemes.one },
];

export default function TileGrid() {
  return (
    <FlatList
      data={tiles}
      keyExtractor={(item, index) => `${item.label}-${index}`}
      numColumns={3}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.tileWrapper}>
          <TileGlass
            label={item.label}
            theme={item.theme}
          />
        </View>
      )}
      contentContainerStyle={styles.grid}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  tileWrapper: {
    width: tileSize,
    height: tileSize,
    margin: 6,
  },
});