import { renderHook, act } from '@testing-library/react';
import { useChatActions } from '../../src/hooks/chat/use-chat-actions';
import { genesysService } from '../../src/services/genesys-service';
import { hideQuickReplyMessageAtIndex } from '../../src/utils/quick-replies';

jest.mock('../../src/services/genesys-service', () => ({
  genesysService: {
    sendMessageToGenesys: jest.fn(),
    clearConversation: jest.fn(),
    fetchMessageHistory: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('../../src/utils/quick-replies', () => ({
  hideQuickReplyMessageAtIndex: jest.fn((index, prev, value) => {
    return [{ placeholder: true, index, prev, value }];
  }),
}));

describe('useChatActions', () => {
  const createParams = (overrides = {}) => {
    const params = {
      userInput: '',
      setUserInput: jest.fn(),
      setMessages: jest.fn(fn => fn([])),
      lastQuickReplyMessageIndex: -1,
      setShowEndChatModal: jest.fn(),
      setIsErrorState: jest.fn(),
      serviceName: 'test-service',
      onChatEnded: jest.fn(),
      localStorageKey: 'CHAT_KEY',
      ...overrides,
    };
    return params;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleQuickReply sends message via Genesys', () => {
    const params = createParams();
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleQuickReply(event, 'reply-text');
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('reply-text');
  });

  test('handleFetchMessageHistory triggers fetch and sets error on failure', () => {
    const params = createParams();
    const { result } = renderHook(() => useChatActions(params));

    // Simulate Genesys invoking error callback
    genesysService.fetchMessageHistory.mockImplementation(cb => cb());

    act(() => {
      result.current.handleFetchMessageHistory();
    });

    expect(genesysService.fetchMessageHistory).toHaveBeenCalled();
    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('sendMessage sends message & clears input', () => {
    const params = createParams({
      userInput: 'hello world',
      lastQuickReplyMessageIndex: -1,
    });
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'hello world',
      expect.any(Function)
    );
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('sendMessage hides content when lastQuickReplyMessageIndex != -1 and input length > 0', () => {
    const params = createParams({
      userInput: 'test',
      lastQuickReplyMessageIndex: 2,
    });
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(params.setMessages).toHaveBeenCalled();
    expect(hideQuickReplyMessageAtIndex).toHaveBeenCalledWith(
      2,
      expect.any(Array),
      true
    );
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('handleKeyPress sends message on Enter and no shift', () => {
    const params = createParams({
      lastQuickReplyMessageIndex: 1,
      userInput: 'abc'
    });
    const { result } = renderHook(() => useChatActions(params));

    const event = { key: 'Enter', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalled();
    expect(params.setMessages).toHaveBeenCalled();
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('handleKeyPress does nothing on non-Enter key', () => {
    const params = createParams();
    const { result } = renderHook(() => useChatActions(params));

    const event = { key: 'a', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
  });

  test('handleEndChat logs, clears conversation, closes modal, and triggers callback', () => {
    const params = createParams();
    const { result } = renderHook(() => useChatActions(params));
    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleEndChat(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(params.setShowEndChatModal).toHaveBeenCalledWith(false);

    expect(genesysService.log).toHaveBeenCalledWith(
      'info',
      'Ending conversation as per user request',
      { service: 'test-service' }
    );

    expect(genesysService.clearConversation).toHaveBeenCalledWith('CHAT_KEY');
    expect(params.onChatEnded).toHaveBeenCalled();
  });

  test('handleSendMessageToGenesys calls error callback on failure', () => {
    const params = createParams({ userInput: 'test' });

    // Simulate Genesys error
    genesysService.sendMessageToGenesys.mockImplementation((msg, errorCb) => errorCb());

    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.sendMessage({ preventDefault: jest.fn() });
    });

    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });
});
