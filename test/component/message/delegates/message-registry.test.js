import { resolveMessageComponent } from '../../../../src/components/message/delegates/message-registry';
import InboundMessage from '../../../../src/components/message/types/inbound-message';
import OutboundMessage from '../../../../src/components/message/types/outbound-message';
import BannerMessage from '../../../../src/components/message/types/banner-message';

jest.mock('../../../../src/components/message/types/inbound-message', () => 'InboundMessage');
jest.mock('../../../../src/components/message/types/outbound-message', () => 'OutboundMessage');
jest.mock('../../../../src/components/message/types/banner-message', () => 'BannerMessage');

describe('resolveMessageComponent', () => {
  describe('Banner messages', () => {
    test('returns BannerMessage for type Banner', () => {
      const message = { type: 'Banner', text: 'Agent has joined' };
      expect(resolveMessageComponent(message)).toBe(BannerMessage);
    });

    test('returns BannerMessage for disconnected banner', () => {
      const message = { type: 'Banner', text: 'Agent has disconnected', disconnected: true };
      expect(resolveMessageComponent(message)).toBe(BannerMessage);
    });
  });

  describe('Inbound messages', () => {
    test('returns InboundMessage for direction Inbound and type Text', () => {
      const message = { direction: 'Inbound', type: 'Text', text: 'Hello' };
      expect(resolveMessageComponent(message)).toBe(InboundMessage);
    });

    test('is case-insensitive for direction', () => {
      const message = { direction: 'inbound', type: 'text', text: 'Hello' };
      expect(resolveMessageComponent(message)).toBe(InboundMessage);
    });

    test('returns null for Inbound Structured message (not a valid inbound type)', () => {
      const message = { direction: 'Inbound', type: 'Structured', text: 'Hello' };
      expect(resolveMessageComponent(message)).toBeNull();
    });
  });

  describe('Outbound messages', () => {
    test('returns OutboundMessage for direction Outbound and type Text', () => {
      const message = { direction: 'Outbound', type: 'Text', text: 'Hello' };
      expect(resolveMessageComponent(message)).toBe(OutboundMessage);
    });

    test('returns OutboundMessage for direction Outbound and type Structured', () => {
      const message = { direction: 'Outbound', type: 'Structured', text: 'Pick one', content: [] };
      expect(resolveMessageComponent(message)).toBe(OutboundMessage);
    });

    test('is case-insensitive for direction and type', () => {
      const message = { direction: 'outbound', type: 'text', text: 'Hello' };
      expect(resolveMessageComponent(message)).toBe(OutboundMessage);
    });

    test('returns null for Outbound message with empty text', () => {
      const message = { direction: 'Outbound', type: 'Text', text: '' };
      expect(resolveMessageComponent(message)).toBeNull();
    });

    test('returns null for Outbound Structured message with empty text', () => {
      const message = { direction: 'Outbound', type: 'Structured', text: '' };
      expect(resolveMessageComponent(message)).toBeNull();
    });
  });

  describe('Unrecognised messages', () => {
    test('returns null for an unknown type with no direction', () => {
      const message = { type: 'Event' };
      expect(resolveMessageComponent(message)).toBeNull();
    });

    test('returns null for a presence/event message with no text', () => {
      const message = { direction: 'Outbound', type: 'Event' };
      expect(resolveMessageComponent(message)).toBeNull();
    });

    test('returns null for an empty message object', () => {
      expect(resolveMessageComponent({})).toBeNull();
    });
  });
});
