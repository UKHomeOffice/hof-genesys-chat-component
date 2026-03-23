import { useEffect } from 'react';
import { useNavigationType } from 'react-router';
import { genesysService } from '../services/genesys-service';

/**
 * Custom hook for Genesys initialization
 * @param {Object} params - Parameters
 * @param {string} deploymentId - Deployment ID
 * @param {string} localStorageKey - Local storage key
 * @param {Function} setGenesysIsReady - Setter for Genesys ready
 * @param {Function} setIsErrorState - Setter for error state
 */
export function useGenesysInitialization({
  genesysEnvironment,
  deploymentId,
  localStorageKey,
  setGenesysIsReady,
  setIsErrorState,
}) {
  const navigationType = useNavigationType();

  /**
   * Initialise the Genesys SDK script if it hasn't been loaded yet.
   */
  useEffect(() => {
    if (globalThis.Genesys) {
      setGenesysIsReady(true);
    } else {      
      genesysService.loadGenesysScript(genesysEnvironment, deploymentId);
    }
  }, [deploymentId, genesysEnvironment, setGenesysIsReady]);

  /**
   * Initialise the Genesys conversation when the Genesys SDK is ready.
   */
  useEffect(() => {
    if (globalThis.Genesys || navigationType === 'POP') {
      genesysService.initialiseGenesysConversation(
        () => setGenesysIsReady(true),
        () => setIsErrorState(true),
        localStorageKey
      );
    }
  }, [localStorageKey, setGenesysIsReady, setIsErrorState, navigationType]);
}
