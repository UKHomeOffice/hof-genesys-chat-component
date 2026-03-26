import { useEffect, useCallback } from 'react';

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
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, shouldScrollToLatestMessage, lastMessageRef]);

  /*
   * Merges already-mapped historical messages into the main messages state.
   * Mapping from the Genesys historical format to the standard message format is
   * the responsibility of the caller (useGenesysSubscriptions), which is where
   * the raw historical data arrives. This hook only handles the UI concern of
   * merging and reversing the list.
   * The scroll flag is set to false to prevent jumping when prepending history.
   */
  const mergeChatHistory = useCallback((mappedMessages) => {
    setShouldScrollToLatestMessage(false);

    setMessages((prevMessages) => {
      const merged = [...mappedMessages, ...prevMessages];

      /*
       * Sort the message chronologically based on timestamps to achieve correct order.
       * If the timestamps are identical, use the ID (hex-strings) for comparison (fallback).
       * IDs are NOT used to determine chronology, they only ensure stable ordering when timestamps collide
       */
      merged.sort((messageA, messageB) => {
        const timestampA = new Date(messageA.timestamp).getTime();
        const timestampB = new Date(messageB.timestamp).getTime();

        if (timestampA !== timestampB) {
          return timestampA - timestampB;
        }

        return messageA.id.localeCompare(messageB.id);
      });


      return merged;
    });
  }, [setShouldScrollToLatestMessage, setMessages]);

  return {
    mergeChatHistory,
  };
}
