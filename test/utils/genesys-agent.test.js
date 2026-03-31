import {
  getCurrentAgentName,
  isConnectedToAgent,
  setAgentConnectedBanner,
  setAgentDisconnectedBanner,
  setOfflineBanner,
  setReconnectedBanner
} from '../../src/utils/genesys-agent';

import historicalMessage from '../data/restored-messages.json';
import outboundMessages from '../data/outbound-messages.json';

describe('Genesys Agent', () => {
  test(' setAgentConnectedBanner should add agent if not exist', () => {

    const expected = historicalMessage.messages.length;
    const actual = setAgentConnectedBanner(historicalMessage.messages, 'Agent is now connected');

    expect(actual.length).toBeGreaterThan(expected);
    expect(actual.length).not.toBe(expected);
  });

  test('getCurrentAgentName should return Agent name', () => {

    const expected = 'Chris';
    const actual = getCurrentAgentName(outboundMessages[5]);

    expect(actual).toBe(expected);
  });

  test('getCurrentAgentName should return undefined', () => {

    const expected = undefined;
    const actual = getCurrentAgentName(outboundMessages[3]);
    expect(actual).toBe(expected);
  });

  describe('isConnectedToAgent', () => {
    test('should return true for outbound message with nickname', () => {
      const message = {
        direction: 'Outbound',
        channel: { from: { nickname: 'Agent' } }
      };
      expect(isConnectedToAgent(message)).toBe(true);
    });

    test('should return false for inbound message', () => {
      const message = { direction: 'Inbound' };
      expect(isConnectedToAgent(message)).toBe(false);
    });
  });

  describe('setAgentDisconnectedBanner', () => {
    test('should add disconnected banner to messages', () => {
      const messages = [{ text: 'Hello' }];
      const result = setAgentDisconnectedBanner(messages, 'Agent disconnected');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        text: 'Agent disconnected',
        type: 'Banner',
        direction: 'Outbound',
        originatingEntity: 'Human',
        disconnected: true
      });
    });

    describe('setOfflineBanner', () => {
      test('should add offline banner to messages', () => {
        const messages = [{ text: 'Hello' }];
        const result = setOfflineBanner(messages, 'You are offline');

        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({
          text: 'You are offline',
          type: 'Banner',
          direction: 'Outbound',
          originatingEntity: 'System',
          offline: true
        });
      });

      test('should update existing banner', () => {
        const messages = [{ text: 'Old banner', offline: true }];
        const result = setOfflineBanner(messages, 'New offline message');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          text: 'New offline message',
          type: 'Banner',
          direction: 'Outbound',
          originatingEntity: 'System',
          offline: true,
          reconnected: false
        });
      });
    });

    describe('setReconnectedBanner', () => {
      test('should add reconnected banner to messages', () => {
        const messages = [{ text: 'Hello' }];
        const result = setReconnectedBanner(messages, 'Back online');

        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({
          text: 'Back online',
          type: 'Banner',
          direction: 'Outbound',
          originatingEntity: 'System',
          reconnected: true
        });
      });
    });
  });
});
