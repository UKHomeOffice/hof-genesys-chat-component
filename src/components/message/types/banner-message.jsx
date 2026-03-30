import MessageWrapper from '../delegates/message-wrapper';

export default function BannerMessage({ message, isLast, lastMessageRef }) {
  return (
    <MessageWrapper isLast={isLast} lastMessageRef={lastMessageRef}>
      <div className="chat-hint-message"
        role="article"
        aria-label="Banner message"
        data-testid="banner-message">
        <p className="govuk-body">{message.text}</p>
      </div>
    </MessageWrapper>
  );
}
