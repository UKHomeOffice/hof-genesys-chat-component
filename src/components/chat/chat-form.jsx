import CharacterCounter from '../error/character-counter';

export default function ChatForm({
  inputMessage,
  setInputMessage,
  sendMessage,
  handleKeyPress,
  showEndChatModal,
  isOffline,
  maxCharacterLimit
}) {
  const isDisable = inputMessage.length > maxCharacterLimit;

  const handleEndChat = (event) => {
    event.preventDefault();
    showEndChatModal();
  };

  return (
    <div className="chat-form-container">
      <form id="chat-messenger-form" data-testid='chat-messenger-form'>
        <div className='govuk-!-width-full label-section'>
          <label className="govuk-label govuk-caption-l" htmlFor="message-input">
            Enter a message
          </label>

          <CharacterCounter 
            maxCharacterLimit={maxCharacterLimit}
            textLength={inputMessage.length} 
          />
        </div>
        <div className="govuk-!-width-full">
          <textarea
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => !isDisable && handleKeyPress(e)}
            id="message-input"
            data-testid="message-input"
            aria-describedby="message-input"
            className={`govuk-textarea ${isDisable ? 'govuk-textarea--error' : null}`}
            rows="5"
            disabled={isOffline}
          />
        </div>

        <div className="govuk-!-width-full messenger-buttons">
          <button
            type='button'
            data-testid="end-chat-button"
            id="end-chat-button"
            className="govuk-button govuk-button--secondary"
            data-module="govuk-button"
            onClick={(event) => handleEndChat(event)}
            disabled={isOffline}>
            End chat
          </button>
          <button
            type='button'
            data-testid="send-message-button"
            id="send-button"
            className="govuk-button"
            onClick={(event) => sendMessage(event)}
            disabled={isDisable || isOffline}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
