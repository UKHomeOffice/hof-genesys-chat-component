const getCurrentAgentName = (currentMessage) => {
  if (currentMessage?.direction === 'Outbound' &&
    currentMessage?.channel?.from?.nickname)
    return currentMessage.channel.from.nickname;
};

const isConnectedToAgent = (message) => {
  return !!(message?.direction === 'Outbound' &&
    message?.channel?.from?.nickname);
};

function setBanner(messages, bannerProps, bannerType) {
  const lastIndex = messages.length - 1;
  const lastMsg = messages[lastIndex];

  // If the last message is an offline or reconnected banner, update it in place
  if (lastMsg && (lastMsg.offline || lastMsg.reconnected)) {
    const updatedBanner = {
      ...lastMsg,
      text: bannerProps.text,
      type: bannerProps.type || 'Banner',
      direction: bannerProps.direction || 'Outbound',
      originatingEntity: bannerProps.originatingEntity || 'System',
      offline: false,
      reconnected: false,
      [bannerType]: true
    };
    // Replace the last message with the updated banner
    return [...messages.slice(0, lastIndex), updatedBanner];
  }

  // Otherwise, append a new banner
  const banner = {
    text: bannerProps.text,
    type: bannerProps.type || 'Banner',
    direction: bannerProps.direction || 'Outbound',
    originatingEntity: bannerProps.originatingEntity || 'System',
    [bannerType]: true
  };
  return [...messages, banner];
}

const setAgentConnectedBanner = (messages, humanText) => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.connected) {
    return messages;
  }
  return setBanner(
    messages,
    {
      text: humanText,
      type: 'Banner',
      direction: 'Outbound',
      originatingEntity: 'Human'
    },
    'connected'
  );
};

const setAgentDisconnectedBanner = (messages, agentDisconnectedText) => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.disconnected) {
    return messages;
  }
  return setBanner(
    messages,
    {
      text: agentDisconnectedText,
      type: 'Banner',
      direction: 'Outbound',
      originatingEntity: 'Human'
    },
    'disconnected'
  );
};

const setOfflineBanner = (messages, offlineText) =>
  setBanner(
    messages,
    { text: offlineText },
    'offline'
  );

const setReconnectedBanner = (messages, onlineText) =>
  setBanner(
    messages,
    { text: onlineText },
    'reconnected'
  );

export {
  getCurrentAgentName,
  isConnectedToAgent,
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner
};
