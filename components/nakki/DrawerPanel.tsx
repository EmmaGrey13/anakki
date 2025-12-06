// components/nakki/DrawerPanel.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversations } from '../../../anakki/layout/ConversationContext';
import GlassIcon from '../../components/common/GlassIcon';
import { tileThemes } from '../../components/home/TileThemes';
import { Colors } from '../../lib/gradients';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Project = {
  id: string;
  title: string;
  createdAt: number;
  conversationIds?: string[];
};

type DrawerPanelProps = {
  onClose: () => void;
};

type GroupedConversations = {
  [key: string]: any[];
};

export default function DrawerPanel({ onClose }: DrawerPanelProps) {
  const insets = useSafeAreaInsets();
  const {
    conversations,
    startNewConversation,
    setActiveConversation,
    activeConversationId,
    renameConversation,
    deleteConversation,
    isLoading: isLoadingConversations,
  } = useConversations();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingConversationText, setEditingConversationText] = useState('');

  const [ready, setReady] = useState(false);

  const isLoading = isLoadingProjects || isLoadingConversations;

  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => {
        setReady(true);
      });
    }
  }, [isLoading]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const stored = await AsyncStorage.getItem('@anakki_projects');
      if (stored) setProjects(JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (!isLoadingProjects) saveProjects();
  }, [projects, isLoadingProjects]);

  const saveProjects = async () => {
    try {
      await AsyncStorage.setItem('@anakki_projects', JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  };

  const triggerHaptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'light') => {
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(map[style]);
  }, []);

  const addProject = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    triggerHaptic('medium');
    const newProject: Project = {
      id: Date.now().toString(),
      title: `Project ${projects.length + 1}`,
      createdAt: Date.now(),
      conversationIds: [],
    };
    setProjects((prev) => [...prev, newProject]);
  }, [projects.length, triggerHaptic]);

  const deleteProject = useCallback(
    (projectId: string) => {
      Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            triggerHaptic('heavy');
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
            setContextMenuId(null);
          },
        },
      ]);
    },
    [triggerHaptic]
  );

  const startEditingProject = useCallback(
    (project: Project) => {
      setEditingProjectId(project.id);
      setEditingText(project.title);
      setContextMenuId(null);
      triggerHaptic('light');
    },
    [triggerHaptic]
  );

  const saveProjectEdit = useCallback(() => {
    if (editingText.trim()) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProjectId ? { ...p, title: editingText.trim() } : p))
      );
      triggerHaptic('medium');
    }
    setEditingProjectId(null);
    setEditingText('');
  }, [editingText, editingProjectId, triggerHaptic]);

  const handleNewConversation = useCallback(() => {
    triggerHaptic('medium');
    startNewConversation();
    onClose();
  }, [startNewConversation, onClose, triggerHaptic]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      triggerHaptic('light');
      setActiveConversation(id);
      setContextMenuId(null);
      onClose();
    },
    [setActiveConversation, onClose, triggerHaptic]
  );

  const startEditingConversation = useCallback(
    (id: string, preview: string) => {
      setEditingConversationId(id);
      setEditingConversationText(preview);
      setContextMenuId(null);
      triggerHaptic('light');
    },
    [triggerHaptic]
  );

  const saveConversationEdit = useCallback(() => {
    if (editingConversationText.trim() && editingConversationId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      renameConversation(editingConversationId, editingConversationText.trim());
      triggerHaptic('medium');
    }
    setEditingConversationId(null);
    setEditingConversationText('');
  }, [editingConversationText, editingConversationId, renameConversation, triggerHaptic]);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      Alert.alert('Delete Conversation', 'This conversation will be permanently deleted.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            triggerHaptic('heavy');
            deleteConversation(id);
            setContextMenuId(null);
          },
        },
      ]);
    },
    [deleteConversation, triggerHaptic]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      if (conv.customName?.toLowerCase().includes(q)) return true;
      if (Array.isArray(conv.messages) && conv.messages.length > 0) {
        return conv.messages.some(
          (msg: any) =>
            msg?.content &&
            typeof msg.content === 'string' &&
            msg.content.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: GroupedConversations = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    };

    filteredConversations.forEach((conv) => {
      const timestamp = conv.createdAt || conv.timestamp || Date.now();
      const date = new Date(timestamp);

      if (date >= today) groups.Today.push(conv);
      else if (date >= yesterday) groups.Yesterday.push(conv);
      else if (date >= lastWeek) groups['Last 7 Days'].push(conv);
      else groups.Older.push(conv);
    });

    return groups;
  }, [filteredConversations]);

  const renderContextMenu = (id: string, type: 'conversation' | 'project', preview?: string) => {
    if (contextMenuId !== id) return null;

    return (
      <View style={styles.contextMenu}>
        <Pressable
          onPress={() => {
            if (type === 'project') {
              const project = projects.find((p) => p.id === id);
              if (project) startEditingProject(project);
            } else {
              startEditingConversation(id, preview || 'New Conversation');
            }
          }}
          style={styles.contextMenuItem}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={16}
            color={tileThemes.five.edge}
          />
          <Text style={styles.contextMenuText}>Rename</Text>
        </Pressable>

        <View style={styles.contextMenuDivider} />

        <Pressable
          onPress={() => {
            if (type === 'conversation') handleDeleteConversation(id);
            else deleteProject(id);
          }}
          style={styles.contextMenuItem}
        >
          <MaterialCommunityIcons name="delete" size={16} color="#FF6B6B" />
          <Text style={[styles.contextMenuText, { color: '#FF6B6B' }]}>Delete</Text>
        </Pressable>
      </View>
    );
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <LinearGradient
            colors={[tileThemes.six.glow, tileThemes.six.edge, tileThemes.six.glow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.skeletonLine}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <GlassIcon
        name="chevron-right"
        size={24}
        onPress={() => {
          triggerHaptic('light');
          onClose();
        }}
        style={{
          position: 'absolute',
          top: insets.top + 13,
          right: 20,
          zIndex: 10,
        }}
      />

      <View style={[styles.headerRow, { top: insets.top + 12 }]}>
        <View style={styles.logoDot}>
          <View style={styles.logoPlaceholder} />
        </View>
        <Text style={styles.headerTitle}>Anakki</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.panelContent,
          { paddingTop: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBorder}>
          <View style={styles.searchOuter}>
            <View style={styles.searchRow}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={`${tileThemes.six.text}E6`}
              />
              <TextInput
                placeholder="Search conversations…"
                placeholderTextColor={`${tileThemes.six.text}66`}
                style={styles.search}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    setSearchQuery('');
                  }}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={`${tileThemes.six.text}99`}
                  />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleNewConversation}
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="message-plus-outline"
            size={20}
            color={tileThemes.core.text}
          />
          <Text style={styles.navText}>New Conversation</Text>
          {conversations.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversations.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
          onPress={() => triggerHaptic('light')}
        >
          <MaterialCommunityIcons
            name="book-outline"
            size={20}
            color={tileThemes.core.text}
          />
          <Text style={styles.navText}>Library</Text>
        </Pressable>

        <Pressable
          onPress={addProject}
          style={({ pressed }) => [
            styles.navRow,
            pressed && styles.navRowPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="folder-plus-outline"
            size={20}
            color={tileThemes.core.text}
          />
          <Text style={styles.navText}>Add Project</Text>
          {projects.length > 0 && (
            <View style={[styles.badge, styles.badgeSecondary]}>
              <Text style={styles.badgeText}>{projects.length}</Text>
            </View>
          )}
        </Pressable>

        {projects.length > 0 && (
          <>
            {projects.map((p) => (
              <React.Fragment key={p.id}>
                <View style={styles.projectContainer}>
                  {editingProjectId === p.id ? (
                    <View style={styles.editRow}>
                      <MaterialCommunityIcons
                        name="folder-outline"
                        size={20}
                        color={tileThemes.core.text}
                      />
                      <TextInput
                        style={styles.editInput}
                        value={editingText}
                        onChangeText={setEditingText}
                        onBlur={saveProjectEdit}
                        onSubmitEditing={saveProjectEdit}
                        autoFocus
                        selectTextOnFocus
                      />
                      <Pressable onPress={saveProjectEdit} hitSlop={8}>
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color={tileThemes.five.edge}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.navRow,
                        pressed && styles.navRowPressed,
                      ]}
                      onPress={() => triggerHaptic('light')}
                    >
                      <MaterialCommunityIcons
                        name="folder-outline"
                        size={20}
                        color={tileThemes.core.text}
                      />
                      <Text style={styles.navText}>{p.title}</Text>
                      <Pressable
                        onPress={() => {
                          triggerHaptic('light');
                          setContextMenuId(contextMenuId === p.id ? null : p.id);
                        }}
                        style={styles.moreButton}
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons
                          name="dots-vertical"
                          size={20}
                          color="rgba(240,245,255,0.7)"
                        />
                      </Pressable>
                    </Pressable>
                  )}
                  {renderContextMenu(p.id, 'project')}
                </View>
              </React.Fragment>
            ))}
          </>
        )}

        {!ready ? (
          renderLoadingSkeleton()
        ) : (
          Object.entries(groupedConversations).map(([label, items]) => {
            if (items.length === 0) return null;

            return (
              <View key={label}>
                {label === "Today" && <View style={{ height: 39 }} />}

                <Text style={styles.subHeader}>{label}</Text>

                {items.map((conv) => {
                  let preview = conv.customName || 'New Conversation';

                  if (!conv.customName) {
                    try {
                      const firstMsg = Array.isArray(conv.messages)
                        ? conv.messages[0]
                        : null;

                      if (firstMsg?.content && typeof firstMsg.content === 'string') {
                        preview = firstMsg.content.slice(0, 40);
                      }
                    } catch (error) {
                      console.warn('Error extracting conversation preview:', error);
                    }
                  }

                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingConversationId === conv.id;

                  return (
                    <View key={conv.id} style={styles.conversationContainer}>
                      {isEditing ? (
                        <View style={styles.editRow}>
                          <MaterialCommunityIcons
                            name="message-outline"
                            size={20}
                            color={tileThemes.core.text}
                          />
                          <TextInput
                            style={styles.editInput}
                            value={editingConversationText}
                            onChangeText={setEditingConversationText}
                            onBlur={saveConversationEdit}
                            onSubmitEditing={saveConversationEdit}
                            autoFocus
                            selectTextOnFocus
                            placeholder="Conversation name..."
                            placeholderTextColor="rgba(200,220,255,0.4)"
                          />
                          <Pressable onPress={saveConversationEdit} hitSlop={8}>
                            <MaterialCommunityIcons
                              name="check"
                              size={20}
                              color={tileThemes.five.edge}
                            />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => handleSelectConversation(conv.id)}
                          style={({ pressed }) => [
                            styles.threadRow,
                            isActive && styles.threadRowActive,
                            pressed && styles.threadRowPressed,
                          ]}
                          accessible={true}
                          accessibilityLabel={`Conversation: ${preview}`}
                          accessibilityRole="button"
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.threadText,
                                isActive && styles.threadTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {preview}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => {
                              triggerHaptic('light');
                              setContextMenuId(
                                contextMenuId === conv.id ? null : conv.id
                              );
                            }}
                            style={styles.moreButton}
                            hitSlop={8}
                          >
                            <MaterialCommunityIcons
                              name="dots-vertical"
                              size={20}
                              color="rgba(240,245,255,0.7)"
                            />
                          </Pressable>
                        </Pressable>
                      )}
                      {renderContextMenu(conv.id, 'conversation', preview)}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {ready && filteredConversations.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={48}
              color="rgba(200,220,255,0.3)"
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start a new conversation to get started'}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.base,
  },

  panelContent: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  headerRow: {
    position: 'absolute',
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },

  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tileThemes.core.edge,
    shadowColor: tileThemes.core.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(130,207,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  searchBorder: {
    borderRadius: 14,
    padding: 1.6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(110,140,200,0.18)',
    backgroundColor: 'rgba(10,14,28,0.65)',
    overflow: 'hidden',
  },

  searchOuter: {
    backgroundColor: 'rgba(15,20,35,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.4,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  search: {
    flex: 1,
    color: tileThemes.six.text,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  navRowPressed: {
    backgroundColor: 'rgba(12,18,36,0.9)',
    transform: [{ scale: 0.98 }],
  },

  navText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.95)',
  },

  subtleSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(31, 37, 63, 0.65)',
    marginLeft: 48,
  },

  badge: {
    backgroundColor: 'rgba(140,180,255,0.12)',
    borderColor: 'rgba(160,200,255,0.22)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeSecondary: {
    backgroundColor: 'rgba(90, 170, 200, 0.12)',
  },

  badgeText: {
    color: 'rgba(220,235,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },

  projectContainer: {
    position: 'relative',
  },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 37, 63, 0.65)',
  },

  editInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    paddingVertical: 0,
  },

  conversationContainer: {
    position: 'relative',
    marginBottom: 4,
  },

  subHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(180,200,255,0.58)',
    marginTop: 28,
    marginBottom: 10,
  },

  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    gap: 12,
  },

  threadRowActive: {
    backgroundColor: 'rgba(12,18,36,0.85)',
  },

  threadRowPressed: {
    backgroundColor: 'rgba(12,18,36,0.65)',
    transform: [{ scale: 0.98 }],
  },

  threadText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: 'rgba(230,240,255,0.75)',
  },

  threadTextActive: {
    color: 'rgba(255,255,255,0.98)',
    fontWeight: '600',
  },

  moreButton: {
    padding: 4,
  },

  contextMenu: {
    position: 'absolute',
    right: 12,
    top: 48,
    backgroundColor: 'rgba(20,25,40,0.98)',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(110,231,249,0.2)',
    zIndex: 100,
  },

  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  contextMenuText: {
    fontSize: 15,
    color: 'rgba(240,245,255,0.95)',
    fontWeight: '500',
  },

  contextMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },

  skeletonContainer: {
    paddingVertical: 20,
    gap: 12,
  },

  skeletonItem: {
    paddingHorizontal: 0,
  },

  skeletonLine: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },

  emptyText: {
    fontSize: 17,
    color: 'rgba(200,220,255,0.7)',
    fontWeight: '600',
  },

  emptySubtext: {
    fontSize: 14,
    color: 'rgba(200,220,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});