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

    act(() => result.current.handleFetchMessageHistory());

    expect(genesysService.fetchMessageHistory).toHaveBeenCalledWith(
      expect.any(Function) // error callback
    );
  });
});
