import { resolveMessageComponent } from './delegates/message-registry';
import { useScrollTopHistoryFetch } from '../../hooks/chat/use-scroll-top-history-fetch';

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
const resolveLastTextIndex = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.text !== undefined) return i;
  }
  return -1;
};

export default function Messages({
  messages,
  lastMessageRef,
  handleQuickReply,
  fetchMessageHistory,
  allHistoryFetched,
  serviceName,
  utmParam,
  botMetaDisplay
}) {
  const lastTextIndex = resolveLastTextIndex(messages);
  const { messageContainerRef, handleMessageContainerScroll } = useScrollTopHistoryFetch({
    messages,
    fetchMessageHistory,
    allHistoryFetched,
  });

  return (
    <div className="chat-messages" role="log"
      aria-labelledby="chat-heading"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Chat messages"
      ref={messageContainerRef}
      onScroll={handleMessageContainerScroll}>
      {messages.length > 0 && messages.map((message, index) => {
        const MessageComponent = resolveMessageComponent(message);
        if (!MessageComponent) {
          return null;
        }

        return (
          <MessageComponent
            key={index}
            message={message}
            isLast={index === lastTextIndex}
            lastMessageRef={lastMessageRef}
            handleQuickReply={handleQuickReply}
            serviceName={serviceName}
            utmParam={utmParam}
            botMetaDisplay={botMetaDisplay}
          />
        );
      })}
    </div>
  );
}
