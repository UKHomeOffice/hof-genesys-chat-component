import { useSendMessage } from './use-send-message';
import { useQuickReply } from './use-quick-reply';
import { useEndChat } from './use-end-chat';
import { useFetchMessageHistory } from './use-message-history';

/**
 * Custom hook for chat actions
 * @param {Object} params - Parameters
 * @param {string} userInput - Current user input
 * @param {Function} setUserInput - Setter for user input
 * @param {Function} setMessages - Setter for messages
 * @param {number} messageIndex - Current message index
 * @param {Function} setShowEndChatModal - Setter for end chat modal
 * @param {Function} setIsErrorState - Setter for error state
 * @param {string} serviceName - Service name
 * @param {Function} onChatEnded - Callback for chat ended
 * @param {string} localStorageKey - Local storage key
 * @returns {Object} Action handlers
 */
export function useChatActions(params) {

  const { userInput, setUserInput, setMessages, messageIndex, setIsErrorState } = params;

  const sendMessageHandlers = useSendMessage({
    userInput,
    setUserInput,
    setMessages,
    messageIndex,
    setIsErrorState
  });

  const quickReplyHandlers = useQuickReply();
  const endChatHandlers = useEndChat(params);
  const fetchHistoryHandlers = useFetchMessageHistory(params);

  return {
    ...sendMessageHandlers,
    ...quickReplyHandlers,
    ...endChatHandlers,
    ...fetchHistoryHandlers,
  };

}
