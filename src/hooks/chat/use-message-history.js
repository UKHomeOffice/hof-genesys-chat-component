import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';

/**
 * Custom hook for fetching message history
 * 
 * @param {function} setIsErrorState - the function callback to set the error state
 * @returns 
 */
export function useFetchMessageHistory({ setIsErrorState }) {
  const handleFetchMessageHistory = useCallback(() => {
    genesysService.fetchMessageHistory(() => setIsErrorState(true));
  }, [setIsErrorState]);

  return { handleFetchMessageHistory };
}
