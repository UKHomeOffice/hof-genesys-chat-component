import MessageMetaData from '../message-meta';
import MessageText from '../message-text';
import MessageWrapper from '../delegates/message-wrapper';
import StructuredMessage from './structured-message';

function resolveMetaDisplay(message, botMetaDisplay) {
  return message.channel?.from?.nickname ?? botMetaDisplay ?? 'Digital assistant';
}

export default function OutboundTextMessage({
  message,
  isLast,
  lastMessageRef,
  handleQuickReply,
  utmParam,
  botMetaDisplay
}) {

  const timestamp = message.channel?.time || message.timestamp;
  return (
    <MessageWrapper isLast={isLast} lastMessageRef={lastMessageRef}>
      <div className='outbound-message-wrapper'
        role="article"
        aria-label="Outbound message"
        data-testid="outbound-message-wrapper">

        <MessageText type='Outbound' text={message.text} utmParam={utmParam} />
        <MessageMetaData
          type='Outbound'
          messageTimeStamp={timestamp}
          metaDisplay={resolveMetaDisplay(message, botMetaDisplay)} />

        {message.type === 'Structured' && !message.hideContent &&
          <StructuredMessage contents={message.content} handleQuickReply={handleQuickReply} />
        }
      </div>
    </MessageWrapper>
  );
}
