import { renderHook, act } from '@testing-library/react';
import { useSendMessage } from '../../../src/hooks/chat/use-send-message';
import { genesysService } from '../../../src/services/genesys-service';

jest.mock('../../../src/services/genesys-service', () => ({
  genesysService: {
    sendMessageToGenesys: jest.fn(),
    fetchMessageHistory: jest.fn(),
    log: jest.fn(),
    clearConversation: jest.fn(),
  }
}));

describe('useSendMessage', () => {
  const setUserInput = jest.fn();
  const setMessages = jest.fn();
  const setIsErrorState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup({ userInput = 'Hello', lastQuickReplyMessageIndex = -1 } = {}) {
    return renderHook(() =>
      useSendMessage({
        userInput,
        setUserInput,
        setMessages,
        lastQuickReplyMessageIndex,
        setIsErrorState,
      })
    );
  }

  test('sends message to Genesys with error callback', () => {
    const { result } = setup({ userInput: 'Hello', lastQuickReplyMessageIndex: -1 });

    act(() => result.current.sendMessage({ preventDefault: jest.fn() }));

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Hello',
      expect.any(Function) // error handler
    );
  });

  test('does not send empty messages', () => {
    const { result } = setup({ userInput: '' });

    act(() => result.current.sendMessage({ preventDefault: jest.fn() }));

    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
  });

  test('clears user input after sending', () => {
    const { result } = setup({ userInput: 'Hello' });

    act(() => result.current.sendMessage({ preventDefault: jest.fn() }));

    expect(setUserInput).toHaveBeenCalledWith('');
  });

  test('hides structured message when lastQuickReplyMessageIndex >= 0', () => {
    const { result } = setup({ userInput: 'Hello', lastQuickReplyMessageIndex: 3 });

    act(() => result.current.sendMessage({ preventDefault: jest.fn() }));

    expect(setMessages).toHaveBeenCalledWith(expect.any(Function));
  });

  test('submitMessage is triggered by Enter keypress', () => {
    const preventDefault = jest.fn();
    const { result } = setup({ userInput: 'Test' });

    act(() =>
      result.current.handleKeyPress({
        key: 'Enter',
        shiftKey: false,
        preventDefault,
      })
    );

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalled();
  });
});
