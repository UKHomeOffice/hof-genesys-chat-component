import { useCallback, useRef } from 'react';
import { genesysService } from '../../services/genesys-service';

/**
 * Manages history fetch requests and prevents concurrent history calls.
 *
 * @param {Object} params - Hook parameters
 * @param {Function} params.setIsErrorState - Sets the chat error state
 * @returns {{handleFetchMessageHistory: Function, onHistoryFetchComplete: Function}}
 * Action callbacks for starting and completing history fetches
 */
export function useFetchMessageHistory({ setIsErrorState }) {
  const isFetchingHistoryRef = useRef(false);

  /**
   * Starts a history fetch when there is no in-flight request.
   *
   * @returns {boolean} True when a fetch is started, otherwise false
   */
  const handleFetchMessageHistory = useCallback(() => {
    if (isFetchingHistoryRef.current) {
      return false;
    }

    isFetchingHistoryRef.current = true;
    genesysService.fetchMessageHistory(() => {
      isFetchingHistoryRef.current = false;
      setIsErrorState(true);
    });

    return true;
  }, [setIsErrorState]);

  /**
   * Clears the in-flight flag after a history batch is processed.
   */
  const onHistoryFetchComplete = useCallback(() => {
    isFetchingHistoryRef.current = false;
  }, []);

  return {
    handleFetchMessageHistory,
    onHistoryFetchComplete,
  };
}
