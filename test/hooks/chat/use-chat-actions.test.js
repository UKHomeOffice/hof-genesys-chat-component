import { renderHook, act } from '@testing-library/react';
import { useChatActions } from '../../../src/hooks/chat/use-chat-actions';

// Mock genesysService
jest.mock('../../../src/services/genesys-service', () => ({
  genesysService: {
    sendMessageToGenesys: jest.fn(),
    fetchMessageHistory: jest.fn(),
    clearConversation: jest.fn(),
    log: jest.fn(),
  },
}));

// Mock utility
jest.mock('../../../src/utils/quick-replies', () => ({
  hideQuickReplyMessageAtIndex: jest.fn((idx, prev, flag) => {
    return [{ mock: true, idx, prev, flag }];
  }),
}));

import { genesysService } from '../../../src/services/genesys-service';
import { hideQuickReplyMessageAtIndex } from '../../../src/utils/quick-replies';

describe('useChatActions', () => {
  const createParams = (overrides = {}) => ({
    userInput: '',
    setUserInput: jest.fn(),
    setMessages: jest.fn(callback => callback([])),
    lastQuickReplyMessageIndex: -1,
    setShowEndChatModal: jest.fn(),
    setIsErrorState: jest.fn(),
    serviceName: 'svc',
    onChatEnded: jest.fn(),
    localStorageKey: 'KEY',
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleQuickReply prevents default and sends reply to Genesys', () => {
    const params = createParams();
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleQuickReply(event, 'reply-text');
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('reply-text', expect.any(Function));
  });

  test('handleFetchMessageHistory triggers fetch and calls error callback', () => {
    const params = createParams();

    genesysService.fetchMessageHistory.mockImplementation(callback => callback());
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.handleFetchMessageHistory();
    });

    expect(genesysService.fetchMessageHistory).toHaveBeenCalled();
    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('sendMessage prevents default, sends message and clears input', () => {
    const params = createParams({ userInput: 'Hi', lastQuickReplyMessageIndex: -1 });
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Hi',
      expect.any(Function)
    );
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('sendMessage hides content when index != -1 and input not empty', () => {
    const params = createParams({ userInput: 'Test', lastQuickReplyMessageIndex: 3 });
    const { result } = renderHook(() => useChatActions(params));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(params.setMessages).toHaveBeenCalled();
    expect(hideQuickReplyMessageAtIndex).toHaveBeenCalledWith(
      3,
      expect.any(Array),
      true
    );
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('sendMessage triggers error callback on Genesys failure', () => {
    const params = createParams({ userInput: 'ErrorTest' });

    // Simulate Genesys error path
    genesysService.sendMessageToGenesys.mockImplementation((msg, errorCallback) => errorCallback());

    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.sendMessage({ preventDefault: jest.fn() });
    });

    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('handleKeyPress does nothing on non-Enter key', () => {
    const params = createParams({ userInput: 'Test', lastQuickReplyMessageIndex: 1 });
    const { result } = renderHook(() => useChatActions(params));

    const event = { key: 'a', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
    expect(params.setMessages).not.toHaveBeenCalled();
  });

  test('handleKeyPress ignores Enter when shift is held', () => {
    const params = createParams({ userInput: 'Test', lastQuickReplyMessageIndex: 1 });
    const { result } = renderHook(() => useChatActions(params));

    const event = { key: 'Enter', shiftKey: true, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
  });

  test('handleKeyPress sends message on Enter with no shift', () => {
    const params = createParams({ userInput: 'Hello', lastQuickReplyMessageIndex: 2 });
    const { result } = renderHook(() => useChatActions(params));

    const event = { key: 'Enter', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Hello',
      expect.any(Function)
    );
    expect(params.setMessages).toHaveBeenCalled();
    expect(params.setUserInput).toHaveBeenCalledWith('');
  });

  test('handleEndChat closes modal, logs event, clears conversation, calls callback', () => {
    const params = createParams({
      serviceName: 'svc',
      localStorageKey: 'KEY',
    });

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
      { service: 'svc' }
    );

    expect(genesysService.clearConversation).toHaveBeenCalledWith('KEY');
    expect(params.onChatEnded).toHaveBeenCalled();
  });
});
