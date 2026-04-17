import { useEffect } from 'react';

/**
 * Custom hook for handling error state updates.
 * 
 * @param {Boolean} isErrorState - true/false to indicate whether the component is in an error state
 * @param {Function} errorCallback - Callback for handling error events
 */
export function useErrorState({ isErrorState, errorCallback }) {

  /**
   * useEffect to handle error state changes. When isErrorState is set to true, 
   * the provided errorCallback will be fired. This allows the component to 
   * delegate error handling to the consuming service, which can choose 
   * how to display error messages or take other actions in response to errors.
   */
  useEffect(() => {
    if (isErrorState) {
      errorCallback();
    }
  }, [isErrorState, errorCallback]);
}
