/**
 * Renders quick-reply buttons for a structured message.
 * Visibility is controlled entirely by hideContent on the message object,
 * managed upstream in useGenesysSubscriptions — no local hidden state needed.
 */
export default function StructuredMessage({ contents, handleQuickReply }) {
  const handleKeyDown = (event, content) => {
    if (event.key === 'Enter') {
      handleQuickReply(event, content.quickReply.text || content.quickReply.payload);
    }
  };

  return (
    <div className='govuk-button-group select-question'>
      {contents.map((content, index) => (
        <button key={index}
          data-testid='quick-reply-button'
          className='govuk-button message-button'
          onClick={(event) => handleQuickReply(event, content.quickReply.text || content.quickReply.payload)}
          onKeyDown={(event) => handleKeyDown(event, content)}>
          {content.quickReply.text}
        </button>
      ))}
    </div>
  );
}
