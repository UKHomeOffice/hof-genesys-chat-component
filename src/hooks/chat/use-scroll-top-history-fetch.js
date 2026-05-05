import { useCallback, useLayoutEffect, useRef } from 'react';

const TOP_FETCH_THRESHOLD_PX = 16;

/**
 * Handles fetching older chat history when the message container is scrolled to the top.
 * Also preserves the user's viewport position when older messages are prepended.
 *
 * @param {Object} params - Hook parameters
 * @param {Array<Object>} params.messages - Current rendered message list
 * @param {Function} params.fetchMessageHistory - Callback that requests the next history batch
 * @param {boolean} params.allHistoryFetched - Whether all available history has been fetched
 * @returns {{messageContainerRef: MutableRefObject, handleMessageContainerScroll: Function}}
 * Ref for the scroll container and a scroll handler to attach to that container
 */
export function useScrollTopHistoryFetch({
  messages,
  fetchMessageHistory,
  allHistoryFetched,
}) {
  const messageContainerRef = useRef(null);
  const hasTriggeredTopFetchRef = useRef(false);
  const historyFetchAnchorRef = useRef(null);
  const previousScrollTopRef = useRef(0);

  /**
   * Requests older history when allowed and stores a pre-fetch scroll anchor
   * so the viewport position can be restored after new messages are prepended.
   */
  const handleTopHistoryFetch = useCallback(() => {
    if (allHistoryFetched || !messageContainerRef.current) {
      return;
    }

    const didTriggerFetch = fetchMessageHistory?.();

    if (didTriggerFetch) {
      const container = messageContainerRef.current;
      historyFetchAnchorRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      hasTriggeredTopFetchRef.current = true;
    }
  }, [allHistoryFetched, fetchMessageHistory]);

  /**
   * Handles message container scroll events and triggers history fetch only when
   * the user reaches the top from below the threshold.
   *
   * @param {{currentTarget: {scrollTop: number}}} event - Scroll event from the message container
   */
  const handleMessageContainerScroll = useCallback((event) => {
    const scrollContainer = event.currentTarget;
    const previousScrollTop = previousScrollTopRef.current;
    const currentScrollTop = scrollContainer.scrollTop;
    const isAtTop = currentScrollTop <= TOP_FETCH_THRESHOLD_PX;
    const reachedTopFromBelow = previousScrollTop > TOP_FETCH_THRESHOLD_PX && isAtTop;

    previousScrollTopRef.current = currentScrollTop;

    if (!isAtTop) {
      hasTriggeredTopFetchRef.current = false;
      historyFetchAnchorRef.current = null;
      return;
    }

    if (!hasTriggeredTopFetchRef.current && reachedTopFromBelow) {
      handleTopHistoryFetch();
    }
  }, [handleTopHistoryFetch]);

  /**
   * Use of useLayoutEffect here is intentional to ensure the scroll position is adjusted before the browser paints,
   * preventing any visible jump to the user when older messages are prepended and the scrollHeight changes.
   * It listens for changes to the messages array, which indicates that new messages (history) have been added,
   * and if there is a stored scroll anchor from before the fetch, it calculates the new scrollTop to maintain
   * the user's viewport position relative to the newly added messages.
   * @see {@link https://react.dev/reference/react/useLayoutEffect}
   */
  useLayoutEffect(() => {
    if (!historyFetchAnchorRef.current || !messageContainerRef.current) {
      return;
    }

    const { scrollHeight, scrollTop } = historyFetchAnchorRef.current;
    const scrollContainer = messageContainerRef.current;
    const scrollHeightDelta = scrollContainer.scrollHeight - scrollHeight;

    scrollContainer.scrollTop = scrollTop + scrollHeightDelta;
    historyFetchAnchorRef.current = null;
  }, [messages]);

  return {
    messageContainerRef,
    handleMessageContainerScroll,
  };
}
