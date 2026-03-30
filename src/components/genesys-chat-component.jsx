import { useEffect, useMemo } from 'react';
import ChatForm from './chat/chat-form.jsx';
import Messages from './message/messages.jsx';
import TypingIndicator from './message/typing-indicator.jsx';
import EndChatModal from './chat/end-chat-modal.jsx';
import { genesysService } from '../services/genesys-service';
import { useChatState } from '../hooks/use-chat-state.js';
import { useGenesysInitialization } from '../hooks/use-genesys-initialisation.js';
import { useGenesysSubscriptions } from '../hooks/use-genesys-subscriptions.js';
import { useChatActions } from '../hooks/chat/use-chat-actions.js';
import { useChatUI } from '../hooks/use-chat-ui.js';

/**
 * A reusable Genesys Chat Component for Home Office services
 * 
 * @param {string} deploymentId - The deployment ID for the Genesys instance
 * @param {object} serviceMetadata - An object containing metadata for the implementing service, including: 
 * - localStorageKey: The key to use for storing the chat session in local storage
 * - serviceName: The name of the service (e.g. ETA, eVisa, EUSS)
 * - agentConnectedText: Text to display when an agent connects to the chat
 * - agentDisconnectedText: Text to display when an agent disconnects from the chat
 * - offlineText: Text to display when the user goes offline
 * - onlineText: Text to display when the user comes back online
 * - utmParam: UTM parameters for link tracking by service 
 * - botMetaDisplay: Display name for the digital assistant in the chat UI
 * @param {Function} onChatEnded - Required callback when chat ends
 * @param {object} loadingSpinner - Loading spinner component to display while Genesys is initializing
 * @param {Function} loggingCallback - Callback for logging events (e.g. for analytics)
 * @param {number} maxCharacterLimit - Maximum character limit for user messages (default is 4096, which is the limit for Genesys messages)
 * @param {boolean} debugMode - Flag to enable debug mode on Genesys service for additional logging (default is false)
 * @param {object} errorComponent - Custom error component to display in case of an error
 * @returns {JSX.Element} Genesys Chat Component
 */
export default function GenesysChatComponent({
  genesysEnvironment,
  deploymentId,
  serviceMetadata = {},
  onChatEnded,
  loadingSpinner,
  loggingCallback = () => {},
  maxCharacterLimit = 4096, 
  debugMode = false, 
  errorComponent = {},
}) {

  /*
   * Resolve service metadata once per render cycle, applying defaults for any
   * properties the consuming service has not provided.
   */
  const destructuredServiceMetadata = useMemo(() => ({
    localStorageKey: serviceMetadata.localStorageKey || 'genesys_chat_session',
    serviceName: (serviceMetadata.serviceName || '').toLowerCase(),
    agentConnectedText: serviceMetadata.agentConnectedText || 'You are now connected to an agent.',
    agentDisconnectedText: serviceMetadata.agentDisconnectedText || 'The agent has disconnected.',
    offlineText: serviceMetadata.offlineText || 'You are offline. Please check your connection.',
    onlineText: serviceMetadata.onlineText || 'You are back online.',
    utmParam: serviceMetadata.utmParams || "",
    botMetaDisplay: serviceMetadata.botMetaDisplay || 'Digital assistant',
  }), [serviceMetadata]);

  /**
   * Initialise the genesysService with logging and debug mode settings on component mount.
   * The genesysService instance is used across the component and hooks to manage interactions with the Genesys SDK, 
   * so it's important to set these configurations at the top level of the component.
   */
  useEffect(() => {
    genesysService.setLogger(loggingCallback);
    genesysService.setDebugMode(debugMode);
  }, [loggingCallback, debugMode]);

  const chatState = useChatState();
  const {
    userInput,
    setUserInput,
    messages,
    setMessages,
    genesysIsReady,
    setGenesysIsReady,
    allHistoryFetched,
    setAllHistoryFetched,
    shouldScrollToLatestMessage,
    setShouldScrollToLatestMessage,
    agentIsTyping,
    setAgentIsTyping,
    isErrorState,
    setIsErrorState,
    lastQuickReplyMessageIndex,
    setLastQuickReplyMessageIndex,
    showEndChatModal,
    setShowEndChatModal,
    isOffline,
    setIsOffline,
    hasReconnectedRef,
    lastMessageRef,
    lastHistoryBatchCount,
    setLastHistoryBatchCount
  } = chatState;

  const { mergeChatHistory } = useChatUI({
    messages,
    shouldScrollToLatestMessage,
    setShouldScrollToLatestMessage,
    setMessages,
    lastMessageRef,
  });

  useGenesysInitialization({
    genesysEnvironment,
    deploymentId,
    localStorageKey: destructuredServiceMetadata.localStorageKey,
    setGenesysIsReady,
    setIsErrorState,
  });

  useGenesysSubscriptions({
    genesysIsReady,
    setMessages,
    setShouldScrollToLatestMessage,
    setAgentIsTyping,
    setLastQuickReplyMessageIndex,
    setAllHistoryFetched,
    setIsOffline,
    setIsErrorState,
    agentConnectedText: destructuredServiceMetadata.agentConnectedText,
    agentDisconnectedText: destructuredServiceMetadata.agentDisconnectedText,
    offlineText: destructuredServiceMetadata.offlineText,
    onlineText: destructuredServiceMetadata.onlineText,
    mergeChatHistory,
    hasReconnectedRef,    
    setLastHistoryBatchCount
  });

  const {
    sendMessage,
    handleKeyPress,    
    handleQuickReply,
    handleEndChat,
    handleFetchMessageHistory,
  } = useChatActions({
    userInput,  
    setUserInput,  
    setMessages,
    lastQuickReplyMessageIndex,
    setShowEndChatModal,
    setIsErrorState,
    serviceName: destructuredServiceMetadata.serviceName,
    onChatEnded,
    localStorageKey: destructuredServiceMetadata.localStorageKey,
  });

  return (
    <>
      {isErrorState && errorComponent}
      {!isErrorState && !genesysIsReady && loadingSpinner}
      {!isErrorState && genesysIsReady && (
        <>
          <Messages
            messages={messages}
            lastMessageRef={lastMessageRef}
            handleQuickReply={handleQuickReply}
            fetchMessageHistory={handleFetchMessageHistory}
            allHistoryFetched={allHistoryFetched}
            serviceName={destructuredServiceMetadata.serviceName}
            utmParam={destructuredServiceMetadata.utmParam}
            botMetaDisplay={destructuredServiceMetadata.botMetaDisplay}
            lastHistoryBatchCount={lastHistoryBatchCount}
          />
          {agentIsTyping && <TypingIndicator isAgentTyping={agentIsTyping} />}
          {showEndChatModal && (
            <EndChatModal
              showModal={showEndChatModal}
              handleCloseModal={() => setShowEndChatModal(false)}
              handleEndChat={handleEndChat}
            />
          )}
          <hr />
          <ChatForm
            inputMessage={userInput}
            setInputMessage={setUserInput}
            sendMessage={sendMessage}
            handleKeyPress={handleKeyPress}
            genesysIsReady={genesysIsReady}
            showEndChatModal={() => setShowEndChatModal(true)}
            isOffline={isOffline}
            maxCharacterLimit={maxCharacterLimit}
          />
        </>
      )}
    </>
  );
}
