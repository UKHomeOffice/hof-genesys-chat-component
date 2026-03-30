import { renderHook, act } from '@testing-library/react';
import { useQuickReply } from '../../../src/hooks/chat/use-quick-reply';
import { genesysService } from '../../../src/services/genesys-service';

jest.mock('../../../src/services/genesys-service', () => ({
  genesysService: {
    sendMessageToGenesys: jest.fn(),
    log: jest.fn(),
  },
}));

describe('useQuickReply', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends reply text to Genesys', () => {
    const reply = 'Yes';
    const { result } = renderHook(() => useQuickReply({ setIsErrorState: jest.fn() }));

    const preventDefault = jest.fn();

    act(() => result.current.handleQuickReply({ preventDefault }, reply));

    expect(preventDefault).toHaveBeenCalled();
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('Yes', expect.any(Function));
  });
});
