/**
 * Message utility functions
 */

/**
 * Map historical messages from Genesys format to standard format.
 * Ensure each message has a root level id and timestamp attribute
 * as these are used in determining chronological message order.
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
      content: message.quickReplies,
      id: message.id ?? message.metadata?.id ?? message.channel?.messageId ?? crypto.randomUUID(),
      timestamp: message.timestamp
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

/**
 * Check if chat has ended by looking for Presence Disconnect event
 * @param {Array} messages - The array of messages
 * @param {boolean} previousHasEnded - The previous ended state
 * @returns {Object} { hasEnded: boolean, shouldShowHint: boolean }
 */
export function checkChatEnded(messages, previousHasEnded = false) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { hasEnded: false, shouldShowHint: false };
  }

  const lastMessage = messages.at(-1);
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
  return { hasEnded, shouldShowHint };
}
