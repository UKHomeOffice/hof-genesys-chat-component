import { renderHook } from '@testing-library/react';
import { useErrorState } from '../../src/hooks/use-error-state';

describe('useErrorState', () => {
  test('calls errorCallback when isErrorState is true', () => {
    const errorCallback = jest.fn();

    renderHook(() => useErrorState({ isErrorState: true, errorCallback }));

    expect(errorCallback).toHaveBeenCalledTimes(1);
  });

  test('does not call errorCallback when isErrorState is false', () => {
    const errorCallback = jest.fn();

    renderHook(() => useErrorState({ isErrorState: false, errorCallback }));

    expect(errorCallback).not.toHaveBeenCalled();
  });
});
