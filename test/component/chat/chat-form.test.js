import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatForm from '../../../src/components/chat/chat-form';

describe('ChatForm component', () => {

  const mockSendMessageToGenesys = jest.fn();
  const mockHandleEndChat = jest.fn();

  const sendMessage = () => {
    mockSendMessageToGenesys();
  };

  const handleKeyPress = () => {
    mockSendMessageToGenesys();
  };

  const handleEndChat = () => {
    mockHandleEndChat();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles user input submitted via button click', () => {
    render(
      <ChatForm
        inputMessage="Testing"
        setInputMessage={() => { }}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        maxCharacterLimit={4096}
      />
    );

    const sendMessageButton = screen.getByTestId('send-message-button');
    fireEvent.click(sendMessageButton);

    expect(mockSendMessageToGenesys).toHaveBeenCalledTimes(1);
  });

  test('handles user input submitted via pressing enter key', () => {
    render(
      <ChatForm
        inputMessage="Testing"
        setInputMessage={() => { }}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        maxCharacterLimit={4096}
      />
    );
    const messageInput = screen.getByTestId('message-input');
    fireEvent.keyDown(messageInput, { key: 'Enter', code: 'Enter', keyCode: 13, charCode: 13 });

    expect(mockSendMessageToGenesys).toHaveBeenCalledTimes(1);
  });

  test('calls showEndChatModal function when end chat is clicked', async () => {
    render(
      <ChatForm
        inputMessage="Testing"
        setInputMessage={() => { }}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        showEndChatModal={handleEndChat}
        maxCharacterLimit={4096}
      />
    );

    const endChatButton = screen.getByTestId('end-chat-button');
    await userEvent.click(endChatButton);

    expect(mockHandleEndChat).toHaveBeenCalledTimes(1);
  });

  test('renders buttons and form input as disabled when offline', () => {
    render(
      <ChatForm
        inputMessage="Testing"
        setInputMessage={() => { }}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        isOffline={true}
        maxCharacterLimit={4096}
      />
    );

    const sendMessageButton = screen.getByTestId('send-message-button');
    const endChatButton = screen.getByTestId('end-chat-button');
    const messageInput = screen.getByTestId('message-input');
    expect(sendMessageButton).toBeDisabled();
    expect(endChatButton).toBeDisabled();
    expect(messageInput).toBeDisabled();
  });

  test('prevents sendMessage when character limit is exceeded', async () => {
    const longMessage = 'A'.repeat(4097);

    render(
      <ChatForm
        inputMessage={longMessage}
        setInputMessage={() => { }}
        sendMessage={sendMessage}
        handleKeyPress={handleKeyPress}
        maxCharacterLimit={4096}
      />
    );

    const sendButton = screen.getByTestId('send-message-button');
    const messageInput = screen.getByTestId('message-input');
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toBeDisabled();

    // ensure clicking or pressing enter does not call sendMessage
    await userEvent.click(sendButton);
    expect(mockSendMessageToGenesys).toHaveBeenCalledTimes(0);

    fireEvent.keyDown(messageInput, { key: 'Enter', code: 'Enter', keyCode: 13, charCode: 13 });
    expect(mockSendMessageToGenesys).toHaveBeenCalledTimes(0);
  });
});
