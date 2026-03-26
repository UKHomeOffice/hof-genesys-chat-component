import { useEffect, useRef } from 'react';
import { genesysService } from '../services/genesys-service';
import {
  clearAgentTypingOnOutboundHumanMessage,
  checkChatEnded,
  mapHistoricalMessagesToStandardMessageFormat,
} from '../utils/message-utils';
import {
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner,
} from '../utils/genesys-agent';
import {
  setHideContentPropertyOnAllQuickReplies,
  getQuickReplyIndex,
  hidePreviousQuickReplyMessages,
  hideHistoricalQuickReplyMessages,
} from '../utils/quick-replies';
import { resetAgentBannerState, shouldShowAgentConnectedBanner } from './helpers/agent-banner-logic';

/**
 * Custom hook to handle Genesys subscriptions
 * @param {Object} params - Parameters
 * @param {boolean} genesysIsReady - If Genesys is ready
 * @param {Function} setMessages - Setter for messages
 * @param {Function} setShouldScrollToLatestMessage - Setter for scroll flag
 * @param {Function} setAgentIsTyping - Setter for agent typing
 * @param {Function} setLastQuickReplyMessageIndex - Setter for last quick reply message
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
  setShouldScrollToLatestMessage,
  setAgentIsTyping,
  setLastQuickReplyMessageIndex,
  setAllHistoryFetched,
  setIsOffline,
  setIsErrorState,
  agentConnectedText,
  agentDisconnectedText,
  offlineText,
  onlineText,
  mergeChatHistory,
  hasReconnectedRef,
  setLastHistoryBatchCount
}) {

  /*
   * Ref to track whether we have already shown a "connected" banner
   * for the current agent session. Reset to false on disconnect.
   */
  const hasShownConnectedBanner = useRef(false);

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
        setMessages((prevMessages) => {
          const currentMessages = hidePreviousQuickReplyMessages(prevMessages);
          let newState = [...currentMessages, ...setHideContentPropertyOnAllQuickReplies(newMessages, false)];
          setLastQuickReplyMessageIndex(getQuickReplyIndex(newState));
          if (checkChatEnded(newState)) {
            resetAgentBannerState(hasShownConnectedBanner);
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
    setLastQuickReplyMessageIndex,
    agentDisconnectedText,
    setAgentIsTyping
  ]);

  /**
   * Subscribe to connection status events once the SDK is ready.
   * - Offline: sets offline state and appends an offline banner
   * - Reconnected: clears offline state and appends a reconnected banner
   *
   * The reconnected banner is deferred by 10ms to avoid a race condition where
   * the banner is appended before the offline banner has been removed from state,
   * causing both to appear simultaneously. The timer is cleared on effect cleanup
   * to prevent a state update on an unmounted component.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToGenesysOffline(() => {
        setIsOffline(true);
        setMessages((prevMessages) => setOfflineBanner(prevMessages, offlineText));
      });

      let reconnectTimerId;

      genesysService.subscribeToGenesysReconnected(() => {
        hasReconnectedRef.current = true;
        setIsOffline(false);
        reconnectTimerId = setTimeout(() => {
          setMessages((prevMessages) => setReconnectedBanner(prevMessages, onlineText));
        }, 10);
      });

      return () => clearTimeout(reconnectTimerId);
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

          // Store original historical message batch size as it was delivered
          setLastHistoryBatchCount(historicalMessages.messages.length);

          const mappedMessages = mapHistoricalMessagesToStandardMessageFormat(
            hideHistoricalQuickReplyMessages(historicalMessages.messages)
          );

          mergeChatHistory(mappedMessages);
        },
        () => setAllHistoryFetched(true)
      );
    }
  }, [genesysIsReady, mergeChatHistory, setAllHistoryFetched, setLastHistoryBatchCount]);

  /**
   * Subscribe to session restored events to fetch historical messages.
   * This will fetch a subset (most recent) of previous messages from Genesys.
   * As these messages are in the 'historical' format, we need to map them to the 
   * standard message format before merging them with the main messages state.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToSessionRestored((historicalMessages) => {

        // Store original historical message batch size as it was delivered
        setLastHistoryBatchCount(historicalMessages.messages.length);

        /**
         * If page is refreshed this will assign hideContent 
         * property to recieved old messages from Genesys.
         * 
         * Only restore session messages if this is not a reconnect event. I.e.
         * the user has not lost connection and reconnected.
         */
        if (!hasReconnectedRef.current) {

          // Normalize & map each restored message before merging
          const normalizedMessages = historicalMessages.messages.map(message => ({
            ...message,
            // Ensure ID always exists for stable sort tie‑breaking
            id: message.id
              ?? message.metadata?.id
              ?? message.channel?.messageId
              ?? crypto.randomUUID(),

            // Ensure timestamp always exists and is consistently shaped
            timestamp: message.timestamp || message.channel?.time,
          }));


          const currentHistorialMessages = hideHistoricalQuickReplyMessages(normalizedMessages);
          mergeChatHistory(currentHistorialMessages);
          setShouldScrollToLatestMessage(true);
        }
      });
    }
  }, [genesysIsReady, mergeChatHistory, hasReconnectedRef, setShouldScrollToLatestMessage, setLastHistoryBatchCount]);

  /**
   * Setup agent typing indicator. Create a callback function to pass to the Genesys subcription,
   * which will set state to display the typing indicator once typingReceived event is emitted from Genesys.
   * We also subcribe to the typingTimeout event through a unsubcribeAgentTyping callback to ensure the indicator
   * is removed when the agent has stopped typing. 
   */
  useEffect(() => {
    if (genesysIsReady) {
      const onAgentTyping = () => {
        setAgentIsTyping(true);
        setMessages((prevMessages) => {
          const safePrevious = Array.isArray(prevMessages) ? prevMessages : [];

          // Show connected banner ONLY ONCE per agent session
          if (shouldShowAgentConnectedBanner(hasShownConnectedBanner)) {
            hasShownConnectedBanner.current = true;
            return setAgentConnectedBanner(safePrevious, agentConnectedText);
          } else {
            return [...safePrevious];
          }
        });
      };
      genesysService.subscribeAgentTyping(onAgentTyping);
      genesysService.unSubscribeAgentTyping(() => setAgentIsTyping(false));
    }
  }, [genesysIsReady, setAgentIsTyping, setMessages, agentConnectedText]);

  /**
   * Subscribe to Genesys errors once the SDK is ready.
   */
  useEffect(() => {
    if (genesysIsReady) {
      genesysService.subscribeToErrors(() => setIsErrorState(true));
    }
  }, [genesysIsReady, setIsErrorState]);
}

