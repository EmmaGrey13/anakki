// layout/ConversationContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 📦 TYPES
// ═══════════════════════════════════════════════════════════════════════════
export type ChatRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content?: string;
  type?: 'text' | 'image';
  imageUri?: string | null;
  timestamp?: number;
  status?: MessageStatus;
  isDeleted?: boolean;  // ⬅️ ADDED for soft delete
};

export type Conversation = {
  id: string;
  messages: ChatMessage[];
  customName?: string;
  createdAt?: number;
  timestamp?: number;
};

type ConversationContextType = {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  startNewConversation: () => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;  // ⬅️ NEW
  clearConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, newName: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearAllData: () => Promise<void>;
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CONTEXT CREATION
// ═══════════════════════════════════════════════════════════════════════════
const ConversationContext = createContext<ConversationContextType>({
  conversations: [],
  activeConversationId: null,
  isLoading: true,
  startNewConversation: () => {},
  addMessage: () => {},
  deleteMessage: () => {},
  updateMessage: () => {},  // ⬅️ NEW
  clearConversation: () => {},
  setActiveConversation: () => {},
  renameConversation: () => {},
  deleteConversation: () => {},
  clearAllData: async () => {},
});

export const useConversations = () => useContext(ConversationContext);

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════
const STORAGE_KEY = '@anakki_conversations';
const ACTIVE_CONVERSATION_KEY = '@anakki_active_conversation';

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export const ConversationProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 💾 LOAD CONVERSATIONS FROM STORAGE ON MOUNT
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const [storedConversations, storedActiveId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_CONVERSATION_KEY),
        ]);

        if (storedConversations) {
          try {
            const parsed: Conversation[] = JSON.parse(storedConversations);
            if (Array.isArray(parsed)) {
              setConversations(parsed);
            } else {
              setConversations([]);
            }
          } catch (e) {
            console.error('❌ Bad conversation data:', e);
            setConversations([]);
          }
        }

        if (storedActiveId) {
          setActiveConversationId(storedActiveId);
        }
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
      } finally {
        setHasLoadedFromStorage(true);
        setIsInitialized(true);
      }
    };

    loadConversations();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 💾 SAVE CONVERSATIONS TO STORAGE WHENEVER THEY CHANGE
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage) {
      if (conversations.length > 0) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)).catch((error) =>
          console.error('❌ Failed to save conversations:', error)
        );
      } else {
        AsyncStorage.removeItem(STORAGE_KEY).catch((error) =>
          console.error('❌ Failed to remove conversations:', error)
        );
      }
    }
  }, [conversations, isInitialized, hasLoadedFromStorage]);

  // ─────────────────────────────────────────────────────────────────────────
  // 💾 SAVE ACTIVE CONVERSATION ID WHENEVER IT CHANGES
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage) {
      if (activeConversationId) {
        AsyncStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId).catch((error) =>
          console.error('❌ Failed to save active conversation:', error)
        );
      } else {
        AsyncStorage.removeItem(ACTIVE_CONVERSATION_KEY).catch((error) =>
          console.error('❌ Failed to clear active conversation:', error)
        );
      }
    }
  }, [activeConversationId, isInitialized, hasLoadedFromStorage]);

  // ─────────────────────────────────────────────────────────────────────────
  // 🆕 START NEW CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const startNewConversation = useCallback(() => {
    const newId = `c-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      messages: [],
      createdAt: Date.now(),
      timestamp: Date.now(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newId);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ➕ ADD MESSAGE TO CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const addMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [message, ...c.messages],
              timestamp: Date.now(),
            }
          : c
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ✨ UPDATE MESSAGE (NEW - For marking as deleted or updating status)
  // ─────────────────────────────────────────────────────────────────────────
  const updateMessage = useCallback(
    (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                timestamp: Date.now(),
              }
            : conv
        )
      );
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ✨ DELETE SINGLE MESSAGE (Hard delete - removes from list)
  // ─────────────────────────────────────────────────────────────────────────
  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.filter((msg) => msg.id !== messageId),
              timestamp: Date.now(),
            }
          : conv
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ✨ CLEAR ALL MESSAGES IN CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const clearConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [],
              timestamp: Date.now(),
            }
          : conv
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 🔄 SET ACTIVE CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const setActiveConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ✏️ RENAME CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const renameConversation = useCallback((conversationId: string, newName: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, customName: newName.trim() } : conv
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 🗑️ DELETE ENTIRE CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────
  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((conv) => conv.id !== conversationId);

        // If no conversations left, create a new one
        if (filtered.length === 0) {
          const newId = `c-${Date.now()}`;
          const newConversation: Conversation = {
            id: newId,
            messages: [],
            createdAt: Date.now(),
            timestamp: Date.now(),
          };
          setActiveConversationId(newId);
          return [newConversation];
        }

        // If we deleted the active conversation, switch to the first one
        if (conversationId === activeConversationId) {
          setActiveConversationId(filtered?.[0]?.id ?? null);
        }

        return filtered;
      });
    },
    [activeConversationId]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 🧹 CLEAR ALL DATA (NUCLEAR OPTION)
  // ─────────────────────────────────────────────────────────────────────────
  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, ACTIVE_CONVERSATION_KEY]);
      setConversations([]);
      setActiveConversationId(null);
      console.log('✅ All conversation data cleared!');

      // Create a fresh conversation after clearing
      const newId = `c-${Date.now()}`;
      const newConversation: Conversation = {
        id: newId,
        messages: [],
        createdAt: Date.now(),
        timestamp: Date.now(),
      };
      setConversations([newConversation]);
      setActiveConversationId(newId);
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 🚀 AUTO-CREATE FIRST CONVERSATION IF STORAGE WAS EMPTY
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage && conversations.length === 0 && !activeConversationId) {
      startNewConversation();
    }
  }, [isInitialized, hasLoadedFromStorage, conversations.length, activeConversationId, startNewConversation]);

  // ─────────────────────────────────────────────────────────────────────────
  // 🎁 PROVIDE CONTEXT
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversationId,
        isLoading: !isInitialized || !hasLoadedFromStorage,
        startNewConversation,
        addMessage,
        deleteMessage,
        updateMessage,        // ⬅️ NEW
        clearConversation,
        setActiveConversation,
        renameConversation,
        deleteConversation,
        clearAllData,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};