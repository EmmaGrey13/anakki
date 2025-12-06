// constants/IconMap.ts
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Central icon map for ALL Anakki sections.
 * This allows every screen (Nakki, DrawerPanel, System, etc.)
 * to load icons from a single, clean source.
 */

export const IconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  // ─────────────────────────────
  // CORE 5 PAGES
  // ─────────────────────────────
  dashboard: "view-dashboard-outline",
  nakki: "robot-happy-outline",
  home: "home-outline",
  vibe: "chart-bubble",
  system: "cog-outline",

  // ─────────────────────────────
  // DRAWER PANEL
  // ─────────────────────────────
  journal: "notebook-outline",
  feed: "rss",
  messages: "email-outline",
  bookmarks: "bookmark-outline",
  profile: "account-circle-outline",

  // ─────────────────────────────
  // SYSTEM SECTIONS
  // ─────────────────────────────
  account: "account-circle-outline",
  ascension: "trophy-outline",
  themes: "palette-outline",
  notifications: "bell-outline",
  coaching: "account-tie",
  devices: "watch-variant",
  integrations: "link-variant",
  privacy: "shield-check-outline",
  support: "headset",
  labs: "flask-outline",
  logout: "power-standby",

  // ─────────────────────────────
  // NAKKI INLINE ICON USE
  // ─────────────────────────────
  insight: "lightbulb-on-outline",
  sparkle: "star-four-points-outline",
  beam: "ray-start-vertex-end",
  heart: "heart-outline",

  // ─────────────────────────────
  // VIBE SCREEN
  // ─────────────────────────────
  search: "magnify",
  create: "plus-circle-outline",
  filter: "filter-variant",

  // ─────────────────────────────
  // HOME PAGE SECTIONS
  // ─────────────────────────────
  fuel: "food-variant",
  mind: "brain",
  body: "arm-flex",
  sleep: "sleep",
  breathwork: "weather-windy",

  // ─────────────────────────────
  // UNIVERSAL UTILITY
  // ─────────────────────────────
  back: "chevron-left",
  forward: "chevron-right",
  settings: "cog-outline",
};