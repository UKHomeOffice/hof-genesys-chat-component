export default function AgentConnected({ text }) {
  return (
    <div className="chat-hint-message"
      role="article"
      aria-label="Agent connected"
      data-testid="agent-banner">
      <p className="govuk-body">{text}</p>
    </div>
  );
}
