import {
  renderMessage,
  LoadMoreMessagesButton
} from './message-helpers';

export default function Messages({
  messages,
  historicalMessages,
  lastMessageRef,
  handleQuickReply,
  fetchMessageHistory,
  allHistoryFetched,
  serviceName,
  utmParam,
  botMetaDisplay
}) {

  /**
   * We only show the button to load more messages when there are at least 24 historical messages,
   * taking into account that some of these may be eventType messages which aren't text based messages.
   * These messages are filtered out before counting.
   * @returns {boolean} whether to show the Load More Messages button
   */
  const showLoadMoreMessagesButton = () => {
    // Filter out any eventType messages, as these aren't messages
    if (historicalMessages.length > 0) {
      const filteredHistoricalMessages = historicalMessages.filter(message => {
        return !message.hasOwnProperty('eventType');
      });
      return filteredHistoricalMessages.length >= 24 && !allHistoryFetched;
    }
    return false;
  };

  /**
   * Function to check if the last message contains text. Starting from the
   * provided index, it checks backwards through the messages array to find
   * a message that contains text.
   * Some messages are presence or event messages and do not contain text,
   * therefore we don't want to use these to determine which message to 
   * attach the lastMessageRef to for scrolling purposes.
   * @param {integer} indexToCheck the message index to check against.
   * @returns boolean - whether the last message contains text.
   */
  const lastMessageContainsText = (indexToCheck) => {
    for (let i = indexToCheck; i >= 0; i--) {
      if (messages[i] !== undefined && messages[i].text !== undefined) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="chat-messages" role="log"
      aria-labelledby="chat-heading"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Chat messages">
      <div className='load-messages-section'>
        {showLoadMoreMessagesButton() &&
          <LoadMoreMessagesButton onClick={fetchMessageHistory} />
        }
      </div>
      {messages.length !== 0 && (
        messages.map((message, index) => {
          if (message.type === 'Banner') {
            return (
              <div
                key={index}
                className="chat-hint-message"
                role="article"
                aria-label={message.disconnected ? 'Agent Disconnected' : 'Agent Joined'}
                ref={index === messages.length - 1 ? lastMessageRef : null}
              >
                <p className="govuk-body">{message.text}</p>
              </div>
            );
          }
          return renderMessage(
            message,
            index,
            lastMessageContainsText(messages.length - 1),
            lastMessageRef,
            handleQuickReply,
            serviceName,
            utmParam,
            botMetaDisplay
          );
        })
      )}
    </div>
  );
}
