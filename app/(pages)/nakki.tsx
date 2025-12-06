// app/pages/nakki.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CosmicBackground from '../../components/backgrounds/CosmicBackground';
import GlassIcon, { ICON_WRAPPER_SIZE } from '../../components/common/GlassIcon';
import { tileThemes } from '../../components/home/TileThemes';
import TypingIndicator from '../../components/nakki/TypingIndicator';
import { useConversations } from '../../layout/ConversationContext';
import { useDrawer } from '../../layout/DrawerContext';
import { TextStyles } from '../../styles/textStyles';

const { width } = Dimensions.get('window');

// ChatGPT-style header height (without safe-area)
const TOP_PANEL_HEIGHT = 62;

// Bottom panel height (input bar + a little breathing room)
const BOTTOM_PANEL_HEIGHT = 70 + 16;

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  type?: 'text' | 'image';
  imageUri?: string | null;
};

export default function NakkiScreen() {
  const { openDrawer } = useDrawer();
  const { conversations, activeConversationId, addMessage } = useConversations();
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const insets = useSafeAreaInsets();

  // ----------------------
  // STATE + REFS
  // ----------------------
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const nakkiFade = useRef(new Animated.Value(0)).current;
  const voiceWave = useRef(new Animated.Value(0)).current;

  // ----------------------
  // KEYBOARD HANDLING
  // ----------------------
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height ?? 0;

      Animated.timing(keyboardHeight, {
        toValue: height,
        duration: e.duration ?? 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // layout animation
      }).start();
    };

    const onHide = (e: KeyboardEvent) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: e.duration ?? 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // layout animation
      }).start();
    };

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

  // ----------------------
  // VOICE PULSE
  // ----------------------
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(voiceWave, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(voiceWave, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      voiceWave.setValue(0);
    }
  }, [isVoiceActive, voiceWave]);

  // ----------------------
  // ANDROID LAYOUT ANIMATION
  // ----------------------
  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // ----------------------
  // HELPERS
  // ----------------------
  const triggerHaptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'light') => {
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(map[style]);
    },
    []
  );

  const handleMenuPress = useCallback(() => {
    triggerHaptic('light');
    openDrawer();
  }, [openDrawer, triggerHaptic]);

  const handleVoicePress = useCallback(() => {
    triggerHaptic('medium');
    setIsVoiceActive((prev) => !prev);
  }, [triggerHaptic]);

  const animateNextChange = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        150,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  }, []);

  // ----------------------
  // SEND MESSAGE
  // ----------------------
  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !activeConversationId) return;

    triggerHaptic('medium');
    animateNextChange();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      type: 'text',
    };

    addMessage(activeConversationId, userMsg);
    setIsStreaming(true);

    // fake Nakki reply
    setTimeout(() => {
      const nakkiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: 'Hello, my name is Nakki. How can I assist you today?',
        type: 'text',
      };

      addMessage(activeConversationId, nakkiMsg);

      nakkiFade.setValue(0);
      Animated.timing(nakkiFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 80);

      setIsStreaming(false);
    }, 800);

    setInput('');
    inputRef.current?.blur();
  }, [
    input,
    isStreaming,
    activeConversationId,
    addMessage,
    triggerHaptic,
    animateNextChange,
    nakkiFade,
  ]);

  // ----------------------
  // IMAGE PICKER
  // ----------------------
  const handlePickImage = useCallback(async () => {
    if (!activeConversationId) return;

    triggerHaptic('light');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets || !result.assets.length) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    animateNextChange();

    const imgMsg: ChatMessage = {
      id: `img-${Date.now()}`,
      role: 'user',
      content: '[image]',
      type: 'image',
      imageUri: uri,
    };

    addMessage(activeConversationId, imgMsg);
    triggerHaptic('medium');
  }, [activeConversationId, addMessage, triggerHaptic, animateNextChange]);

  const sendButtonDisabled = useMemo(
    () => isStreaming || !input.trim(),
    [isStreaming, input]
  );

  // ----------------------
  // RENDER CHAT ITEM
  // ----------------------
  const renderChatItem: ListRenderItem<ChatMessage> = useCallback(
    ({ item, index }) => {
      const isUser = item.role === 'user';
      const isLastAssistant = index === 0 && item.role === 'assistant';

      // IMAGE BUBBLE
      if (item.type === 'image' && item.imageUri) {
        return (
          <View
            style={[
              isUser ? styles.userImageBubble : styles.assistantImageBubble,
              {
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                marginLeft: isUser ? 24 : 0,
                marginRight: isUser ? 0 : 24,
                marginBottom: isLastAssistant ? 10 : 14,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setExpandedImage(item.imageUri ?? null);
              }}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        );
      }

      // USER TEXT
      if (isUser) {
        return (
          <LinearGradient
            colors={['rgba(100,140,200,0.24)', 'rgba(150,180,230,0.30)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.userBubble,
              {
                alignSelf: 'flex-end',
                marginLeft: 24,
                marginBottom: 8,
              },
            ]}
          >
            <View style={styles.userBubbleInner}>
              <Text
                style={[
                  TextStyles.body,
                  {
                    fontSize: 16,
                    lineHeight: 22,
                    color: 'rgba(234,242,255,0.96)',
                  },
                ]}
              >
                {item.content}
              </Text>
            </View>
          </LinearGradient>
        );
      }

      // ASSISTANT TEXT
      return (
        <Animated.View
          style={{
            opacity: isLastAssistant ? nakkiFade : 1,
            marginBottom: isLastAssistant ? 10 : 12,
          }}
        >
          <Text
            style={[
              TextStyles.body,
              {
                fontSize: 16,
                lineHeight: 22,
                color: 'rgba(225,235,255,0.90)',
                paddingHorizontal: 4,
                maxWidth: width * 0.78,
              },
            ]}
          >
            {item.content}
          </Text>
        </Animated.View>
      );
    },
    [nakkiFade, triggerHaptic]
  );

  // ===========================================================
  // RENDER
  // ===========================================================
  return (
    <CosmicBackground>
      {/* TOP PANEL */}
      <View
        style={[
          styles.topPanel,
          {
            paddingTop: insets.top,
            height: insets.top + TOP_PANEL_HEIGHT,
          },
        ]}
      >
        <View style={styles.iconRow}>
          <GlassIcon
            name="dots-horizontal"
            size={22}
            onPress={handleMenuPress}
          />
        </View>

        <View style={styles.iconRow}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: voiceWave.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15],
                  }),
                },
              ],
            }}
          >
            <GlassIcon
              name={isVoiceActive ? 'microphone' : 'microphone-outline'}
              size={22}
              onPress={handleVoicePress}
            />
          </Animated.View>
        </View>
      </View>

      {/* MAIN CONTENT: list + bottom panel */}
      <View style={styles.mainContent}>
        {/* MAIN CHAT LIST */}
        <FlatList
          ref={flatListRef}
          data={(activeConversation?.messages as ChatMessage[]) ?? []}
          inverted
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{
            paddingTop: insets.top + TOP_PANEL_HEIGHT + 12,
            paddingBottom: insets.bottom + BOTTOM_PANEL_HEIGHT + 12,
            paddingHorizontal: 12,
          }}
          renderItem={renderChatItem}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={21}
          initialNumToRender={15}
          onScrollBeginDrag={() => inputRef.current?.blur()}
        />

        {/* TYPING INDICATOR (floats just above bottom panel) */}
        {isStreaming && (
          <View
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: insets.bottom + BOTTOM_PANEL_HEIGHT + 8,
            }}
          >
            <TypingIndicator />
          </View>
        )}

        {/* BOTTOM PANEL (animated with keyboard) */}
        <Animated.View
          style={[
            styles.bottomPanel,
            {
              height: BOTTOM_PANEL_HEIGHT + insets.bottom,
            transform: [
              {
                translateY: Animated.multiply(keyboardHeight, -1),
              },
            ],
            },
          ]}
        >
          <View style={styles.inputShell}>
            <View style={styles.inputInner}>
              {/* + button → photo picker */}
              <Pressable onPress={handlePickImage} style={styles.plusButton}>
                <MaterialCommunityIcons
                  name="plus"
                  size={19}
                  color={
                    sendButtonDisabled
                      ? 'rgba(255,255,255,0.45)'
                      : tileThemes.six.text
                  }
                />
              </Pressable>

              {/* TEXT INPUT */}
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Nakki Anything"
                  placeholderTextColor="rgba(200,220,255,0.6)"
                  style={[
                    TextStyles.body,
                    {
                      fontSize: 16,
                      lineHeight: 20,
                      paddingTop: 4,
                      paddingBottom: 2,
                      color: 'rgba(234,242,255,0.98)',
                    },
                  ]}
                  multiline
                  editable={!isStreaming}
                  blurOnSubmit={false}
                  onSubmitEditing={sendMessage}
                />
              </View>

              {/* SEND */}
              <Pressable
                onPress={sendMessage}
                disabled={sendButtonDisabled}
                style={[styles.sendButton, sendButtonDisabled && styles.sendDisabled]}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={19}
                  color={
                    sendButtonDisabled
                      ? 'rgba(255,255,255,0.45)'
                      : tileThemes.six.text
                  }
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* EXPANDED IMAGE MODAL */}
      {expandedImage && (
        <View style={[styles.expandedImageOverlay, { top: 0, bottom: 0 }]}>
          <Pressable
            style={styles.expandedImageBackdrop}
            onPress={() => setExpandedImage(null)}
          />
          <View style={styles.expandedImageInner}>
            <Image
              source={{ uri: expandedImage }}
              style={styles.expandedImage}
              resizeMode="contain"
            />
          </View>
        </View>
      )}
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  list: {
    flex: 1,
  },

  topPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_PANEL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#020814',
    zIndex: 20,
  },
  iconRow: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020814',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 44,
  },

  userBubble: {
    borderRadius: 18,
    padding: 1.5,
    maxWidth: width * 0.72,
  },
  userBubbleInner: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(5,10,25,0.92)',
  },

  userImageBubble: {
    backgroundColor: 'rgba(100,140,200,0.24)',
    borderRadius: 18,
    padding: 2,
    maxWidth: width * 0.65,
    overflow: 'hidden',
  },
  assistantImageBubble: {
    backgroundColor: 'rgba(15,18,40,0.92)',
    borderRadius: 18,
    padding: 2,
    maxWidth: width * 0.65,
    overflow: 'hidden',
  },
  chatImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
  },

  // EXPANDED IMAGE MODAL
  expandedImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  expandedImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  expandedImageInner: {
    width: width * 0.9,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },

  // INPUT BAR
  inputShell: {
    borderRadius: 18,
    padding: 1.6,
    borderWidth: 1,
    borderColor: 'rgba(110,140,200,0.24)',
    backgroundColor: 'rgba(10,14,28,0.82)',
  },
  inputInner: {
    backgroundColor: 'rgba(8,12,26,0.96)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 0.4,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 6,
  },
  plusButton: {
    marginRight: 6,
    padding: 4,
  },
  sendButton: {
    marginLeft: 6,
    padding: 4,
  },
  sendDisabled: {
    opacity: 0.5,
  },
});