/**
 * Main barrel export for the Genesys Chat Library
 */

// Components
export { default as GenesysChatComponent } from './components/genesys-chat-component.jsx';

// Services
export { genesysService } from './services/genesys-service';

// Utilities
export {
  mapHistoricalMessagesToStandardMessageFormat,
  clearAgentTypingOnOutboundHumanMessage,
  checkChatEnded
} from './utils/message-utils';

export {
  getCurrentAgentName,
  isConnectedToAgent,
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner
} from './utils/genesys-agent';

export {
  setHideContentProperty,
  getStructureMessageIndex,
  setHideContentPropertyWithIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages
} from './utils/structured-message';

export {
  getConversationId,
  removeConversationId
} from './conversation/conversation-storage';
