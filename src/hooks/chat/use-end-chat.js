import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';

export function useEndChat({ setShowEndChatModal, serviceName, onChatEnded, localStorageKey }) {
  const handleEndChat = useCallback((e) => {
    e.preventDefault();

    setShowEndChatModal(false);

    genesysService.log('info', 'Ending conversation as per user request', { service: serviceName });
    genesysService.clearConversation(localStorageKey);

    onChatEnded();
  }, [setShowEndChatModal, serviceName, localStorageKey, onChatEnded]);

  return { handleEndChat };
}
