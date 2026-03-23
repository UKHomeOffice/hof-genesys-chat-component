import {
  getConversationId,
  setConversationId,
  removeConversationId
} from '../../src/utils/conversation-storage';

describe('conversation-storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getConversationId', () => {
    it('should return null when no conversation ID is set', () => {
      expect(getConversationId()).toBeNull();
    });

    it('should return the conversation ID when set', () => {
      setConversationId('test-id');
      expect(getConversationId()).toBe('test-id');
    });
  });

  describe('setConversationId', () => {
    it('should set the conversation ID in sessionStorage', () => {
      setConversationId('test-id');
      expect(sessionStorage.getItem('__genesys_conversation_id__')).toBe('test-id');
    });
  });

  describe('removeConversationId', () => {
    it('should remove the conversation ID from sessionStorage', () => {
      setConversationId('test-id');
      removeConversationId();
      expect(sessionStorage.getItem('__genesys_conversation_id__')).toBeNull();
    });
  });
});
