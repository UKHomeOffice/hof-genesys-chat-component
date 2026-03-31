import InboundMessage from '../types/inbound-message';
import OutboundMessage from '../types/outbound-message';
import BannerMessage from '../types/banner-message';

/**
 * Resolves which component should render a given message.
 * Returns null if no match — messages.jsx skips null entries.
 *
 * @param {Object} message - message object coming from Genesys
 * @returns {React.ComponentType|null}
 */
export function resolveMessageComponent(message) {
  if (message.type === 'Banner') {
    return BannerMessage;
  }

  /*
   * Direction can be determined by either the 'direction' property or,
   * for 'historical' messages, the 'messageType' property.
   */ 
  const direction = message.direction?.toLowerCase() || message.messageType?.toLowerCase();

  const type = message.type?.toLowerCase();

  if (direction === 'inbound' && type === 'text') {
    return InboundMessage;
  }

  if (direction === 'outbound' && (type === 'text' || type === 'structured') && message.text !== '') {
    return OutboundMessage;
  }

  return null;
}
