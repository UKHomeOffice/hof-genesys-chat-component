import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';

/**
 * Custom hook for handling ending a chat.
 * 
 * @param {function} setShowEndChatModal - function callback to set the showEndChatModal state
 * @param {string} serviceName - the name of the service consuming this library
 * @param {function} onChatEnded - the function callback to invoke upon ending a chat
 * @param {string} localStorageKey - the value of the key in localstorage  
 * @returns 
 */
export function useEndChat({ setShowEndChatModal, serviceName, onChatEnded, localStorageKey }) {
  const handleEndChat = useCallback((event) => {
    event.preventDefault();

    setShowEndChatModal(false);

    genesysService.log('info', 'Ending conversation as per user request', { service: serviceName });
    genesysService.clearConversation(localStorageKey);

    onChatEnded();
  }, [setShowEndChatModal, serviceName, localStorageKey, onChatEnded]);

  return { handleEndChat };
}
