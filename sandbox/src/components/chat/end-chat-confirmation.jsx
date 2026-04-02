export default function EndChatConfirmation() {
  return (
    <div>
      <h1 className="govuk-heading-l">Your chat has ended</h1>
      <p className="govuk-body">
        You can <a href="/" className="govuk-link" data-testid="new-chat-link">start a new chat</a>.
      </p>
    </div>
  );
}
