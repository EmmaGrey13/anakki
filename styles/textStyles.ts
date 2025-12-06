// app/styles/TextStyles.ts
import { StyleSheet } from 'react-native';

export const TextStyles = StyleSheet.create({
  // Headings
  h1: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  h2: {
    color: 'rgba(230,240,255,0.95)',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  h3: {
    color: 'rgba(200,220,255,0.9)',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  // Body text
  body: {
    color: 'rgba(230,240,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
  },
  bodyMuted: {
    color: 'rgba(180,210,245,0.7)',
    fontSize: 15,
    lineHeight: 20,
  },

  // Labels / Kickers
  label: {
    color: 'rgba(180,220,255,0.7)',
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
});