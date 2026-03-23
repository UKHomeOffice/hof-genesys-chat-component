import { render } from '@testing-library/react';
import CharacterCounter from '../../src/components/error/character-counter';
import Messages from '../../src/components/message/messages';
import MessageMetaData from '../../src/components/message/message-meta';
import MessageText from '../../src/components/message/message-text';
import InboundTextMessage from '../../src/components/message/types/inbound-message';
import OutboundTextMessage from '../../src/components/message/types/outbound-message';

const renderCharacterCouterComponent = (maxCharacterLimit, textLength) => {
  return render(
    <CharacterCounter
      maxCharacterLimit={maxCharacterLimit}
      textLength={textLength} />
  );
};

const renderTypingComponent = (agentName, isAgentTyping) => {
  return render(
    <TypingIndicator
      agentName={agentName}
      isAgentTyping={isAgentTyping} />
  );
};

const renderMessagesComponent = (messages, historicalMessages, allHistoryFetched) => {
  return render(
    <Messages
      messages={messages}
      historicalMessages={historicalMessages}
      lastMessageRef={null}
      handleQuickReply={null}
      fetchMessageHistory={null}
      allHistoryFetched={allHistoryFetched}
      serviceName="eta"
    />
  );
};

const renderMessageMetaDataComponent = (message) => {
  return render(
    <MessageMetaData message={message} />
  );
};

const renderMessageTextComponent = (text) => {
  return render(
    <MessageText message={text} />
  );
};

const renderInboundMessageComponent = (message) => {
  return render(
    <InboundTextMessage message={message} data-testid="inbound-message" />
  );
};

const renderOutboundMessageComponent = (message) => {
  return render(
    <OutboundTextMessage message={message} />
  );
};

module.exports = {
  renderTypingComponent,
  renderMessagesComponent,
  renderMessageMetaDataComponent,
  renderMessageTextComponent,
  renderInboundMessageComponent,
  renderOutboundMessageComponent,
  renderCharacterCouterComponent
};
