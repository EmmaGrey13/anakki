import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library'; // ⬅️ ADD THIS
import * as Sharing from 'expo-sharing'; // ⬅️ ADD THIS
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Dimensions,
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
import { Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CosmicBackground from '../../../components/backgrounds/CosmicBackground';
import GlassIcon, { ICON_WRAPPER_SIZE } from '../../../components/common/GlassIcon';
import TypingIndicator from '../../../components/ui/TypingIndicator';
import { useConversations } from '../../../layout/ConversationContext';
import { useDrawer } from '../../../layout/DrawerContext';
import { TextStyles } from '../../../styles/textStyles';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const { width, height } = Dimensions.get('window');

const LAYOUT = {
  TOP_PANEL_HEIGHT: 62,
  BOTTOM_PANEL_HEIGHT: 96,
  KEYBOARD_OFFSET_VISIBLE: 10,
  KEYBOARD_OFFSET_HIDDEN: 60,
  CONTENT_PADDING_BOTTOM: 140,
  MASK_EXTRA_HEIGHT: 80,
  SCROLL_BUTTON_OFFSET_VISIBLE: 20,
  SCROLL_BUTTON_OFFSET_HIDDEN: 40,
  SCROLL_VELOCITY_THRESHOLD: 0.5,
  SCROLL_HIDE_DELAY: 1500,
  MESSAGE_BORDER_RADIUS: 22,
  SWIPE_DELETE_THRESHOLD: 80,
} as const;

const ANIMATION = {
  KEYBOARD_DURATION: 250,
  VOICE_PULSE_IN: 300,
  VOICE_PULSE_OUT: 100,
  MESSAGE_FADE_DURATION: 400,
  LAYOUT_CHANGE_DURATION: 150,
  NAKKI_REPLY_DELAY: 800,
  SCROLL_DELAY: 80,
  SCROLL_BUTTON_FADE_IN: 200,
  SCROLL_BUTTON_FADE_OUT: 300,
  DELETE_SLIDE_DURATION: 200,
  IMAGE_ZOOM_DURATION: 300,
  TOAST_DURATION: 2000,
  CLEAR_BUTTON_FADE: 200,
} as const;

const COLORS = {
  gradient: {
    userBubble: ['rgba(10,34,68,0.98)', 'rgba(12,20,40,0.96)'],
    userBubbleGlow: ['rgba(130,170,255,0.15)', 'rgba(130,170,255,0.05)'],
    inputBorder: [
      'rgba(130,170,255,0.3)',
      'rgba(120,150,220,0.2)',
      'rgba(130,170,255,0.3)',
    ],
    bottomMask: [
      'rgba(2,8,20,0)',
      'rgba(2,8,20,0.8)',
      'rgba(2,8,20,1)',
    ],
    deleteAction: ['rgba(255,60,60,0.2)', 'rgba(255,40,40,0.3)'],
  },
  text: {
    message: 'rgba(220,230,255,0.90)',
    input: 'rgba(234,242,255,0.95)',
    placeholder: 'rgba(160,190,255,0.5)',
    code: 'rgba(220,232,255,0.96)',
    timestamp: 'rgba(160,180,220,0.6)',
    error: 'rgba(255,100,100,0.9)',
    disclaimer: 'rgba(160,180,220,0.5)',
  },
  ui: {
    error: 'rgba(255,80,80,0.95)',
    success: 'rgba(10,34,68,0.96)',
    info: 'rgba(12,28,52,0.96)',
    warning: 'rgba(255,200,80,0.95)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
type ChatRole = 'user' | 'assistant';
type MessageStatus = 'sending' | 'sent' | 'failed';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  type?: 'text' | 'image';
  imageUri?: string | null;
  timestamp: number;
  status?: MessageStatus;
  isDeleted?: boolean;
};

type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
const looksLikeCodeBlock = (content: string): boolean =>
  content.trim().startsWith('```') && content.trim().endsWith('```');

const extractCodeFromBlock = (content: string): string => {
  const trimmed = content.trim();
  const withoutTicks = trimmed
    .replace(/^```[a-zA-Z0-9]*\n?/, '')
    .replace(/```$/, '');
  return withoutTicks.trimEnd();
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const ToastNotification = ({ message, type, visible, onHide }: ToastProps) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) });
        translateY.value = withTiming(-10, { duration: 250, easing: Easing.in(Easing.ease) });
        setTimeout(onHide, 250);
      }, ANIMATION.TOAST_DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible, onHide, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return COLORS.ui.success;
      case 'error':
        return COLORS.ui.error;
      case 'info':
      default:
        return COLORS.ui.info;
    }
  };

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  return (
    <Reanimated.View style={[styles.toastContainer, animatedStyle]}>
      <View style={[styles.toast, { backgroundColor: getBgColor() }]}>
        <Text style={styles.toastIcon}>{icon}</Text>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Reanimated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM ALERT MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
type CustomAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

const CustomAlert = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: CustomAlertProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <View style={styles.customAlertOverlay}>
      <Pressable style={styles.customAlertBackdrop} onPress={onCancel} />
      <Animated.View
        style={[
          styles.customAlertBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* CENTERED TITLE */}
        <Text style={styles.customAlertTitle}>{title}</Text>
        
        {/* MESSAGE */}
        <Text style={styles.customAlertMessage}>{message}</Text>
        
        {/* BUTTONS */}
        <View style={styles.customAlertButtons}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.customAlertButton,
              styles.customAlertCancelButton,
              pressed && styles.customAlertButtonPressed,
            ]}
          >
            <Text style={styles.customAlertCancelText}>{cancelText}</Text>
          </Pressable>
          
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.customAlertButton,
              styles.customAlertConfirmButton,
              pressed && styles.customAlertButtonPressed,
            ]}
          >
            <Text style={styles.customAlertConfirmText}>{confirmText}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function NakkiScreen() {
  const { openDrawer } = useDrawer();
  const {
    conversations,
    activeConversationId,
    addMessage,
    deleteMessage,
    updateMessage,
    clearConversation,
  } = useConversations();
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const insets = useSafeAreaInsets();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showClearAlert, setShowClearAlert] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────────────────
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const nakkiFade = useRef(new Animated.Value(0)).current;
  const voiceWave = useRef(new Animated.Value(0)).current;
  const animatedKeyboardHeight = useRef(new Animated.Value(0)).current;
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;
  const clearButtonOpacity = useRef(new Animated.Value(0)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Reanimated values for image zoom
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  // ─────────────────────────────────────────────────────────────────────────
  // ANIMATE CLEAR BUTTON BASED ON MESSAGE COUNT
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const hasMessages = activeConversation?.messages && activeConversation.messages.length > 0;
    
    Animated.timing(clearButtonOpacity, {
      toValue: hasMessages ? 1 : 0,
      duration: ANIMATION.CLEAR_BUTTON_FADE,
      useNativeDriver: true,
    }).start();
  }, [activeConversation?.messages, clearButtonOpacity]);

  // ─────────────────────────────────────────────────────────────────────────
  // TOAST HELPER
  // ─────────────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // KEYBOARD HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height ?? 0;
      setIsKeyboardVisible(true);
      Animated.timing(animatedKeyboardHeight, {
        toValue: height,
        duration: ANIMATION.KEYBOARD_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      setIsKeyboardVisible(false);
      Animated.timing(animatedKeyboardHeight, {
        toValue: 0,
        duration: ANIMATION.KEYBOARD_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animatedKeyboardHeight]);

  // ─────────────────────────────────────────────────────────────────────────
  // VOICE PULSE ANIMATION
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isVoiceActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(voiceWave, {
            toValue: 1,
            duration: ANIMATION.VOICE_PULSE_IN,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(voiceWave, {
            toValue: 0,
            duration: ANIMATION.VOICE_PULSE_OUT,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      voiceWave.setValue(0);
    }
  }, [isVoiceActive, voiceWave]);

  // ─────────────────────────────────────────────────────────────────────────
  // ANDROID LAYOUT ANIMATION
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HAPTIC FEEDBACK
  // ─────────────────────────────────────────────────────────────────────────
  const triggerHaptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'light') => {
      try {
        const map = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        Haptics.impactAsync(map[style]);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT ANIMATION
  // ─────────────────────────────────────────────────────────────────────────
  const animateNextChange = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        ANIMATION.LAYOUT_CHANGE_DURATION,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  // CLEAR CONVERSATION HANDLERS (Custom Alert)
  const handleClearConversation = useCallback(() => {
    if (!activeConversationId) return;
    triggerHaptic('light');
    setShowClearAlert(true);
  }, [activeConversationId, triggerHaptic]);

  const confirmClearConversation = useCallback(() => {
    if (!activeConversationId) return;
    
    clearConversation(activeConversationId);
    triggerHaptic('heavy');
    showToast('Conversation cleared', 'success');
    setShowClearAlert(false);
  }, [activeConversationId, clearConversation, triggerHaptic, showToast]);

  const cancelClearConversation = useCallback(() => {
    setShowClearAlert(false);
    triggerHaptic('light');
  }, [triggerHaptic]);

  // MENU & VOICE HANDLERS
  const handleMenuPress = useCallback(() => {
    triggerHaptic('light');
    openDrawer();
  }, [triggerHaptic, openDrawer]);

  const handleVoicePress = useCallback(() => {
    triggerHaptic('medium');
    setIsVoiceActive((prev) => !prev);
    
    if (!isVoiceActive) {
      showToast('Voice input activated', 'info');
      // TODO: Implement voice recording logic here
    } else {
      showToast('Voice input stopped', 'info');
      // TODO: Stop voice recording here
    }
  }, [triggerHaptic, isVoiceActive, showToast]);

  // SCROLL HANDLERS
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentScrollY = contentOffset.y;

      const scrollVelocity = Math.abs(currentScrollY - lastScrollY.current);
      lastScrollY.current = currentScrollY;

      const atBottom =
        currentScrollY >= contentSize.height - layoutMeasurement.height - 40;

      const hasEnoughContent = contentSize.height > layoutMeasurement.height + 20;

      if (atBottom && showScrollButton) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }

        Animated.timing(scrollButtonOpacity, {
          toValue: 0,
          duration: ANIMATION.SCROLL_BUTTON_FADE_OUT,
          useNativeDriver: true,
        }).start(() => {
          setShowScrollButton(false);
        });
        return;
      }

      const shouldShow =
        hasEnoughContent &&
        !atBottom &&
        scrollVelocity > LAYOUT.SCROLL_VELOCITY_THRESHOLD;

      if (shouldShow) {
        Animated.timing(scrollButtonOpacity, {
          toValue: 1,
          duration: ANIMATION.SCROLL_BUTTON_FADE_IN,
          useNativeDriver: true,
        }).start();

        setShowScrollButton(true);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          Animated.timing(scrollButtonOpacity, {
            toValue: 0,
            duration: ANIMATION.SCROLL_BUTTON_FADE_OUT,
            useNativeDriver: true,
          }).start(() => {
            setShowScrollButton(false);
          });
        }, LAYOUT.SCROLL_HIDE_DELAY);
      }
    },
    [scrollButtonOpacity, showScrollButton]
  );

  const scrollToBottom = useCallback(() => {
    triggerHaptic('light');

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    Animated.timing(scrollButtonOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowScrollButton(false);
    });

    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [triggerHaptic, scrollButtonOpacity]);

  const scrollToTop = useCallback(() => {
    triggerHaptic('light');

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    Animated.timing(scrollButtonOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowScrollButton(false);
    });

    flatListRef.current?.scrollToOffset({ offset: 999999, animated: true });
  }, [triggerHaptic, scrollButtonOpacity]);

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGE HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !activeConversationId) return;

    try {
      triggerHaptic('medium');
      animateNextChange();

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        type: 'text',
        timestamp: Date.now(),
        status: 'sending',
      };

      addMessage(activeConversationId, userMsg);
      setInput('');
      inputRef.current?.blur();
      setIsStreaming(true);

      // Simulate AI response
      messageTimeoutRef.current = setTimeout(() => {
        try {
          const nakkiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content:
              'Hello, my name is Anakki, but you may call me Nakki. How can I assist you now?',
            type: 'text',
            timestamp: Date.now(),
            status: 'sent',
          };

          addMessage(activeConversationId, nakkiMsg);

          AccessibilityInfo.announceForAccessibility(
            `Nakki says: ${nakkiMsg.content}`
          );

          nakkiFade.setValue(0);
          Animated.timing(nakkiFade, {
            toValue: 1,
            duration: ANIMATION.MESSAGE_FADE_DURATION,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, ANIMATION.SCROLL_DELAY);
        } catch (error) {
          console.error('Failed to add AI message:', error);
          showToast('Failed to receive response', 'error');
        } finally {
          setIsStreaming(false);
        }
      }, ANIMATION.NAKKI_REPLY_DELAY);
    } catch (error) {
      console.error('Send message failed:', error);
      showToast('Failed to send message', 'error');
      setIsStreaming(false);
    }
  }, [
    input,
    isStreaming,
    activeConversationId,
    addMessage,
    triggerHaptic,
    animateNextChange,
    nakkiFade,
    showToast,
  ]);

  const handlePickImage = useCallback(async () => {
    if (!activeConversationId || isPickingImage) return;

    try {
      setIsPickingImage(true);
      triggerHaptic('light');

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to share images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      animateNextChange();

      const imgMsg: ChatMessage = {
        id: `img-${Date.now()}`,
        role: 'user',
        content: '[image]',
        type: 'image',
        imageUri: uri,
        timestamp: Date.now(),
        status: 'sent',
      };

      addMessage(activeConversationId, imgMsg);
      triggerHaptic('medium');
      showToast('Image added', 'success');

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, ANIMATION.SCROLL_DELAY);
    } catch (error) {
      console.error('Image picker failed:', error);
      showToast('Failed to pick image', 'error');
    } finally {
      setIsPickingImage(false);
    }
  }, [
    activeConversationId,
    addMessage,
    triggerHaptic,
    animateNextChange,
    isPickingImage,
    showToast,
  ]);

    const handleSaveImage = useCallback(
    async (imageUri: string) => {
      try {
        triggerHaptic('light');

        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant access to save images to your photo library.'
          );
          return;
        }

        // Save to library
        await MediaLibrary.saveToLibraryAsync(imageUri);
        triggerHaptic('medium');
        showToast('Image saved to Photos', 'success');
      } catch (error) {
        console.error('Save image failed:', error);
        showToast('Failed to save image', 'error');
      }
    },
    [triggerHaptic, showToast]
  );

    const handleShareImage = useCallback(
    async (imageUri: string) => {
      try {
        triggerHaptic('light');

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          showToast('Sharing is not available on this device', 'error');
          return;
        }

        // Share the image
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Image',
        });
        
        triggerHaptic('light');
      } catch (error) {
        console.error('Share image failed:', error);
        showToast('Failed to share image', 'error');
      }
    },
    [triggerHaptic, showToast]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!activeConversationId) return;

      triggerHaptic('medium');
      deleteMessage(activeConversationId, messageId);
      showToast('Message deleted', 'success');
      swipeableRefs.current.get(messageId)?.close();
    },
    [activeConversationId, deleteMessage, triggerHaptic, showToast]
  );

  const handleCopyMessage = useCallback(
    async (content: string) => {
      try {
        await Clipboard.setStringAsync(content);
        triggerHaptic('light');
        showToast('Copied to clipboard', 'success');
      } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
      }
    },
    [triggerHaptic, showToast]
  );

  const handleLongPress = useCallback(
    (messageId: string, messageContent: string, isUser: boolean, messageType?: string, imageUri?: string) => {
      triggerHaptic('heavy');
      setSelectedMessageId(messageId);

      const displayContent =
        messageContent.length > 50
          ? `${messageContent.substring(0, 47)}...`
          : messageContent;

      const options: any[] = [];

      // IMAGE-SPECIFIC OPTIONS
      if (messageType === 'image' && imageUri) {
        options.push(
          {
            text: 'Save Image',
            onPress: () => handleSaveImage(imageUri),
          },
          {
            text: 'Share Image',
            onPress: () => handleShareImage(imageUri),
          }
        );
      } else {
        // TEXT MESSAGE OPTIONS
        options.push({
          text: 'Copy',
          onPress: () => handleCopyMessage(messageContent),
        });
      }

      // DELETE OPTION (for all message types)
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteMessage(messageId),
      });

      // REGENERATE OPTION (for assistant messages only)
      if (!isUser && messageType !== 'image') {
        options.splice(options.length - 1, 0, {
          text: 'Regenerate',
          onPress: () => {
            showToast('Regenerating response...', 'info');
          },
        });
      }

      // CANCEL OPTION
      options.push({
        text: 'Cancel',
        style: 'cancel',
        onPress: () => setSelectedMessageId(null),
      });

      const alertTitle = messageType === 'image' ? 'Image Options' : 'Message Options';
      const alertMessage = messageType === 'image' ? 'Choose an action' : displayContent;

      Alert.alert(alertTitle, alertMessage, options);
    },
    [triggerHaptic, handleCopyMessage, handleDeleteMessage, handleSaveImage, handleShareImage, showToast]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE ZOOM GESTURES
  // ─────────────────────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTap
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const closeExpandedImage = useCallback(() => {
    scale.value = withTiming(1, { 
      duration: ANIMATION.IMAGE_ZOOM_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    translateX.value = withTiming(0, { 
      duration: ANIMATION.IMAGE_ZOOM_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    translateY.value = withTiming(0, { 
      duration: ANIMATION.IMAGE_ZOOM_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    savedScale.value = 1;
    
    setTimeout(() => {
      setExpandedImage(null);
    }, ANIMATION.IMAGE_ZOOM_DURATION);
  }, [scale, translateX, translateY, savedScale]);

  // ─────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────
  const sendButtonDisabled = useMemo(
    () => isStreaming || !input.trim(),
    [isStreaming, input]
  );

  const scrollButtonBottom = useMemo(
    () =>
      isKeyboardVisible
        ? LAYOUT.BOTTOM_PANEL_HEIGHT + LAYOUT.SCROLL_BUTTON_OFFSET_VISIBLE
        : LAYOUT.BOTTOM_PANEL_HEIGHT + LAYOUT.SCROLL_BUTTON_OFFSET_HIDDEN,
    [isKeyboardVisible]
  );

  const maskHeight = useMemo(
    () =>
      isKeyboardVisible
        ? LAYOUT.BOTTOM_PANEL_HEIGHT + LAYOUT.MASK_EXTRA_HEIGHT
        : insets.bottom + LAYOUT.BOTTOM_PANEL_HEIGHT + LAYOUT.MASK_EXTRA_HEIGHT,
    [isKeyboardVisible, insets.bottom]
  );

  const bottomPanelOffset = useMemo(
    () =>
      Animated.add(
        animatedKeyboardHeight,
        new Animated.Value(
          isKeyboardVisible
            ? LAYOUT.KEYBOARD_OFFSET_VISIBLE
            : LAYOUT.KEYBOARD_OFFSET_HIDDEN
        )
      ),
    [isKeyboardVisible, animatedKeyboardHeight]
  );

  const voiceIconScale = useMemo(
    () =>
      voiceWave.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15],
      }),
    [voiceWave]
  );

  const hasMessages = useMemo(
    () => activeConversation?.messages && activeConversation.messages.length > 0,
    [activeConversation?.messages]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER DELETE ACTION
  // ─────────────────────────────────────────────────────────────────────────
  const renderRightActions = useCallback(
    (messageId: string, isImage: boolean) => (progress: any, dragX: any) => {
      const opacity = dragX.interpolate({
        inputRange: [-100, -LAYOUT.SWIPE_DELETE_THRESHOLD, 0],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      });

      const iconScale = dragX.interpolate({
        inputRange: [-80, -40, 0],
        outputRange: [1, 1.1, 0.8],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[
            styles.deleteAction,
            isImage && styles.deleteActionImage,  // ⬅️ ADD THIS
            { opacity },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(2,8,20,0)',
              'rgba(100,100,255,0.05)',
              'rgba(255,60,100,0.15)',
              'rgba(255,40,40,0.3)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.deleteActionGradient}
          >
            <Pressable
              onPress={() => handleDeleteMessage(messageId)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <View style={styles.deleteIconWrapper}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={22}
                    color="rgba(255,80,80,0.95)"
                  />
                </View>
              </Animated.View>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      );
    },
    [handleDeleteMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER CHAT ITEM
  // ─────────────────────────────────────────────────────────────────────────
  const renderChatItem: ListRenderItem<ChatMessage> = useCallback(
    ({ item, index }) => {
      const isUser = item.role === 'user';
      const isLastAssistant = index === 0 && item.role === 'assistant';

      const messageContent = (
        <Pressable
          onLongPress={() => handleLongPress(item.id, item.content, isUser, item.type, item.imageUri ?? undefined)}
          delayLongPress={500}
        >
          <View style={styles.messageContainer}>
            {item.isDeleted ? (
              <View style={styles.messageDeleted}>
                <MaterialCommunityIcons 
                  name="shimmer" 
                  size={12} 
                  color="rgba(130,170,255,0.4)" 
                />
                <Text style={styles.messageDeletedText}>
                  {item.type === 'image' ? 'Image deleted' : 'Message deleted'}
                </Text>
              </View>
            ) : (
              <>
                {item.type === 'image' && item.imageUri ? (
                  <View
                    style={[
                      isUser ? styles.userImageBubble : styles.assistantImageBubble,
                      isUser ? styles.userImageAlignment : styles.assistantImageAlignment,
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
                    <Text style={styles.timestamp}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                ) : looksLikeCodeBlock(item.content) && !isUser ? (
                  <Animated.View
                    style={[
                      { opacity: isLastAssistant ? nakkiFade : 1 },
                    ]}
                  >
                    <View style={styles.codeBlockOuter}>
                      <View style={styles.codeBlockBody}>
                        <Text style={styles.codeText}>
                          {extractCodeFromBlock(item.content)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleCopyMessage(extractCodeFromBlock(item.content))}
                        style={styles.codeCopyPill}
                      >
                        <MaterialCommunityIcons
                          name="content-copy"
                          size={14}
                          color={COLORS.text.code}
                        />
                        <Text style={styles.codeCopyText}>Copy</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.timestamp}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </Animated.View>
                ) : isUser ? (
                  <View style={styles.userBubbleContainer}>
                    <LinearGradient
                      colors={COLORS.gradient.userBubble}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.userBubbleOuter}
                    >
                      <Text style={styles.userMessageText}>{item.content}</Text>
                    </LinearGradient>
                    <View style={styles.messageMetadata}>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                      {item.status === 'sending' && (
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={12}
                          color={COLORS.text.timestamp}
                          style={styles.statusIcon}
                        />
                      )}
                      {item.status === 'sent' && (
                        <MaterialCommunityIcons
                          name="check"
                          size={12}
                          color={COLORS.text.timestamp}
                          style={styles.statusIcon}
                        />
                      )}
                      {item.status === 'failed' && (
                        <MaterialCommunityIcons
                          name="alert-circle-outline"
                          size={12}
                          color={COLORS.ui.error}
                          style={styles.statusIcon}
                        />
                      )}
                    </View>
                  </View>
                ) : (
                  <Animated.View
                    style={[
                      { opacity: isLastAssistant ? nakkiFade : 1 },
                    ]}
                  >
                    <View style={styles.assistantBubble}>
                      <Text style={styles.assistantMessageText}>{item.content}</Text>
                    </View>
                    <Text style={styles.timestamp}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </Animated.View>
                )}
              </>
            )}
          </View>
        </Pressable>
      );

      return (
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={renderRightActions(item.id, item.type === 'image')}  // ⬅️ UPDATE THIS
          overshootRight={false}
          friction={2}
          rightThreshold={40}
          onSwipeableOpen={() => triggerHaptic('light')}
        >
          {messageContent}
        </Swipeable>
      );
    },
    [
      nakkiFade,
      triggerHaptic,
      handleLongPress,
      handleCopyMessage,
      handleSaveImage,
      handleShareImage,
      renderRightActions,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <CosmicBackground>
      <ToastNotification
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* TOP PANEL */}
      <View
        style={[
          styles.topPanel,
          {
            paddingTop: insets.top,
            height: insets.top + LAYOUT.TOP_PANEL_HEIGHT,
          },
        ]}
      >
        <View style={styles.iconRow}>
          <GlassIcon
            name="dots-horizontal"
            size={22}
            onPress={handleMenuPress}
            accessibilityLabel="Open menu"
            accessibilityHint="Opens the navigation menu"
          />
        </View>

        {/* CENTER: EMPTY (NO MORE CLEAR BUTTON HERE) */}
        <View style={styles.topCenterActions}>
          {/* Empty - clean minimalist look */}
        </View>

        <View style={styles.iconRow}>
          <Animated.View style={{ transform: [{ scale: voiceIconScale }] }}>
            <GlassIcon
              name={isVoiceActive ? 'microphone' : 'microphone-outline'}
              size={22}
              onPress={handleVoicePress}
              accessibilityLabel={
                isVoiceActive ? 'Stop voice input' : 'Start voice input'
              }
              accessibilityState={{ selected: isVoiceActive }}
            />
          </Animated.View>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.keyboardContainer}>
        <View style={styles.mainContent}>
          <FlatList
            ref={flatListRef}
            data={(activeConversation?.messages as ChatMessage[]) ?? []}
            inverted
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={{
              paddingTop: insets.top + LAYOUT.TOP_PANEL_HEIGHT + 16,
              paddingBottom:
                LAYOUT.BOTTOM_PANEL_HEIGHT +
                insets.bottom +
                LAYOUT.CONTENT_PADDING_BOTTOM,
              paddingHorizontal: 0,
            }}
            renderItem={renderChatItem}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={21}
            initialNumToRender={15}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            onScrollBeginDrag={() => inputRef.current?.blur()}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {isStreaming && (
            <View style={styles.typingIndicatorContainer}>
              <TypingIndicator />
            </View>
          )}

          <LinearGradient
            colors={COLORS.gradient.bottomMask}
            style={[styles.bottomMask, { height: maskHeight }]}
            pointerEvents="none"
          />

          {showScrollButton && (
            <Animated.View
              style={[
                styles.scrollButtons,
                {
                  bottom: scrollButtonBottom,
                  opacity: scrollButtonOpacity,
                },
              ]}
            >
              <GlassIcon
                name="chevron-up"
                size={16}
                color="rgba(238,242,255,0.9)"
                onPress={scrollToTop}
                accessibilityLabel="Scroll to top of conversation"
                accessibilityHint="Scrolls to the most recent messages"
              />
              <View style={styles.scrollButtonSpacer} />
              <GlassIcon
                name="chevron-down"
                size={16}
                color="rgba(238,242,255,0.9)"
                onPress={scrollToBottom}
                accessibilityLabel="Scroll to bottom of conversation"
                accessibilityHint="Scrolls to the oldest messages"
              />
            </Animated.View>
          )}

          {/* BOTTOM INPUT PANEL - ORIGINAL POSITION */}
          <Animated.View
            style={[styles.inputPanelContainer, { bottom: bottomPanelOffset }]}
          >
            <View style={styles.inputPanelWrapper}>
              <BlurView
                intensity={100}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={COLORS.gradient.inputBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputBorderGradient}
              >
                <View style={styles.inputInnerContainer}>
                  {/* PAPERCLIP BUTTON */}
                  <Pressable
                    onPress={handlePickImage}
                    disabled={isPickingImage}
                    style={({ pressed }) => [
                      styles.attachmentButton,
                      isPickingImage && styles.attachmentButtonDisabled,
                      pressed && styles.attachmentButtonPressed,
                    ]}
                    accessibilityLabel="Attach image"
                    accessibilityHint="Opens image picker to attach an image"
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name={isPickingImage ? 'loading' : 'paperclip'}
                      size={20}
                      color={
                        isPickingImage
                          ? 'rgba(130,170,255,0.5)'
                          : 'rgba(130,170,255,0.9)'
                      }
                    />
                  </Pressable>

                  {/* CLEAR (X) BUTTON - INSIDE INPUT CONTAINER */}
                  {hasMessages && (
                    <Animated.View style={{ opacity: clearButtonOpacity }}>
                      <Pressable
                        onPress={handleClearConversation}
                        style={styles.clearButton}
                        accessibilityLabel="Clear conversation"
                        accessibilityHint="Deletes all messages in this conversation"
                        accessibilityRole="button"
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={18}
                          color="rgba(255,255,255,0.4)"
                        />
                      </Pressable>
                    </Animated.View>
                  )}

                  {/* TEXT INPUT */}
                  <View style={styles.textInputWrapper}>
                    <TextInput
                      ref={inputRef}
                      value={input}
                      onChangeText={setInput}
                      placeholder="Ask Nakki anything"
                      placeholderTextColor={COLORS.text.placeholder}
                      style={[TextStyles.body, styles.textInput]}
                      multiline
                      editable={!isStreaming}
                      blurOnSubmit={false}
                      onSubmitEditing={sendMessage}
                      scrollEnabled
                      accessibilityLabel="Message input"
                      accessibilityHint="Type your message to Nakki"
                      accessibilityRole="search"
                    />
                  </View>

                  {/* SEND BUTTON */}
                  <Pressable
                    onPress={sendMessage}
                    disabled={sendButtonDisabled}
                    style={[
                      styles.sendButton,
                      sendButtonDisabled && styles.sendButtonDisabled,
                    ]}
                    accessibilityLabel="Send message"
                    accessibilityHint="Sends your message to Nakki"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: sendButtonDisabled }}
                  >
                    <MaterialCommunityIcons
                      name="send"
                      size={18}
                      color={
                        sendButtonDisabled
                          ? 'rgba(255,255,255,0.4)'
                          : 'rgba(130,170,255,0.95)'
                      }
                    />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* DISCLAIMER TEXT - BELOW INPUT CONTAINER */}
          <Animated.View
            style={[
              styles.disclaimerContainer,
              { 
                bottom: Animated.subtract(
                  bottomPanelOffset,
                  new Animated.Value(24)  // 24px below input
                )
              }
            ]}
          >
            <Text style={styles.disclaimerText}>
              Nakki can make mistakes. Check important info.
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* EXPANDED IMAGE MODAL */}
      {expandedImage && (
        <View style={styles.expandedImageOverlay}>
          <Pressable
            style={styles.expandedImageBackdrop}
            onPress={closeExpandedImage}
          />
          <GestureDetector gesture={composedGesture}>
            <Reanimated.View style={[styles.expandedImageInner, animatedImageStyle]}>
              <Image
                source={{ uri: expandedImage }}
                style={styles.expandedImage}
                resizeMode="contain"
              />
            </Reanimated.View>
          </GestureDetector>

          {/* TOP CONTROLS - CLOSE, INFO, SAVE, SHARE */}
          <View style={styles.expandedImageControls}>
            {/* LEFT SIDE - CLOSE BUTTON */}
            <View style={styles.expandedImageLeftControls}>
              <GlassIcon
                name="close"
                size={24}
                onPress={closeExpandedImage}
                accessibilityLabel="Close image"
                accessibilityRole="button"
              />
            </View>

            {/* RIGHT SIDE - INFO, SAVE, SHARE */}
            <View style={styles.expandedImageRightControls}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  showToast('Image info', 'info');
                }}
                style={styles.expandedImageButton}
              >
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <MaterialCommunityIcons
                  name="information-outline"
                  size={22}
                  color="rgba(220,230,255,0.9)"
                />
              </Pressable>

              <Pressable
                onPress={() => handleSaveImage(expandedImage)}
                style={styles.expandedImageButton}
              >
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.expandedImageButtonText}>Save</Text>
              </Pressable>

              <Pressable
                onPress={() => handleShareImage(expandedImage)}
                style={[styles.expandedImageButton, styles.expandedImageShareButton]}
              >
                <Text style={styles.expandedImageShareText}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* CUSTOM CLEAR CONVERSATION ALERT */}
      <CustomAlert
        visible={showClearAlert}
        title="Clear Conversation"
        message="Are you sure you want to delete all messages? This cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={confirmClearConversation}
        onCancel={cancelClearConversation}
      />
    </CosmicBackground>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // LAYOUT
  keyboardContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  list: {
    flex: 1,
  },

  // TOP PANEL
  topPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(2,8,20,0.95)',
    zIndex: 20,
  },
  iconRow: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenterActions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // TOAST STYLES
  toastContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 10,
  },
  toastText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // CUSTOM ALERT MODAL
  customAlertOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  customAlertBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  customAlertBox: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(130,170,255,0.3)',
    shadowColor: 'rgba(130,170,255,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  customAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(220,230,255,0.95)',
    textAlign: 'center',  // ⬅️ CENTERED!
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: 0.3,
  },
  customAlertMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(180,200,240,0.85)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  customAlertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(130,170,255,0.15)',
  },
  customAlertButton: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertButtonPressed: {
    backgroundColor: 'rgba(130,170,255,0.1)',
  },
  customAlertCancelButton: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(130,170,255,0.15)',
  },
  customAlertCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(130,170,255,0.8)',
  },
  customAlertConfirmButton: {
    // No additional styles needed
  },
  customAlertConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,80,80,0.95)',
  },

  // MESSAGE BUBBLES
  messageContainer: {
    marginVertical: 2,
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
    marginLeft: 40,
    marginRight: 16,
    maxWidth: width * 0.75,
  },
  userBubbleOuter: {
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: 'rgba(130,170,255,0.5)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text.message,
  },
  assistantBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(8,16,32,0.3)',
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(130,170,255,0.15)',
  },
  assistantMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.message,
  },
  messageMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.text.timestamp,
    marginTop: 4,
    marginLeft: 16,
  },
  statusIcon: {
    marginLeft: 2,
  },

  // IMAGE BUBBLES
  userImageBubble: {
    backgroundColor: 'rgba(130,170,255,0.25)',
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS,
    padding: 3,
    maxWidth: width * 0.7,
    overflow: 'hidden',
    shadowColor: 'rgba(130,170,255,0.5)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  userImageAlignment: {
    alignSelf: 'flex-end',
    marginLeft: 40,
    marginRight: 16,
  },
  assistantImageBubble: {
    backgroundColor: 'rgba(15,25,45,0.92)',
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS,
    padding: 3,
    maxWidth: width * 0.7,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(130,170,255,0.15)',
  },
  assistantImageAlignment: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginRight: 40,
  },
  chatImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS - 3,
  },

  // CODE BLOCK
  codeBlockOuter: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(130,170,255,0.40)',
    backgroundColor: 'rgba(8,16,32,0.98)',
    overflow: 'hidden',
  },
  codeBlockBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.code,
  },
  codeCopyPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(12,24,48,0.90)',
    borderWidth: 0.5,
    borderColor: 'rgba(130,170,255,0.35)',
  },
  codeCopyText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.text.code,
  },

  // DELETE ACTION
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 2,
    marginBottom: 18,
    borderRadius: LAYOUT.MESSAGE_BORDER_RADIUS,
    overflow: 'hidden',
  },
  deleteActionImage: {
    marginBottom: 2,
  },
  deleteActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingLeft: 60,
    minHeight: 44,
  },
  deleteButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,60,60,0.2)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,80,80,0.5)',
  },
  deleteIconWrapper: {
    shadowColor: 'rgba(255,60,60,0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },

  // MESSAGE DELETED STATE
  messageDeleted: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    marginHorizontal: 16,
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(130,170,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(130,170,255,0.15)',
  },
  messageDeletedText: {
    fontSize: 13,
    color: 'rgba(130,170,255,0.5)',
    fontStyle: 'italic',
    marginLeft: 4,
  },

  // OVERLAY ELEMENTS
  bottomMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    pointerEvents: 'none',
  },
  typingIndicatorContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  inputPanelContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    alignItems: 'center',
  },
  scrollButtons: {
    position: 'absolute',
    right: 0,
    left: 0,
    alignItems: 'center',
    zIndex: 26,
  },
  scrollButtonSpacer: {
    height: 6,
  },

  // INPUT PANEL
  inputPanelWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: 'rgba(130,170,255,0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  inputBorderGradient: {
    padding: 1,
  },
  inputInnerContainer: {
    backgroundColor: 'rgba(8,16,32,0.92)',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 0.1,
    borderColor: 'rgba(130,170,255,0.2)',
    gap: 8,
  },

  // INPUT BUTTONS
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(130,170,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentButtonDisabled: {
    backgroundColor: 'rgba(130,170,255,0.08)',
  },
  attachmentButtonPressed: {
    backgroundColor: 'rgba(130,170,255,0.25)',
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(130,170,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(130,170,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(130,170,255,0.1)',
  },

  // TEXT INPUT
  textInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    color: COLORS.text.input,
    maxHeight: 100,
    minHeight: 20,
    textAlignVertical: 'center',
  },

  // DISCLAIMER CONTAINER (update)
  disclaimerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 29,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.text.disclaimer,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    fontWeight: '400',
    letterSpacing: 0.2,
    backgroundColor: 'rgba(2,8,20,0.75)',
    borderRadius: 12,
    overflow: 'hidden',
  },

  // EXPANDED IMAGE MODAL (UPDATE EXISTING + ADD NEW)
  expandedImageOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  expandedImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  expandedImageInner: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },

  // NEW CONTROLS LAYOUT
  expandedImageControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  expandedImageLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedImageRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // BUTTON STYLES
  expandedImageButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(130,170,255,0.3)',
    shadowColor: 'rgba(130,170,255,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  expandedImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(220,230,255,0.95)',
    letterSpacing: 0.3,
  },
  expandedImageShareButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 0,
  },
  expandedImageShareText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(10,20,40,0.95)',
    letterSpacing: 0.3,
  },
});