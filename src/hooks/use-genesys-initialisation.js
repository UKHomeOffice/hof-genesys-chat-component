import { useEffect } from 'react';
import { genesysService } from '../services/genesys-service';

/**
 * Initializes the Genesys Web Messaging SDK.
 *
 * Responsibilities:
 * 1. Load the Genesys script if not already present.
 * 2. Initialise a conversation when the SDK is available
 * 
 * @param {Object} params - Parameters
 * @param {string} deploymentId - Deployment ID
 * @param {Function} setGenesysIsReady - Setter for Genesys ready
 * @param {Function} setIsErrorState - Setter for error state
 */
export function useGenesysInitialization({
  genesysEnvironment,
  deploymentId,
  setGenesysIsReady,
  setIsErrorState,
}) {

  /**
   * Initialise the Genesys SDK script if it hasn't been loaded yet.
   */
  useEffect(() => {
    if (globalThis.Genesys) {
      setGenesysIsReady(true);
    } else {
      genesysService.loadGenesysScript(genesysEnvironment, deploymentId);
    }
  }, [setGenesysIsReady, genesysEnvironment, deploymentId]);

  /**
   * Initialise the Genesys conversation when the Genesys SDK is ready.
   */
  useEffect(() => {
    if (globalThis.Genesys) {
      genesysService.initialiseGenesysConversation(
        () => setGenesysIsReady(true),
        () => setIsErrorState(true),
        deploymentId        
      );
    }
  }, [setGenesysIsReady, setIsErrorState, deploymentId]);
}
