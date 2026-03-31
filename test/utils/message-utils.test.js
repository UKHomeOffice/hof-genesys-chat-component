import {
  mapHistoricalMessagesToStandardMessageFormat,
  clearAgentTypingOnOutboundHumanMessage,
  checkChatEnded
} from '../../src/utils/message-utils';

describe('message-utils', () => {
  describe('mapHistoricalMessagesToStandardMessageFormat', () => {
    it('should map historical messages to standard format', () => {
      const historicalMessages = [
        {
          timestamp: '2023-01-01T00:00:00Z',
          id: 'msg1',
          messageType: 'Inbound',
          type: 'Text',
          text: 'Hello',
          originatingEntity: 'Human',
          quickReplies: ['Yes', 'No']
        }
      ];

      const result = mapHistoricalMessagesToStandardMessageFormat(historicalMessages);

      expect(result).toEqual([
        {
          channel: {
            time: '2023-01-01T00:00:00Z',
            messageId: 'msg1'
          },
          direction: 'Inbound',
          type: 'Text',
          text: 'Hello',
          originatingEntity: 'Human',
          content: ['Yes', 'No'],
          id: "msg1",
          timestamp: "2023-01-01T00:00:00Z"
        }
      ]);
    });
  });

  describe('clearAgentTypingOnOutboundHumanMessage', () => {
    it('should call callback when message is outbound human', () => {
      const message = { direction: 'Outbound', originatingEntity: 'Human' };
      const callback = jest.fn();

      clearAgentTypingOnOutboundHumanMessage(message, callback);

      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback for other message types', () => {
      const message = { direction: 'Inbound', originatingEntity: 'Bot' };
      const callback = jest.fn();

      clearAgentTypingOnOutboundHumanMessage(message, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('checkChatEnded', () => {
    it('should return false for empty messages', () => {
      expect(checkChatEnded([]).shouldShowHint).toBe(false);
    });

    it('should return false for non-ending messages', () => {
      const messages = [
        { originatingEntity: 'Bot', direction: 'Inbound', events: [] }
      ];
      expect(checkChatEnded(messages).shouldShowHint).toBe(false);
    });

    it('should return true for disconnect event', () => {
      const messages = [
        {
          originatingEntity: 'Human',
          direction: 'Outbound',
          events: [
            { eventType: 'Presence', presence: { type: 'Disconnect' } }
          ]
        }
      ];
      expect(checkChatEnded(messages).shouldShowHint).toBe(true);
    });

    it('should track state changes across multiple calls', () => {
      const messages = [
        {
          originatingEntity: 'Human',
          direction: 'Outbound',
          events: [
            { eventType: 'Presence', presence: { type: 'Disconnect' } }
          ]
        }
      ];
      let previousHasEnded = false;
      const firstCall = checkChatEnded(messages, previousHasEnded);
      expect(firstCall.shouldShowHint).toBe(true);
      expect(firstCall.hasEnded).toBe(true);
      previousHasEnded = firstCall.hasEnded;
      const secondCall = checkChatEnded(messages, previousHasEnded);
      expect(secondCall.shouldShowHint).toBe(false);
      expect(secondCall.hasEnded).toBe(true);
    });
  });
});
