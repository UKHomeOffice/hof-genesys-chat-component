export default function TypingIndicator({ isAgentTyping }) {
  return (
    <div className={`typing-wrapper agent-typing-indicator govuk-body ${isAgentTyping ? 'show' : 'hidden'}`}
      aria-live="polite" role="status"
      data-testid="agent-typing">
      <div className='typing-indicator'>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};
