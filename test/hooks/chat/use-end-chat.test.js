import { renderHook, act } from '@testing-library/react';
import { useEndChat } from '../../../src/hooks/chat/use-end-chat';
import { genesysService } from '../../../src/services/genesys-service';

jest.mock('../../../src/services/genesys-service', () => ({
  genesysService: {
    clearConversation: jest.fn(),
    log: jest.fn(),
  },
}));

describe('useEndChat', () => {
  const setShowEndChatModal = jest.fn();
  const onChatEnded = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  function setup() {
    return renderHook(() =>
      useEndChat({
        setShowEndChatModal,
        serviceName: 'eta',
        onChatEnded
      })
    );
  }

  test('closes modal and ends chat', () => {
    const { result } = setup();

    const preventDefault = jest.fn();
    act(() => {
      result.current.handleEndChat({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(setShowEndChatModal).toHaveBeenCalledWith(false);
    expect(genesysService.log).toHaveBeenCalled();
    expect(genesysService.clearConversation).toHaveBeenCalled();
    expect(onChatEnded).toHaveBeenCalled();
  });
});
