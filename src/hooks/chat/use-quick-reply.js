import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';

/**
 * Custom hook for handling quick replies - which is just 
 * calling sendMessage with the quick reply payload.
 * @returns {Object} use quick reply handler
 */
export function useQuickReply({ setIsErrorState }) {
  const handleQuickReply = useCallback((event, reply) => {
    event.preventDefault();
    genesysService.sendMessageToGenesys(
      reply,
      () => setIsErrorState(true)
    );
  }, [setIsErrorState]);

  return { handleQuickReply };
}
