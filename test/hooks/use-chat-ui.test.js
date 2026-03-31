import { renderHook, act } from '@testing-library/react';
import { useChatUI } from '../../src/hooks/use-chat-ui';

describe('useChatUI', () => {
  let mockSetShouldScrollToLatestMessage;
  let mockSetMessages;
  let lastMessageRef;

  beforeEach(() => {
    mockSetShouldScrollToLatestMessage = jest.fn();
    mockSetMessages = jest.fn((updater) => {
      // simple state simulation if needed
      if (typeof updater === 'function') {
        mockSetMessages.currentState = updater(mockSetMessages.currentState || []);
      } else {
        mockSetMessages.currentState = updater;
      }
    });

    lastMessageRef = {
      current: {
        scrollIntoView: jest.fn(),
      },
    };
  });

  // ---------------------------------------------------------------------------
  // SCROLL EFFECT
  // ---------------------------------------------------------------------------
  it('scrolls to the last message when shouldScrollToLatestMessage is true', () => {
    const messages = [{ id: '1', timestamp: '2022-01-01T00:00:00Z' }];

    renderHook(() =>
      useChatUI({
        messages,
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    expect(lastMessageRef.current.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });
  });

  it('does NOT scroll when shouldScrollToLatestMessage is false', () => {
    const messages = [{ id: '1', timestamp: '2022-01-01T00:00:00Z' }];

    renderHook(() =>
      useChatUI({
        messages,
        shouldScrollToLatestMessage: false,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    expect(lastMessageRef.current.scrollIntoView).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // mergeChatHistory CALLBACK
  // ---------------------------------------------------------------------------
  it('sets shouldScrollToLatestMessage to false when merging history', () => {
    const { result } = renderHook(() =>
      useChatUI({
        messages: [],
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    act(() => {
      result.current.mergeChatHistory([]);
    });

    expect(mockSetShouldScrollToLatestMessage).toHaveBeenCalledWith(false);
  });

  it('prepends mappedMessages to existing messages chronologically', () => {
    mockSetMessages.currentState = [
      {
        id: 'b',
        timestamp: '2022-01-02T10:00:00Z',
      },
      {
        id: 'c',
        timestamp: '2022-01-03T10:00:00Z',
      },
    ];

    const { result } = renderHook(() =>
      useChatUI({
        messages: mockSetMessages.currentState,
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    const history = [
      {
        id: 'a',
        timestamp: '2022-01-01T10:00:00Z',
      },
    ];

    act(() => {
      result.current.mergeChatHistory(history);
    });

    expect(mockSetMessages.currentState).toEqual([
      {
        id: 'a',
        timestamp: '2022-01-01T10:00:00Z',
      },
      {
        id: 'b',
        timestamp: '2022-01-02T10:00:00Z',
      },
      {
        id: 'c',
        timestamp: '2022-01-03T10:00:00Z',
      },
    ]);
  });

  // ---------------------------------------------------------------------------
  // SORTING LOGIC
  // ---------------------------------------------------------------------------
  it('sorts by timestamp first, then by id if timestamps are equal', () => {
    mockSetMessages.currentState = [
      { id: 'z', timestamp: '2022-01-01T10:00:00Z' },
    ];

    const { result } = renderHook(() =>
      useChatUI({
        messages: mockSetMessages.currentState,
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    const history = [
      { id: 'a', timestamp: '2022-01-01T10:00:00Z' }, // same timestamp, id is alphabetical tie‑breaker
      { id: 'b', timestamp: '2021-12-31T23:00:00Z' }, // earlier timestamp
    ];

    act(() => {
      result.current.mergeChatHistory(history);
    });

    expect(mockSetMessages.currentState).toEqual([
      // earliest timestamp first
      { id: 'b', timestamp: '2021-12-31T23:00:00Z' },

      // tie on timestamp -> alphabetical by id: 'a' then 'z'
      { id: 'a', timestamp: '2022-01-01T10:00:00Z' },
      { id: 'z', timestamp: '2022-01-01T10:00:00Z' },
    ]);
  });

  // ---------------------------------------------------------------------------
  // EDGE CASES
  // ---------------------------------------------------------------------------
  it('handles empty mappedMessages correctly', () => {
    mockSetMessages.currentState = [{ id: '1', timestamp: '2022-01-01T00:00:00Z' }];

    const { result } = renderHook(() =>
      useChatUI({
        messages: mockSetMessages.currentState,
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef,
      })
    );

    act(() => {
      result.current.mergeChatHistory([]);
    });

    expect(mockSetMessages.currentState).toEqual([
      { id: '1', timestamp: '2022-01-01T00:00:00Z' },
    ]);
  });

  it('does nothing if lastMessageRef.current is null', () => {
    const nullRef = { current: null };

    renderHook(() =>
      useChatUI({
        messages: [{ id: '1', timestamp: '2022-01-01T00:00:00Z' }],
        shouldScrollToLatestMessage: true,
        setShouldScrollToLatestMessage: mockSetShouldScrollToLatestMessage,
        setMessages: mockSetMessages,
        lastMessageRef: nullRef,
      })
    );

    // no crash, no call
    expect(true).toBe(true);
  });
});
