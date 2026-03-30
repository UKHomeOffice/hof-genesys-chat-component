jest.useFakeTimers();

// ---- Mocks: services ----
jest.mock('../../src/services/genesys-service', () => ({
  genesysService: {
    subscribeToGenesysMessages: jest.fn(),
    subscribeToGenesysOffline: jest.fn(),
    subscribeToGenesysReconnected: jest.fn(),
    subscribeToGenesysOldMessages: jest.fn(),
    subscribeToSessionRestored: jest.fn(),
    subscribeAgentTyping: jest.fn(),
    unSubscribeAgentTyping: jest.fn(),
    subscribeToErrors: jest.fn(),
  },
}));

// ---- Mocks: message-utils ----
jest.mock('../../src/utils/message-utils', () => ({
  clearAgentTypingOnOutboundHumanMessage: jest.fn(),
  mapHistoricalMessagesToStandardMessageFormat: jest.fn(msgs => msgs),
  checkChatEnded: jest.fn(),
}));

// ---- Mocks: genesys-agent ----
jest.mock('../../src/utils/genesys-agent', () => ({
  getCurrentAgentName: jest.fn(),
  setAgentConnectedBanner: jest.fn((prev, text) => [...prev, { banner: 'connected', text }]),
  setAgentDisconnectedBanner: jest.fn((state, text) => [...state, { banner: 'disconnected', text }]),
  setOfflineBanner: jest.fn((prev, text) => [...prev, { banner: 'offline', text }]),
  setReconnectedBanner: jest.fn((prev, text) => [...prev, { banner: 'reconnected', text }]),
}));

// ---- Mocks: quick-replies ----
jest.mock('../../src/utils/quick-replies', () => ({
  setHideContentPropertyOnAllQuickReplies: jest.fn((msgs, hidden) => msgs.map(m => ({ ...m, hidden }))),
  getQuickReplyIndex: jest.fn(() => 5),
  hidePreviousQuickReplyMessages: jest.fn(prev => prev.map(p => ({ ...p, hideContent: true }))),
  hideHistoricalQuickReplyMessages: jest.fn(msgs => msgs.map(m => ({ ...m, historical: true }))),
}));

import { renderHook, act } from '@testing-library/react';
import { useGenesysSubscriptions } from '../../src/hooks/use-genesys-subscriptions';
import { genesysService } from '../../src/services/genesys-service';
import { clearAgentTypingOnOutboundHumanMessage, checkChatEnded } from '../../src/utils/message-utils';
import {
  getCurrentAgentName,
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner,
} from '../../src/utils/genesys-agent';
import {
  setHideContentPropertyOnAllQuickReplies,
  getQuickReplyIndex,
  hidePreviousQuickReplyMessages,
  hideHistoricalQuickReplyMessages,
} from '../../src/utils/quick-replies';

describe('useGenesysSubscriptions', () => {
  const baseParams = (overrides = {}) => ({
    genesysIsReady: false,
    setMessages: jest.fn(fn => fn([])),
    setHistoricalMessages: jest.fn(fn => fn([])),
    setShouldScrollToLatestMessage: jest.fn(),
    setAgentIsTyping: jest.fn(),
    setLastQuickReplyMessageIndex: jest.fn(),
    setAllHistoryFetched: jest.fn(),
    setIsOffline: jest.fn(),
    setIsErrorState: jest.fn(),
    agentConnectedText: 'Agent joined',
    agentDisconnectedText: 'Agent left',
    offlineText: 'You are offline',
    onlineText: 'Back online',
    mergeChatHistory: jest.fn(),
    hasReconnectedRef: { current: false },
    setLastHistoryBatchCount: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when not ready: no Genesys subscriptions', () => {
    const params = baseParams({ genesysIsReady: false });

    renderHook(() => useGenesysSubscriptions(params));

    expect(genesysService.subscribeToGenesysMessages).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysOffline).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysReconnected).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysOldMessages).not.toHaveBeenCalled();
    expect(genesysService.subscribeToSessionRestored).not.toHaveBeenCalled();
    expect(genesysService.subscribeToErrors).not.toHaveBeenCalled();
    expect(genesysService.subscribeAgentTyping).not.toHaveBeenCalled();
    expect(genesysService.unSubscribeAgentTyping).not.toHaveBeenCalled();
  });

  test('messages subscription merges, sets indices, agent name, scroll flag, and clears typing', () => {
    const params = baseParams({ genesysIsReady: true });
    getCurrentAgentName.mockReturnValue('Agent Smith');
    checkChatEnded.mockReturnValue({ hasEnded: false, shouldShowHint: false });

    let onMessages;
    genesysService.subscribeToGenesysMessages.mockImplementation(callback => {
      onMessages = callback;
    });

    // Make clearAgentTyping call the provided "stop typing" callback immediately
    clearAgentTypingOnOutboundHumanMessage.mockImplementation((msg, stopCb) => stopCb());

    const { rerender } = renderHook(() => useGenesysSubscriptions(params));

    // simulate incoming messages
    const newMessages = [{ id: 'm1' }, { id: 'm2' }];
    act(() => {
      onMessages(newMessages);
    });

    // scroll & agent name
    expect(params.setShouldScrollToLatestMessage).toHaveBeenCalledWith(true);

    // setMessages flow
    expect(hidePreviousQuickReplyMessages).toHaveBeenCalledWith([]);
    expect(setHideContentPropertyOnAllQuickReplies).toHaveBeenCalledWith(newMessages, false);
    expect(getQuickReplyIndex).toHaveBeenCalledWith(expect.any(Array));
    expect(params.setLastQuickReplyMessageIndex).toHaveBeenCalledWith(5);

    // no chat-ended banner when checkChatEnded false
    expect(checkChatEnded).toHaveBeenCalled();
    expect(setAgentDisconnectedBanner).not.toHaveBeenCalled();

    // typing clear callback executed
    expect(params.setAgentIsTyping).toHaveBeenCalledWith(false);

    rerender(); // ensure no extra calls beyond registered ones
  });

  test('messages subscription adds disconnected banner when chat has ended', () => {
    const params = baseParams({ genesysIsReady: true });
    getCurrentAgentName.mockReturnValue('Agent Jane');
    checkChatEnded.mockReturnValue({ hasEnded: true, shouldShowHint: true });

    let onMessages;
    genesysService.subscribeToGenesysMessages.mockImplementation(callback => {
      onMessages = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    const newMessages = [{ id: 'mX' }];
    act(() => {
      onMessages(newMessages);
    });

    expect(checkChatEnded).toHaveBeenCalled();
    expect(setAgentDisconnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Agent left');
  });

  test('offline subscription sets offline state and adds offline banner', () => {
    const params = baseParams({ genesysIsReady: true });

    let onOffline;
    genesysService.subscribeToGenesysOffline.mockImplementation(callback => {
      onOffline = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    act(() => {
      onOffline();
    });

    expect(params.setIsOffline).toHaveBeenCalledWith(true);
    expect(params.setMessages).toHaveBeenCalled();
    expect(setOfflineBanner).toHaveBeenCalledWith(expect.any(Array), 'You are offline');
  });

  test('reconnected subscription flips flag, sets online, and schedules reconnected banner', () => {
    const params = baseParams({ genesysIsReady: true });

    let onReconnected;
    genesysService.subscribeToGenesysReconnected.mockImplementation(callback => {
      onReconnected = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    act(() => {
      onReconnected();
    });

    expect(params.hasReconnectedRef.current).toBe(true);
    expect(params.setIsOffline).toHaveBeenCalledWith(false);

    // Timer triggers banner update
    jest.runOnlyPendingTimers();
    expect(setReconnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Back online');
  });

  test('old messages subscription maps, appends to history, and merges', () => {
    const params = baseParams({ genesysIsReady: true });
    let onOldMessages, onAllFetched;

    genesysService.subscribeToGenesysOldMessages.mockImplementation((callback1, callback2) => {
      onOldMessages = callback1;
      onAllFetched = callback2;
    });

    renderHook(() => useGenesysSubscriptions(params));

    const historical = { messages: [{ id: 'h1' }, { id: 'h2' }] };
    act(() => {
      onOldMessages(historical);
    });

    expect(hideHistoricalQuickReplyMessages).toHaveBeenCalledWith(historical.messages);
    expect(params.mergeChatHistory).toHaveBeenCalledWith(
      expect.arrayContaining([{ id: 'h1', historical: true }, { id: 'h2', historical: true }])
    );

    // end-of-history
    act(() => {
      onAllFetched();
    });
    expect(params.setAllHistoryFetched).toHaveBeenCalledWith(true);
  });

  test('session restored merges history and scrolls when NOT a reconnect event', () => {
    const params = baseParams({ genesysIsReady: true, hasReconnectedRef: { current: false } });
    let onRestored;

    genesysService.subscribeToSessionRestored.mockImplementation(callback => {
      onRestored = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    const historical = { messages: [{ id: 'sh1' }] };
    act(() => {
      onRestored(historical);
    });

    expect(hideHistoricalQuickReplyMessages).toHaveBeenCalledWith(historical.messages);
    expect(params.mergeChatHistory).toHaveBeenCalled();
    expect(params.setShouldScrollToLatestMessage).toHaveBeenCalledWith(true);
  });

  test('session restored does nothing when hasReconnectedRef.current is true', () => {
    const params = baseParams({ genesysIsReady: true, hasReconnectedRef: { current: true } });
    let onRestored;

    genesysService.subscribeToSessionRestored.mockImplementation(callback => {
      onRestored = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    act(() => {
      onRestored({ messages: [{ id: 'ignored' }] });
    });

    expect(hideHistoricalQuickReplyMessages).not.toHaveBeenCalled();
    expect(params.setHistoricalMessages).not.toHaveBeenCalled();
    expect(params.mergeChatHistory).not.toHaveBeenCalled();
    expect(params.setShouldScrollToLatestMessage).not.toHaveBeenCalled();
  });

  test('agent typing: subscribe triggers banner and typing=true; unsubscribe callback sets typing=false', () => {
    const params = baseParams({genesysIsReady: true });

    let onTypingCallback;
    let unTypingCallback;

    genesysService.subscribeAgentTyping.mockImplementation(callback => {
      onTypingCallback = callback;
    });
    genesysService.unSubscribeAgentTyping.mockImplementation(callback => {
      unTypingCallback = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    // Simulate typing started
    act(() => {
      onTypingCallback();
    });

    expect(params.setAgentIsTyping).toHaveBeenCalledWith(true);
    expect(setAgentConnectedBanner).toHaveBeenCalledTimes(1);
    expect(setAgentConnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Agent joined');

    // Simulate typing timeout
    act(() => {
      unTypingCallback();
    });
    expect(params.setAgentIsTyping).toHaveBeenCalledWith(false);
  });

  test('agent typing: first typing event triggers ONE banner', () => {
    const params = baseParams({genesysIsReady: true });

    let onTypingCallback;

    genesysService.subscribeAgentTyping.mockImplementation(cb => {
      onTypingCallback = cb;
    });

    renderHook(() => useGenesysSubscriptions(params));

    act(() => {
      onTypingCallback();
    });

    expect(params.setAgentIsTyping).toHaveBeenCalledWith(true);
    expect(setAgentConnectedBanner).toHaveBeenCalledTimes(1);
    expect(setAgentConnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Agent joined');
  });

  test('agent typing: subsequent typing events DO NOT add more banners', () => {
    const params = baseParams({genesysIsReady: true });

    let onTypingCallback;

    genesysService.subscribeAgentTyping.mockImplementation(cb => {
      onTypingCallback = cb;
    });

    renderHook(() => useGenesysSubscriptions(params));

    // First typing → banner
    act(() => onTypingCallback());

    // Reset mock call count to isolate subsequent checks
    setAgentConnectedBanner.mockClear();

    // More typing events
    act(() => onTypingCallback());
    act(() => onTypingCallback());
    act(() => onTypingCallback());

    // No more banners
    expect(setAgentConnectedBanner).not.toHaveBeenCalled();
  });

  test('agent typing: typing after disconnect shows NEW banner again', () => {
    const params = baseParams({genesysIsReady: true });

    let onTypingCallback;
    let onMessagesCallback;

    genesysService.subscribeAgentTyping.mockImplementation(cb => {
      onTypingCallback = cb;
    });

    genesysService.subscribeToGenesysMessages.mockImplementation(cb => {
      onMessagesCallback = cb;
    });

    // Simulate chat end detection
    checkChatEnded.mockReturnValue({ hasEnded: true, shouldShowHint: true });

    renderHook(() => useGenesysSubscriptions(params));

    // ---- First agent typing → SHOW banner
    act(() => onTypingCallback());
    expect(setAgentConnectedBanner).toHaveBeenCalledTimes(1);

    setAgentConnectedBanner.mockClear();

    // ---- Agent disconnects
    act(() => onMessagesCallback([{ id: 'disconnect-event' }]));

    // ---- New typing event → SHOW banner again
    act(() => onTypingCallback());

    expect(setAgentConnectedBanner).toHaveBeenCalledTimes(1);
  });

  test('error subscription sets error state when ready', () => {
    const params = baseParams({ genesysIsReady: true });

    let onError;
    genesysService.subscribeToErrors.mockImplementation(callback => {
      onError = callback;
    });

    renderHook(() => useGenesysSubscriptions(params));

    act(() => {
      onError();
    });

    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('no error subscription when not ready', () => {
    const params = baseParams({ genesysIsReady: false });
    renderHook(() => useGenesysSubscriptions(params));
    expect(genesysService.subscribeToErrors).not.toHaveBeenCalled();
  });
});
