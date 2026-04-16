import { useRef, useEffect } from 'react';

export default function EndChatModal({ showModal, handleCloseModal, handleEndChat }) {

  const endChatModalRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      endChatModalRef.current.showModal();
    } else {
      endChatModalRef.current.close();
    }
  }, [showModal]);

  /**
   * Specifically prevent the Escape key from closing the modal, 
   * as this is a critical action and we want to ensure users make a deliberate choice.
   * @param {object} event - The keyboard event object 
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
    }
  };

  return (
    <>
      {showModal && (
        <div className="end-chat-modal-backdrop" />
      )}
      <dialog
        ref={endChatModalRef}
        className="end-chat-modal"
        id="end-chat-modal"
        data-testid="end-chat-modal"
        onKeyDown={handleKeyDown}>
        <h1 className="govuk-heading-l" data-testid="end-chat-modal-heading">Do you want to end the chat?</h1>
        <p className="govuk-body">Ending the chat will clear the chat history and refresh the page.</p>
        <p className="govuk-body">Are you sure you want to end the chat?</p>
        <form id="end-chat-modal-form" data-testid="end-chat-modal-form" method="dialog">
          <div className="govuk-!-width-full end-chat-modal-buttons">
            <button
              type='button'
              data-testid="close-end-chat-modal-button"
              id="close-end-chat-modal-button"
              className="govuk-button govuk-button--secondary"
              value="cancel"
              onClick={handleCloseModal}>
              No, keep chatting
            </button>
            <button
              type='button'
              data-testid="confirm-end-chat-button"
              id="confirm-end-chat-button"
              className="govuk-button govuk-button--warning"
              value="default"
              onClick={handleEndChat}>
              Yes, end chat
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
