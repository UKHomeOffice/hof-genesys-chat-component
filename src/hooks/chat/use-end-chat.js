import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';

/**
 * Custom hook for handling ending a chat.
 * 
 * @param {function} setShowEndChatModal - function callback to set the showEndChatModal state
 * @param {string} serviceName - the name of the service consuming this library
 * @param {function} onChatEnded - the function callback to invoke upon ending a chat
 * @returns 
 */
export function useEndChat({ setShowEndChatModal, serviceName, onChatEnded }) {
  const handleEndChat = useCallback((event) => {
    event.preventDefault();

    setShowEndChatModal(false);

    genesysService.log('info', 'Ending conversation as per user request', { service: serviceName });
    genesysService.clearConversation();

    onChatEnded();
  }, [setShowEndChatModal, serviceName, onChatEnded]);

  return { handleEndChat };
}
