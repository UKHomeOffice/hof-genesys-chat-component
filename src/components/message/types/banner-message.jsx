import AgentConnected from '../agent-connected';
import MessageWrapper from '../delegates/message-wrapper';

export default function BannerMessage({ message, isLast, lastMessageRef }) {
  return (
    <MessageWrapper isLast={isLast} lastMessageRef={lastMessageRef}>
      <AgentConnected text={message.text} />
    </MessageWrapper>
  );
}
