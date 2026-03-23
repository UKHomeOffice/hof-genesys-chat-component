import { useEffect, useCallback } from 'react';
import { mapHistoricalMessagesToStandardMessageFormat } from '../utils/message-utils';

/**
 * Custom hook for chat UI behaviors
 * @param {Object} params - Parameters
 * @param {Array} messages - Messages array
 * @param {boolean} shouldScrollToLatestMessage - Flag to scroll
 * @param {Function} setShouldScrollToLatestMessage - Setter for scroll flag
 * @param {Function} setMessages - Setter for messages
 * @param {Object} lastMessageRef - Ref to last message
 * @returns {Object} UI handlers
 */
export function useChatUI({
  messages,
  shouldScrollToLatestMessage,
  setShouldScrollToLatestMessage,
  setMessages,
  lastMessageRef,
}) {
  
  /*
   * Ensure the last message is the one visible when messages load (to cater for previous messages).
   * By using `block: nearest` it ensures only the div containing the messages gets scrolled, and not
   * the entire page.
   */
  useEffect(() => {
    if (shouldScrollToLatestMessage) {
      scrollToLatestMessage();
    }
  }, [messages, shouldScrollToLatestMessage]);

  const scrollToLatestMessage = useCallback(() => {
    lastMessageRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [lastMessageRef]);

  const mergeChatHistory = useCallback((historicalMessages) => {
    const mappedMessages = mapHistoricalMessagesToStandardMessageFormat(historicalMessages);
    setShouldScrollToLatestMessage(false);
    setMessages((prevMessages) => [...prevMessages, ...mappedMessages].reverse());
  }, [setShouldScrollToLatestMessage, setMessages]);

  return {
    mergeChatHistory,
  };
}
