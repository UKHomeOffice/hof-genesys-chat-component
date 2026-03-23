
// Set visibility property to structured message
const setHideContentProperty = (recievedMessage, boolValue) => {
  recievedMessage.map(message => {
    if (message?.direction === 'Outbound' &&
      message?.type === 'Structured' &&
      message?.content) {
      Object.defineProperty(message.content, 'hideContent', { value: boolValue, writable: true });
    }
  });
  return recievedMessage;
};

const getStructureMessageIndex = (messages) => {
  let totalMesssages = messages.length - 1;
  for (totalMesssages; totalMesssages >= 0; totalMesssages--) {
    if (messages[totalMesssages]?.direction === 'Outbound' &&
      messages[totalMesssages]?.type === 'Structured' &&
      messages[totalMesssages]?.content) {
      return totalMesssages;
    }
  }
  return -1;
};

const setHideContentPropertyWithIndex = (messageIndex, prevMessages, boolValue) => {
  if (prevMessages.length >= 0) {
    const currentState = [...prevMessages];
    currentState.forEach((message, index) => {
      if (index === messageIndex)
        message.content.hideContent = boolValue;
    });
    return currentState;
  }
  return prevMessages;
};

const setPreviousStructureHideTrue = (prevMessages) => {

  if (prevMessages.length >= 0) {
    prevMessages.map((message) => {
      if (message?.direction === 'Outbound' &&
        message?.type === 'Structured' &&
        message?.content) {
        message.content.hideContent = true;
      }
    });
  }
  return prevMessages;
};

const setHideContentToHistoricalMessages = (messages) => {
  const currentMessages = setHideContentProperty(messages, true);

  const getMessageIndex = getStructureMessageIndex(currentMessages);
  if (getMessageIndex !== -1)
    [...currentMessages,
      ...setHideContentPropertyWithIndex(getMessageIndex,
        messages, false)];

  return currentMessages;
};

export {
  getStructureMessageIndex,
  setHideContentProperty,
  setHideContentPropertyWithIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages
};
