/**
 * Message utility functions
 */

/**
 * Map historical messages from Genesys format to standard format
 */
export function mapHistoricalMessagesToStandardMessageFormat(historicalMessages) {
  return historicalMessages.map(message => {
    return {
      channel: {
        time: message.timestamp,
        messageId: message.id
      },
      direction: message.messageType,
      type: message.type,
      text: message.text,
      originatingEntity: message.originatingEntity,
      content: message.quickReplies
    };
  });
}

/**
 * Clear agent typing indicator on outbound human message
 */
export function clearAgentTypingOnOutboundHumanMessage(message, agentTypingCallback) {
  if (message?.direction === 'Outbound' && message?.originatingEntity === 'Human') {
    agentTypingCallback();
  }
}

let previousHasEnded = false;

/**
 * Check if chat has ended by looking for Presence Disconnect event
 */
export function checkChatEnded(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    previousHasEnded = false;
    return false;
  }

  const lastMessage = messages[messages.length - 1];
  const hasEnded =
    lastMessage.originatingEntity === 'Human' &&
    lastMessage.direction === 'Outbound' &&
    Array.isArray(lastMessage.events) &&
    lastMessage.events.some(
      (event) =>
        event.eventType === 'Presence' &&
        event.presence?.type === 'Disconnect'
    );

  const shouldShowHint = hasEnded && !previousHasEnded;
  previousHasEnded = hasEnded;
  return shouldShowHint;
}
