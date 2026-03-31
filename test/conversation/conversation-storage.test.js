import {
  getConversationId,
  removeConversationId
} from '../../src/conversation/conversation-storage';

describe('conversation-storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getConversationId', () => {
    it('should generate a conversation ID when no conversation ID is set', () => {      
      expect(getConversationId()).not.toBeNull();
    });

    it('should return the conversation ID when already exists', () => {
      sessionStorage.setItem('conversationId', 'test-id');
      expect(getConversationId()).toBe('test-id');
    });
  });

  describe('removeConversationId', () => {
    it('should remove the conversation ID from sessionStorage', () => {
      sessionStorage.setItem('conversationId', 'test-id');
      removeConversationId();
      expect(sessionStorage.getItem('conversationId')).toBeNull();
    });
  });
});
