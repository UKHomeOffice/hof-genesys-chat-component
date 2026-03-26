// Common predicate for identifying a structured outbound message with content
const isQuickReply = (msg) =>
  msg?.direction === 'Outbound' &&
  msg?.type === 'Structured' &&
  Boolean(msg?.content);

// Set hideContent on ALL quick reply buttons
const setHideContentPropertyOnAllQuickReplies = (messages, boolValue) =>
  messages.map((message) =>
    isQuickReply(message)
      ? { ...message, hideContent: boolValue }
      : message
  );

// Find LAST structured outbound message index
const getQuickReplyIndex = (messages) => {
  return [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => isQuickReply(message))?.index ?? -1;
};

// Set hideContent on a specific message index (returns new array)
const hideQuickReplyMessageAtIndex = (lastQuickReplyMessageIndex, prevMessages, boolValue) => {
  return prevMessages.map((message, index) =>
    index === lastQuickReplyMessageIndex && message?.content
      ? {
        ...message,
        hideContent: boolValue,
      }
      : message
  );
};

// Mutates messages by setting hideContent=true on all matching messages
const hidePreviousQuickReplyMessages = (prevMessages) => {
  prevMessages.forEach((msg) => {
    if (isQuickReply(msg)) {
      msg.hideContent = true;
    }
  });
  return prevMessages;
};

const hideHistoricalQuickReplyMessages = (messages) => {
  const withAllHidden = setHideContentPropertyOnAllQuickReplies(messages, true);
  const index = getQuickReplyIndex(withAllHidden);

  if (index === -1) {
    return withAllHidden;
  }

  // Unhide the last quick reply
  return hideQuickReplyMessageAtIndex(index, withAllHidden, false);
};

export {
  getQuickReplyIndex,
  setHideContentPropertyOnAllQuickReplies,
  hideQuickReplyMessageAtIndex,
  hidePreviousQuickReplyMessages,
  hideHistoricalQuickReplyMessages,
};
