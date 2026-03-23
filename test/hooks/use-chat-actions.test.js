import { renderHook, act } from '@testing-library/react';
import { useChatActions } from '../../src/hooks/use-chat-actions';

// Mock genesysService
jest.mock('../../src/services/genesys-service', () => ({
  genesysService: {
    sendMessageToGenesys: jest.fn(),
    fetchMessageHistory: jest.fn(),
    clearConversation: jest.fn(),
    log: jest.fn(),
  },
}));

// Mock utility
jest.mock('../../src/utils/structured-message', () => ({
  setHideContentPropertyWithIndex: jest.fn((idx, prev, flag) => {
    return [{ mock: true, idx, prev, flag }];
  }),
}));

import { genesysService } from '../../src/services/genesys-service';
import { setHideContentPropertyWithIndex } from '../../src/utils/structured-message';

describe('useChatActions', () => {
  const createParams = (overrides = {}) => ({
    userInput: '',
    setUserInput: jest.fn(),
    setMessages: jest.fn(cb => cb([])),
    messageIndex: -1,
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

  test('handleSetInputMessage sets user input', () => {
    const p = createParams();
    const { result } = renderHook(() => useChatActions(p));

    act(() => {
      result.current.handleSetInputMessage('hello');
    });

    expect(p.setUserInput).toHaveBeenCalledWith('hello');
  });

  test('handleQuickReply prevents default and sends reply to Genesys', () => {
    const p = createParams();
    const { result } = renderHook(() => useChatActions(p));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleQuickReply(event, 'reply-text');
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('reply-text');
  });

  test('handleFetchMessageHistory triggers fetch and calls error callback', () => {
    const p = createParams();

    genesysService.fetchMessageHistory.mockImplementation(cb => cb());
    const { result } = renderHook(() => useChatActions(p));

    act(() => {
      result.current.handleFetchMessageHistory();
    });

    expect(genesysService.fetchMessageHistory).toHaveBeenCalled();
    expect(p.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('sendMessage prevents default, sends message and clears input', () => {
    const p = createParams({ userInput: 'Hi', messageIndex: -1 });
    const { result } = renderHook(() => useChatActions(p));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Hi',
      expect.any(Function)
    );
    expect(p.setUserInput).toHaveBeenCalledWith('');
  });

  test('sendMessage hides content when index != -1 and input not empty', () => {
    const p = createParams({ userInput: 'Test', messageIndex: 3 });
    const { result } = renderHook(() => useChatActions(p));

    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.sendMessage(event);
    });

    expect(p.setMessages).toHaveBeenCalled();
    expect(setHideContentPropertyWithIndex).toHaveBeenCalledWith(
      3,
      expect.any(Array),
      true
    );
    expect(p.setUserInput).toHaveBeenCalledWith('');
  });

  test('sendMessage triggers error callback on Genesys failure', () => {
    const p = createParams({ userInput: 'ErrorTest' });

    // Simulate Genesys error path
    genesysService.sendMessageToGenesys.mockImplementation((msg, errorCb) => errorCb());

    const { result } = renderHook(() => useChatActions(p));

    act(() => {
      result.current.sendMessage({ preventDefault: jest.fn() });
    });

    expect(p.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('handleKeyPress does nothing on non-Enter key', () => {
    const p = createParams({ userInput: 'Test', messageIndex: 1 });
    const { result } = renderHook(() => useChatActions(p));

    const event = { key: 'a', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
    expect(p.setMessages).not.toHaveBeenCalled();
  });

  test('handleKeyPress ignores Enter when shift is held', () => {
    const p = createParams({ userInput: 'Test', messageIndex: 1 });
    const { result } = renderHook(() => useChatActions(p));

    const event = { key: 'Enter', shiftKey: true, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
  });

  test('handleKeyPress sends message on Enter with no shift', () => {
    const p = createParams({ userInput: 'Hello', messageIndex: 2 });
    const { result } = renderHook(() => useChatActions(p));

    const event = { key: 'Enter', shiftKey: false, preventDefault: jest.fn() };

    act(() => {
      result.current.handleKeyPress(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Hello',
      expect.any(Function)
    );
    expect(p.setMessages).toHaveBeenCalled();
    expect(p.setUserInput).toHaveBeenCalledWith('');
  });

  test('handleEndChat closes modal, logs event, clears conversation, calls callback', () => {
    const p = createParams({
      serviceName: 'svc',
      localStorageKey: 'KEY',
    });

    const { result } = renderHook(() => useChatActions(p));
    const event = { preventDefault: jest.fn() };

    act(() => {
      result.current.handleEndChat(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(p.setShowEndChatModal).toHaveBeenCalledWith(false);

    expect(genesysService.log).toHaveBeenCalledWith(
      'info',
      'Ending conversation as per user request',
      { service: 'svc' }
    );

    expect(genesysService.clearConversation).toHaveBeenCalledWith('KEY');
    expect(p.onChatEnded).toHaveBeenCalled();
  });
});
