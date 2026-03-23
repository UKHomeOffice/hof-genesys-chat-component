import { useEffect } from 'react';
import { genesysService } from '../services/genesys-service';
import {
  clearAgentTypingOnOutboundHumanMessage,
  checkChatEnded,
} from '../utils/message-utils';
import {
  getCurrentAgentName,
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner,
} from '../utils/genesys-agent';
import {
  setHideContentProperty,
  getStructureMessageIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages,
} from '../utils/structured-message';

/**
 * Custom hook to handle Genesys subscriptions
 * @param {Object} params - Parameters
 * @param {boolean} genesysIsReady - If Genesys is ready
 * @param {Function} setMessages - Setter for messages
 * @param {Function} setHistoricalMessages - Setter for historical messages
 * @param {Function} setShouldScrollToLatestMessage - Setter for scroll flag
 * @param {Function} setAgentIsTyping - Setter for agent typing
 * @param {Function} setAgentName - Setter for agent name
 * @param {Function} setMessageIndex - Setter for message index
 * @param {Function} setAllHistoryFetched - Setter for history fetched
 * @param {Function} setIsOffline - Setter for offline state
 * @param {Function} setIsErrorState - Setter for error state
 * @param {string} agentConnectedText - Text for agent connected
 * @param {string} agentDisconnectedText - Text for agent disconnected
 * @param {string} offlineText - Text for offline
 * @param {string} onlineText - Text for online
 * @param {Function} mergeChatHistory - Function to merge history
 * @param {Object} hasReconnectedRef - Ref for reconnection
 */
export function useGenesysSubscriptions({
  genesysIsReady,
  setMessages,
  setHistoricalMessages,
  setShouldScrollToLatestMessage,
  setAgentIsTyping,
  setAgentName,
  setMessageIndex,
  setAllHistoryFetched,
  setIsOffline,
  setIsErrorState,
  agentConnectedText,
  agentDisconnectedText,
  offlineText,
  onlineText,
  mergeChatHistory,
  hasReconnectedRef,
}) {

  /**
   * Subscribe to Genesys messages received once the Genesys SDK is ready.
   * We pass a callback function to set state with the new messages. As part of this
   * function we handle several important tasks:
   * - Set the shouldScrollToLatestMessage state to true to ensure the latest message is visible
   * - Try to set the agent name from the latest message received (if the user has asked to speak to an agent)
   * - Merge the new messages with the existing messages state, ensuring we format them to the standard message format
   * - Clear the agent typing indicator if an outbound human message is received
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToGenesysMessages((newMessages) => {
        setShouldScrollToLatestMessage(true);
        setAgentName(getCurrentAgentName(newMessages[0]));
        setMessages((prevMessages) => {
          const currentMessages = setPreviousStructureHideTrue(prevMessages);
          let newState = [...currentMessages, ...setHideContentProperty(newMessages, false)];
          setMessageIndex(getStructureMessageIndex(newState));
          if (checkChatEnded(newState)) {
            newState = setAgentDisconnectedBanner(newState, agentDisconnectedText);
          }
          return newState;
        });
        clearAgentTypingOnOutboundHumanMessage(
          newMessages[0],
          () => setAgentIsTyping(false)
        );
      });
    }
  }, [
    genesysIsReady, 
    setMessages, 
    setShouldScrollToLatestMessage, 
    setAgentName, 
    setMessageIndex, 
    agentDisconnectedText, 
    setAgentIsTyping
  ]);

  /**
   * Subscribe to Genesys connection status events (offline and reconnected) once the Genesys SDK is ready.
   * This effect ensures that the chat displays appropriate banners when the user goes offline or comes back online.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToGenesysOffline(() => {
        setIsOffline(true);
        setMessages((prevMessages) => setOfflineBanner(prevMessages, offlineText));
      });
      genesysService.subscribeToGenesysReconnected(() => {
        hasReconnectedRef.current = true;
        setIsOffline(false);
        setTimeout(() => {
          setMessages((prevMessages) => setReconnectedBanner(prevMessages, onlineText));
        }, 10);
      });
    }
  }, [genesysIsReady, setIsOffline, setMessages, offlineText, onlineText, hasReconnectedRef]);

  /**
   * Subscribe to older Genesys messages once the Genesys SDK is ready.
   * We pass a callback function to set state with the historical messages
   * and also merge them with the main messages state, after we've formatted
   * them to the standard message format.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToGenesysOldMessages(
        (historicalMessages) => {
          const currentHistorialMessages = setHideContentToHistoricalMessages(historicalMessages.messages);
          setHistoricalMessages((prevMessages) => [...prevMessages, ...currentHistorialMessages]);
          mergeChatHistory(currentHistorialMessages);
        },
        () => setAllHistoryFetched(true)
      );
    }
  }, [genesysIsReady, setHistoricalMessages, mergeChatHistory, setAllHistoryFetched]);

  /**
   * Subscribe to session restored events to fetch historical messages.
   * This will fetch a subset (most recent) of previous messages from Genesys.
   * As these messages are in the 'historical' format, we need to map them to the 
   * standard message format before merging them with the main messages state.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToSessionRestored((historicalMessages) => {
        /**
         * If page is refreshed this will assign hideContent 
         * property to recieved old messages from Genesys.
         * 
         * Only restore session messages if this is not a reconnect event. I.e.
         * the user has not lost connection and reconnected.
         */
        if (!hasReconnectedRef.current) {
          const currentHistorialMessages = setHideContentToHistoricalMessages(historicalMessages.messages);
          setHistoricalMessages((prevMessages) => [...prevMessages, ...currentHistorialMessages]);
          mergeChatHistory(currentHistorialMessages);
          setShouldScrollToLatestMessage(true);
        }
      });
    }
  }, [genesysIsReady, setHistoricalMessages, mergeChatHistory, hasReconnectedRef, setShouldScrollToLatestMessage]);

  /**
   * Setup agent typing indicator. Create a callback function to pass to the Genesys subcription,
   * which will set state to display the typing indicator once typingReceived event is emitted from Genesys.
   * We also subcribe to the typingTimeout event through a unsubcribeAgentTyping callback to ensure the indicator
   * is removed when the agent has stopped typing. 
   */
  useEffect(() => {
    const onAgentTyping = () => {
      setAgentIsTyping(true);
      setMessages((prevMessages) => setAgentConnectedBanner(prevMessages, agentConnectedText));
    };
    genesysService.subscribeAgentTyping(onAgentTyping);
    genesysService.unSubscribeAgentTyping(() => setAgentIsTyping(false));
  }, [setAgentIsTyping, setMessages, agentConnectedText]);

  /**
   * Subscribe to Genesys errors once the SDK is ready.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToErrors(() => setIsErrorState(true));
    }
  }, [genesysIsReady, setIsErrorState]);
}
