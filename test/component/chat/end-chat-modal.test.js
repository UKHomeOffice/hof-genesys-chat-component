import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndChatModal from '../../../src/components/chat/end-chat-modal';

// Mock the dialog prototype methods as JSDOM does not implement them
beforeAll(() => {
  window.HTMLDialogElement.prototype.showModal = jest.fn();
  window.HTMLDialogElement.prototype.close = jest.fn();
});

describe('EndChatModal component', () => {
  const handleCloseModal = jest.fn();
  const handleEndChat = jest.fn();

  beforeEach(() => {
    handleCloseModal.mockClear();
    handleEndChat.mockClear();
  });

  test('renders the dialog always, but not open when open is false', () => {
    render(
      <EndChatModal
        showModal={false}
        handleCloseModal={handleCloseModal}
        handleEndChat={handleEndChat}
      />
    );

    const dialogModal = screen.queryByTestId('end-chat-modal');
    expect(dialogModal).toBeInTheDocument();
    expect(dialogModal.open).toBe(false);
  });

  test('renders modal and backdrop when showModal is true', () => {
    render(
      <EndChatModal
        showModal={true}
        handleCloseModal={handleCloseModal}
        handleEndChat={handleEndChat}
      />
    );
    expect(screen.getByTestId('end-chat-modal')).toBeInTheDocument();
    expect(screen.getByTestId('end-chat-modal-form')).toBeInTheDocument();
    expect(document.querySelector('.end-chat-modal-backdrop')).toBeInTheDocument();
    
    const heading = screen.getByTestId('end-chat-modal-heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Do you want to end the chat?');
    
    // Check text blocks are correct
    expect(screen.getByText(/Ending the chat will clear the chat history and refresh the page./i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to end the chat?/i)).toBeInTheDocument();
    
    const closeModalButton = screen.getByTestId('close-end-chat-modal-button');
    expect(closeModalButton).toBeInTheDocument();
    expect(closeModalButton).toHaveTextContent('No, keep chatting');
    expect(closeModalButton).toHaveClass('govuk-button govuk-button--secondary'); 

    const confirmEndChatButton = screen.getByTestId('confirm-end-chat-button');
    expect(confirmEndChatButton).toBeInTheDocument();
    expect(confirmEndChatButton).toHaveTextContent('Yes, end chat');
  });

  test('calls handleCloseModal when "No" button is clicked', async () => {
    render(
      <EndChatModal
        showModal={true}
        handleCloseModal={handleCloseModal}
        handleEndChat={handleEndChat}
      />
    );
    
    await userEvent.click(screen.getByTestId('close-end-chat-modal-button'));
    
    expect(handleCloseModal).toHaveBeenCalledTimes(1);
    expect(handleEndChat).not.toHaveBeenCalled();
  });

  test('calls handleEndChat when "Yes" button is clicked', async () => {
    render(
      <EndChatModal
        showModal={true}
        handleCloseModal={handleCloseModal}
        handleEndChat={handleEndChat}
      />
    );
   
    await userEvent.click(screen.getByTestId('confirm-end-chat-button'));

    expect(handleEndChat).toHaveBeenCalledTimes(1);
    expect(handleCloseModal).not.toHaveBeenCalled();
  });
});
