import { useCallback } from 'react';
import { genesysService } from '../services/genesys-service';
import { setHideContentPropertyWithIndex } from '../utils/structured-message';

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
export function useChatActions({
  userInput,
  setUserInput,
  setMessages,
  messageIndex,
  setShowEndChatModal,
  setIsErrorState,
  serviceName,
  onChatEnded,
  localStorageKey,
}) {
  const handleSendMessageToGenesys = useCallback(() => {
    genesysService.sendMessageToGenesys(
      userInput,
      () => setIsErrorState(true)
    );
  }, [userInput, setIsErrorState]);

  const sendMessage = useCallback((event) => {
    event.preventDefault();
    handleSendMessageToGenesys();
    if (messageIndex !== -1 && userInput.length !== 0) {
      setMessages((prevMessages) => setHideContentPropertyWithIndex(messageIndex, prevMessages, true));
    }
    setUserInput('');
  }, [handleSendMessageToGenesys, messageIndex, userInput, setMessages, setUserInput]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessageToGenesys();
      if (messageIndex !== -1) {
        setMessages((prevMessages) => setHideContentPropertyWithIndex(messageIndex, prevMessages, true));
      }
      setUserInput('');
    }
  }, [handleSendMessageToGenesys, messageIndex, setMessages, setUserInput]);

  const handleSetInputMessage = useCallback((value) => {
    setUserInput(value);
  }, [setUserInput]);

  const handleQuickReply = useCallback((event, reply) => {
    event.preventDefault();
    genesysService.sendMessageToGenesys(reply);
  }, []);

  const handleEndChat = useCallback((event) => {
    event.preventDefault();
    setShowEndChatModal(false);

    genesysService.log('info', 'Ending conversation as per user request', { service: serviceName });
    genesysService.clearConversation(localStorageKey);

    // Call provided onChatEnded callback
    onChatEnded();    
  }, [setShowEndChatModal, serviceName, localStorageKey, onChatEnded]);

  const handleFetchMessageHistory = useCallback(() => {
    genesysService.fetchMessageHistory(() => setIsErrorState(true));
  }, [setIsErrorState]);

  return {
    sendMessage,
    handleKeyPress,
    handleSetInputMessage,
    handleQuickReply,
    handleEndChat,
    handleFetchMessageHistory,
  };
}
