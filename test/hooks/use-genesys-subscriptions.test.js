import { renderHook, act } from '@testing-library/react';
import { useGenesysSubscriptions } from '../../src/hooks/use-genesys-subscriptions';

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

// ---- Mocks: structured-message ----
jest.mock('../../src/utils/structured-message', () => ({
  setHideContentProperty: jest.fn((msgs, hidden) => msgs.map(m => ({ ...m, hidden }))),
  getStructureMessageIndex: jest.fn(() => 5),
  setPreviousStructureHideTrue: jest.fn(prev => prev.map(p => ({ ...p, hideContent: true }))),
  setHideContentToHistoricalMessages: jest.fn(msgs => msgs.map(m => ({ ...m, historical: true }))),
}));

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
  setHideContentProperty,
  getStructureMessageIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages,
} from '../../src/utils/structured-message';

describe('useGenesysSubscriptions', () => {
  const baseParams = (overrides = {}) => ({
    genesysIsReady: false,
    setMessages: jest.fn(fn => fn([])),
    setHistoricalMessages: jest.fn(fn => fn([])),
    setShouldScrollToLatestMessage: jest.fn(),
    setAgentIsTyping: jest.fn(),
    setAgentName: jest.fn(),
    setMessageIndex: jest.fn(),
    setAllHistoryFetched: jest.fn(),
    setIsOffline: jest.fn(),
    setIsErrorState: jest.fn(),
    agentConnectedText: 'Agent joined',
    agentDisconnectedText: 'Agent left',
    offlineText: 'You are offline',
    onlineText: 'Back online',
    mergeChatHistory: jest.fn(),
    hasReconnectedRef: { current: false },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when not ready: no Genesys subscriptions except typing setup', () => {
    const p = baseParams({ genesysIsReady: false });

    renderHook(() => useGenesysSubscriptions(p));

    expect(genesysService.subscribeToGenesysMessages).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysOffline).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysReconnected).not.toHaveBeenCalled();
    expect(genesysService.subscribeToGenesysOldMessages).not.toHaveBeenCalled();
    expect(genesysService.subscribeToSessionRestored).not.toHaveBeenCalled();
    expect(genesysService.subscribeToErrors).not.toHaveBeenCalled();

    // typing subscriptions are registered regardless of ready flag
    expect(genesysService.subscribeAgentTyping).toHaveBeenCalledTimes(1);
    expect(genesysService.unSubscribeAgentTyping).toHaveBeenCalledTimes(1);
  });

  test('messages subscription merges, sets indices, agent name, scroll flag, and clears typing', () => {
    const p = baseParams({ genesysIsReady: true });
    getCurrentAgentName.mockReturnValue('Agent Smith');
    checkChatEnded.mockReturnValue(false);

    let onMessages;
    genesysService.subscribeToGenesysMessages.mockImplementation(cb => {
      onMessages = cb;
    });

    // Make clearAgentTyping call the provided "stop typing" callback immediately
    clearAgentTypingOnOutboundHumanMessage.mockImplementation((msg, stopCb) => stopCb());

    const { rerender } = renderHook(() => useGenesysSubscriptions(p));

    // simulate incoming messages
    const newMessages = [{ id: 'm1' }, { id: 'm2' }];
    act(() => {
      onMessages(newMessages);
    });

    // scroll & agent name
    expect(p.setShouldScrollToLatestMessage).toHaveBeenCalledWith(true);
    expect(getCurrentAgentName).toHaveBeenCalledWith(newMessages[0]);
    expect(p.setAgentName).toHaveBeenCalledWith('Agent Smith');

    // setMessages flow
    expect(setPreviousStructureHideTrue).toHaveBeenCalledWith([]);
    expect(setHideContentProperty).toHaveBeenCalledWith(newMessages, false);
    expect(getStructureMessageIndex).toHaveBeenCalledWith(expect.any(Array));
    expect(p.setMessageIndex).toHaveBeenCalledWith(5);

    // no chat-ended banner when checkChatEnded false
    expect(checkChatEnded).toHaveBeenCalled();
    expect(setAgentDisconnectedBanner).not.toHaveBeenCalled();

    // typing clear callback executed
    expect(p.setAgentIsTyping).toHaveBeenCalledWith(false);

    rerender(); // ensure no extra calls beyond registered ones
  });

  test('messages subscription adds disconnected banner when chat has ended', () => {
    const p = baseParams({ genesysIsReady: true });
    getCurrentAgentName.mockReturnValue('Agent Jane');
    checkChatEnded.mockReturnValue(true);

    let onMessages;
    genesysService.subscribeToGenesysMessages.mockImplementation(cb => {
      onMessages = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    const newMessages = [{ id: 'mX' }];
    act(() => {
      onMessages(newMessages);
    });

    expect(checkChatEnded).toHaveBeenCalled();
    expect(setAgentDisconnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Agent left');
  });

  test('offline subscription sets offline state and adds offline banner', () => {
    const p = baseParams({ genesysIsReady: true });

    let onOffline;
    genesysService.subscribeToGenesysOffline.mockImplementation(cb => {
      onOffline = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    act(() => {
      onOffline();
    });

    expect(p.setIsOffline).toHaveBeenCalledWith(true);
    expect(p.setMessages).toHaveBeenCalled();
    expect(setOfflineBanner).toHaveBeenCalledWith(expect.any(Array), 'You are offline');
  });

  test('reconnected subscription flips flag, sets online, and schedules reconnected banner', () => {
    const p = baseParams({ genesysIsReady: true });

    let onReconnected;
    genesysService.subscribeToGenesysReconnected.mockImplementation(cb => {
      onReconnected = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    act(() => {
      onReconnected();
    });

    expect(p.hasReconnectedRef.current).toBe(true);
    expect(p.setIsOffline).toHaveBeenCalledWith(false);

    // Timer triggers banner update
    jest.runOnlyPendingTimers();
    expect(setReconnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Back online');
  });

  test('old messages subscription maps, appends to history, and merges', () => {
    const p = baseParams({ genesysIsReady: true });
    let onOld, onAllFetched;

    genesysService.subscribeToGenesysOldMessages.mockImplementation((cb1, cb2) => {
      onOld = cb1;
      onAllFetched = cb2;
    });

    renderHook(() => useGenesysSubscriptions(p));

    const historical = { messages: [{ id: 'h1' }, { id: 'h2' }] };
    act(() => {
      onOld(historical);
    });

    expect(setHideContentToHistoricalMessages).toHaveBeenCalledWith(historical.messages);
    expect(p.setHistoricalMessages).toHaveBeenCalled();
    expect(p.mergeChatHistory).toHaveBeenCalledWith(
      expect.arrayContaining([{ id: 'h1', historical: true }, { id: 'h2', historical: true }])
    );

    // end-of-history
    act(() => {
      onAllFetched();
    });
    expect(p.setAllHistoryFetched).toHaveBeenCalledWith(true);
  });

  test('session restored merges history and scrolls when NOT a reconnect event', () => {
    const p = baseParams({ genesysIsReady: true, hasReconnectedRef: { current: false } });
    let onRestored;

    genesysService.subscribeToSessionRestored.mockImplementation(cb => {
      onRestored = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    const historical = { messages: [{ id: 'sh1' }] };
    act(() => {
      onRestored(historical);
    });

    expect(setHideContentToHistoricalMessages).toHaveBeenCalledWith(historical.messages);
    expect(p.setHistoricalMessages).toHaveBeenCalled();
    expect(p.mergeChatHistory).toHaveBeenCalled();
    expect(p.setShouldScrollToLatestMessage).toHaveBeenCalledWith(true);
  });

  test('session restored does nothing when hasReconnectedRef.current is true', () => {
    const p = baseParams({ genesysIsReady: true, hasReconnectedRef: { current: true } });
    let onRestored;

    genesysService.subscribeToSessionRestored.mockImplementation(cb => {
      onRestored = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    act(() => {
      onRestored({ messages: [{ id: 'ignored' }] });
    });

    expect(setHideContentToHistoricalMessages).not.toHaveBeenCalled();
    expect(p.setHistoricalMessages).not.toHaveBeenCalled();
    expect(p.mergeChatHistory).not.toHaveBeenCalled();
    expect(p.setShouldScrollToLatestMessage).not.toHaveBeenCalled();
  });

  test('agent typing: subscribe triggers banner and typing=true; unsubscribe callback sets typing=false', () => {
    const p = baseParams({ genesysIsReady: false });

    let onTypingCb;
    let unTypingCb;
    genesysService.subscribeAgentTyping.mockImplementation(cb => {
      onTypingCb = cb;
    });
    genesysService.unSubscribeAgentTyping.mockImplementation(cb => {
      unTypingCb = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    // Simulate typing started
    act(() => {
      onTypingCb();
    });
    expect(p.setAgentIsTyping).toHaveBeenCalledWith(true);
    expect(setAgentConnectedBanner).toHaveBeenCalledWith(expect.any(Array), 'Agent joined');

    // Simulate typing timeout
    act(() => {
      unTypingCb();
    });
    expect(p.setAgentIsTyping).toHaveBeenCalledWith(false);
  });

  test('error subscription sets error state when ready', () => {
    const p = baseParams({ genesysIsReady: true });

    let onError;
    genesysService.subscribeToErrors.mockImplementation(cb => {
      onError = cb;
    });

    renderHook(() => useGenesysSubscriptions(p));

    act(() => {
      onError();
    });

    expect(p.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('no error subscription when not ready', () => {
    const p = baseParams({ genesysIsReady: false });
    renderHook(() => useGenesysSubscriptions(p));
    expect(genesysService.subscribeToErrors).not.toHaveBeenCalled();
  });
});
