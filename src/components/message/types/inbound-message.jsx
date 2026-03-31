import MessageMetaData from '../message-meta';
import MessageText from '../message-text';
import MessageWrapper from '../delegates/message-wrapper';

export default function InboundMessage({ message, isLast, lastMessageRef }) {
  const timestamp = message.channel?.time || message.timestamp;
  return (
    <MessageWrapper isLast={isLast} lastMessageRef={lastMessageRef}>
      <div className="inbound-message-wrapper"
        role="article"
        aria-label="Inbound message"
        data-testid="inbound-message-wrapper">
        <MessageText type='Inbound' text={message.text} />
        <MessageMetaData type='Inbound' messageTimeStamp={timestamp} metaDisplay='You' />
      </div>
    </MessageWrapper>
  );
}
