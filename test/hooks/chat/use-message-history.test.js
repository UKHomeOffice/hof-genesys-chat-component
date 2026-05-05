import { renderHook, act } from '@testing-library/react';
import { useFetchMessageHistory } from '../../../src/hooks/chat/use-message-history';
import { genesysService } from '../../../src/services/genesys-service';

jest.mock('../../../src/services/genesys-service', () => ({
  genesysService: {
    fetchMessageHistory: jest.fn(),
    log: jest.fn(),
  },
}));

describe('useFetchMessageHistory', () => {
  const setIsErrorState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches history with error callback', () => {
    const { result } = renderHook(() =>
      useFetchMessageHistory({ setIsErrorState })
    );

    let didFetch;
    act(() => {
      didFetch = result.current.handleFetchMessageHistory();
    });

    expect(didFetch).toBe(true);
    expect(genesysService.fetchMessageHistory).toHaveBeenCalledWith(
      expect.any(Function) // error callback
    );
  });

  test('does not fetch twice while a history request is in-flight', () => {
    const { result } = renderHook(() =>
      useFetchMessageHistory({ setIsErrorState })
    );

    act(() => {
      result.current.handleFetchMessageHistory();
    });

    let didFetchSecondTime;
    act(() => {
      didFetchSecondTime = result.current.handleFetchMessageHistory();
    });

    expect(didFetchSecondTime).toBe(false);
    expect(genesysService.fetchMessageHistory).toHaveBeenCalledTimes(1);
  });

  test('allows fetch again after completion callback is invoked', () => {
    const { result } = renderHook(() =>
      useFetchMessageHistory({ setIsErrorState })
    );

    act(() => {
      result.current.handleFetchMessageHistory();
      result.current.onHistoryFetchComplete();
    });

    let didFetchAfterComplete;
    act(() => {
      didFetchAfterComplete = result.current.handleFetchMessageHistory();
    });

    expect(didFetchAfterComplete).toBe(true);
    expect(genesysService.fetchMessageHistory).toHaveBeenCalledTimes(2);
  });
});
