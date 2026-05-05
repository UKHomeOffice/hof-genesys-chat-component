import { renderHook, act } from '@testing-library/react';
import { useScrollTopHistoryFetch } from '../../../src/hooks/chat/use-scroll-top-history-fetch';

describe('useScrollTopHistoryFetch', () => {
  const createContainer = ({ scrollTop = 0, scrollHeight = 1000 } = {}) => ({
    scrollTop,
    scrollHeight,
  });

  const setup = ({
    messages = [],
    fetchMessageHistory = jest.fn(),
    allHistoryFetched = false,
  } = {}) => {
    const hook = renderHook(
      (props) => useScrollTopHistoryFetch(props),
      {
        initialProps: {
          messages,
          fetchMessageHistory,
          allHistoryFetched,
        },
      }
    );

    return { ...hook, fetchMessageHistory };
  };

  test('does not fetch on initial top position without scrolling from below', () => {
    const fetchMessageHistory = jest.fn().mockReturnValue(true);
    const { result } = setup({ fetchMessageHistory });
    const container = createContainer({ scrollTop: 0 });

    act(() => {
      result.current.messageContainerRef.current = container;
      result.current.handleMessageContainerScroll({ currentTarget: container });
    });

    expect(fetchMessageHistory).not.toHaveBeenCalled();
  });

  test('fetches when user scrolls from below threshold to top', () => {
    const fetchMessageHistory = jest.fn().mockReturnValue(true);
    const { result } = setup({ fetchMessageHistory });
    const container = createContainer({ scrollTop: 50 });

    act(() => {
      result.current.messageContainerRef.current = container;
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 0;
      result.current.handleMessageContainerScroll({ currentTarget: container });
    });

    expect(fetchMessageHistory).toHaveBeenCalledTimes(1);
  });

  test('does not fetch when all history is already fetched', () => {
    const fetchMessageHistory = jest.fn().mockReturnValue(true);
    const { result } = setup({ fetchMessageHistory, allHistoryFetched: true });
    const container = createContainer({ scrollTop: 50 });

    act(() => {
      result.current.messageContainerRef.current = container;
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 0;
      result.current.handleMessageContainerScroll({ currentTarget: container });
    });

    expect(fetchMessageHistory).not.toHaveBeenCalled();
  });

  test('fetches once per top-hit until user scrolls away and returns', () => {
    const fetchMessageHistory = jest.fn().mockReturnValue(true);
    const { result } = setup({ fetchMessageHistory });
    const container = createContainer({ scrollTop: 50 });

    act(() => {
      result.current.messageContainerRef.current = container;

      container.scrollTop = 50;
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 0;
      result.current.handleMessageContainerScroll({ currentTarget: container });
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 40;
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 0;
      result.current.handleMessageContainerScroll({ currentTarget: container });
    });

    expect(fetchMessageHistory).toHaveBeenCalledTimes(2);
  });

  test('preserves viewport position after historical messages are prepended', () => {
    const fetchMessageHistory = jest.fn().mockReturnValue(true);
    const { result, rerender } = setup({
      fetchMessageHistory,
      messages: [{ id: 'm1' }],
    });

    const container = createContainer({ scrollTop: 0, scrollHeight: 1000 });

    act(() => {
      result.current.messageContainerRef.current = container;

      container.scrollTop = 50;
      result.current.handleMessageContainerScroll({ currentTarget: container });

      container.scrollTop = 0;
      result.current.handleMessageContainerScroll({ currentTarget: container });
    });

    container.scrollHeight = 1200;

    act(() => {
      rerender({
        messages: [{ id: 'old-message' }, { id: 'm1' }],
        fetchMessageHistory,
        allHistoryFetched: false,
      });
    });

    expect(container.scrollTop).toBe(200);
  });
});
