import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// 📦 Types
// ─────────────────────────────────────────────────────────────
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content?: string;
  type?: 'text' | 'image';
  imageUri?: string | null;
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
  setActiveConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, newName: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearAllData: () => Promise<void>;
};

// ─────────────────────────────────────────────────────────────
// 🎯 Context Creation
// ─────────────────────────────────────────────────────────────
const ConversationContext = createContext<ConversationContextType>({
  conversations: [],
  activeConversationId: null,
  isLoading: true,
  startNewConversation: () => {},
  addMessage: () => {},
  setActiveConversation: () => {},
  renameConversation: () => {},
  deleteConversation: () => {},
  clearAllData: async () => {},
});

export const useConversations = () => useContext(ConversationContext);

// ─────────────────────────────────────────────────────────────
// 🔧 Storage Keys
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = '@anakki_conversations';
const ACTIVE_CONVERSATION_KEY = '@anakki_active_conversation';

// ─────────────────────────────────────────────────────────────
// 🎨 Provider Component
// ─────────────────────────────────────────────────────────────
export const ConversationProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 💾 Load conversations from AsyncStorage on mount
  // ─────────────────────────────────────────────────────────────
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
            console.error('Bad conversation data:', e);
            setConversations([]);
          }
        }

        if (storedActiveId) {
          setActiveConversationId(storedActiveId);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setHasLoadedFromStorage(true);
        setIsInitialized(true);
      }
    };

    loadConversations();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 💾 Save conversations to AsyncStorage whenever they change
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage) {
      if (conversations.length > 0) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)).catch((error) =>
          console.error('Failed to save conversations:', error)
        );
      } else {
        AsyncStorage.removeItem(STORAGE_KEY).catch((error) =>
          console.error('Failed to remove conversations:', error)
        );
      }
    }
  }, [conversations, isInitialized, hasLoadedFromStorage]);

  // ─────────────────────────────────────────────────────────────
  // 💾 Save active conversation ID whenever it changes
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage) {
      if (activeConversationId) {
        AsyncStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId).catch((error) =>
          console.error('Failed to save active conversation:', error)
        );
      } else {
        AsyncStorage.removeItem(ACTIVE_CONVERSATION_KEY).catch((error) =>
          console.error('Failed to clear active conversation:', error)
        );
      }
    }
  }, [activeConversationId, isInitialized, hasLoadedFromStorage]);

  // ─────────────────────────────────────────────────────────────
  // 🆕 Start New Conversation
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // ➕ Add Message to Conversation
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // 🔄 Set Active Conversation
  // ─────────────────────────────────────────────────────────────
  const setActiveConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ✏️ Rename Conversation
  // ─────────────────────────────────────────────────────────────
  const renameConversation = useCallback((conversationId: string, newName: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, customName: newName.trim() } : conv
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 🗑️ Delete Conversation (fixed to avoid double setConversations)
  // ─────────────────────────────────────────────────────────────
  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((conv) => conv.id !== conversationId);

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

        if (conversationId === activeConversationId) {
          setActiveConversationId(filtered[0]?.id ?? null);
        }

        return filtered;
      });
    },
    [activeConversationId]
  );

  // ─────────────────────────────────────────────────────────────
  // 🧹 Clear All Data
  // ─────────────────────────────────────────────────────────────
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
      console.error('Failed to clear data:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 🚀 Auto-create first conversation if storage was empty
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized && hasLoadedFromStorage && conversations.length === 0 && !activeConversationId) {
      startNewConversation();
    }
  }, [isInitialized, hasLoadedFromStorage, conversations.length, activeConversationId, startNewConversation]);

  // ─────────────────────────────────────────────────────────────
  // 🎁 Provide Context
  // ─────────────────────────────────────────────────────────────
  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversationId,
        isLoading: !isInitialized || !hasLoadedFromStorage,
        startNewConversation,
        addMessage,
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