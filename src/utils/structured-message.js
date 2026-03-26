// Common predicate for identifying a structured outbound message with content
const isStructuredOutbound = (msg) =>
  msg?.direction === 'Outbound' &&
  msg?.type === 'Structured' &&
  Boolean(msg?.content);

// Set hideContent on ALL structured outbound messages (produces new array)
const setHideContentProperty = (messages, boolValue) =>
  messages.map((message) =>
    isStructuredOutbound(message)
      ? { ...message, hideContent: boolValue }
      : message
  );

// Find LAST structured outbound message index
const getStructureMessageIndex = (messages) => {
  return [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => isStructuredOutbound(message))?.index ?? -1;
};

// Set hideContent on a specific message index (returns new array)
const setHideContentPropertyWithIndex = (messageIndex, prevMessages, boolValue) => {
  return prevMessages.map((message, index) =>
    index === messageIndex && message?.content
      ? {
        ...message,
        hideContent: boolValue,
      }
      : message
  );
};

// Mutates messages by setting hideContent=true on all matching messages
const setPreviousStructureHideTrue = (prevMessages) => {
  prevMessages.forEach((msg) => {
    if (isStructuredOutbound(msg)) {
      msg.hideContent = true;
    }
  });
  return prevMessages;
};

const setHideContentToHistoricalMessages = (messages) => {
  const withAllHidden = setHideContentProperty(messages, true);
  const index = getStructureMessageIndex(withAllHidden);

  if (index === -1) {
    return withAllHidden;
  }

  // Unhide the last structured one
  return setHideContentPropertyWithIndex(index, withAllHidden, false);
};

export {
  isStructuredOutbound,
  getStructureMessageIndex,
  setHideContentProperty,
  setHideContentPropertyWithIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages,
};
