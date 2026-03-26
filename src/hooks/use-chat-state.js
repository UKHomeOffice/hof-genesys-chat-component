import { useState, useRef } from 'react';

/**
 * Custom hook to manage chat state
 * @returns {Object} Chat state and setters
 */
export function useChatState() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [historicalMessages, setHistoricalMessages] = useState([]);
  const [genesysIsReady, setGenesysIsReady] = useState(false);
  const [allHistoryFetched, setAllHistoryFetched] = useState(false);
  const [shouldScrollToLatestMessage, setShouldScrollToLatestMessage] = useState(false);
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastHistoryBatchCount, setLastHistoryBatchCount] = useState(0);

  const hasReconnectedRef = useRef(false);
  const lastMessageRef = useRef(null);

  return {
    userInput,
    setUserInput,
    messages,
    setMessages,
    historicalMessages,
    setHistoricalMessages,
    genesysIsReady,
    setGenesysIsReady,
    allHistoryFetched,
    setAllHistoryFetched,
    shouldScrollToLatestMessage,
    setShouldScrollToLatestMessage,
    agentIsTyping,
    setAgentIsTyping,
    isErrorState,
    setIsErrorState,
    messageIndex,
    setMessageIndex,
    showEndChatModal,
    setShowEndChatModal,
    isOffline,
    setIsOffline,
    hasReconnectedRef,
    lastMessageRef,
    lastHistoryBatchCount,
    setLastHistoryBatchCount
  };
}
