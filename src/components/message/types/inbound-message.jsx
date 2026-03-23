import MessageMetaData from '../message-meta';
import MessageText from '../message-text';
import { formatDate } from '../../../utils/index';

export default function InboundTextMessage({ message }) {
  const formattedTime = formatDate(message.channel.time);
  return (
    <div className='inbound-message-wrapper'
      role="article"
      aria-label="Inbound message"
      data-testid="inbound-message">

      <MessageText
        messageType='Inbound'
        text={message.text} />
      <MessageMetaData
        metaDataType='Inbound'
        messageTimeStamp={formattedTime}
        metaDisplay='You'
      />
    </div>
  );
}
