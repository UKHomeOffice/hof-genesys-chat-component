import { stringsAreEqualIgnoringCase } from '../../utils';
import InboundTextMessage from './types/inbound-message';
import OutboundTextMessage from './types/outbound-message';
import AgentConnected from '../content/agent-connected';

/**
 * Function to return an <AgentConnected> component
 * @param {message} the message object from Genesys
 * @param {boolean} isLast whether this is the last message in the list
 * @param {function} lastMessageRef ref function to attach to the last message for scrolling
 * @returns <AgentConnected> component
 */
function BannerMessage({ message, isLast, lastMessageRef }) {
  return (
    <div ref={isLast ? lastMessageRef : null}>
      <AgentConnected text={message.text} />
    </div>
  );
}

/**
 * Function to return an <InboundMessage> component. Inbound messages
 * are messages sent between the user (client) and genesys (server).
 * @param {message} the message object from Genesys
 * @param {boolean} isLast whether this is the last message in the list
 * @param {function} lastMessageRef ref function to attach to the last message for scrolling
 * @returns <InboundMessage> component
 */
function InboundMessage({ message, isLast, lastMessageRef }) {
  return (
    <div ref={isLast ? lastMessageRef : null}>
      <InboundTextMessage message={message} />
    </div>
  );
}

/**
 * Function to return an <OutboundMessage> component. Outbound messages
 * are messages sent from genesys (server) to the user (client).
 * @param {message} the message object from Genesys
 * @param {boolean} isLast whether this is the last message in the list
 * @param {function} lastMessageRef ref function to attach to the last message for scrolling
 * @returns <OutboundMessage> component
 */
function OutboundMessage({ message, isLast, lastMessageRef, handleQuickReply, serviceName, utmParam, botMetaDisplay}) {
  return (
    <div ref={isLast ? lastMessageRef : null}>
      <OutboundTextMessage
        message={message}
        handleQuickReply={handleQuickReply}
        serviceName={serviceName}
        utmParam={utmParam}
        botMetaDisplay={botMetaDisplay}
      />
    </div>
  );
}

/**
 * Function to check if a message is an outbound text message. Outbound messages
 * contain a specific direction of 'Outbound' and can be of type 'Structured' or 'Text'.
 * https://developer.genesys.cloud/commdigital/digital/webmessaging/websocketapi#outbound-messages
 * @param {message} the message object from Genesys
 * @returns {boolean} whether the message is an outbound text message
 */
function isOutboundTextMessage(message) {
  return stringsAreEqualIgnoringCase(message.direction, 'Outbound')
    && (stringsAreEqualIgnoringCase(message.type, 'Structured')
      || stringsAreEqualIgnoringCase(message.type, 'Text'))
    && message.text !== '';
}

/**
 * Function to check if a message is an inbound text message. Inbound messages
 * contain a specific direction of 'Inbound'.
 * https://developer.genesys.cloud/commdigital/digital/webmessaging/websocketapi#inbound-messages
 * @param {message} the message object from Genesys
 * @returns {boolean} whether the message is an inbound text message
 */
function isInboundTextMessage(message) {
  return stringsAreEqualIgnoringCase(message.direction, 'Inbound')
    && stringsAreEqualIgnoringCase(message.type, 'Text');
}

export function renderMessage(message, index, isLast, lastMessageRef, handleQuickReply, serviceName, utmParam, botMetaDisplay) {
  if (message.type === 'Banner') {
    return <BannerMessage key={index} message={message} isLast={isLast} lastMessageRef={lastMessageRef} />;
  }
  if (isInboundTextMessage(message)) {
    return <InboundMessage key={index} message={message} isLast={isLast} lastMessageRef={lastMessageRef} />;
  }
  if (isOutboundTextMessage(message)) {
    return <OutboundMessage
      key={index} message={message}
      isLast={isLast}
      lastMessageRef={lastMessageRef}
      handleQuickReply={handleQuickReply}
      serviceName={serviceName}
      utmParam={utmParam}
      botMetaDisplay={botMetaDisplay}
    />;
  }
  return null;
}

export function LoadMoreMessagesButton({ onClick }) {
  return (
    <button
      type="button"
      data-testid="load-more-messages-button"
      id="load-more-messages-button"
      className="govuk-button govuk-button--secondary fetch-history-button"
      data-module="govuk-button"
      onClick={onClick}
    >
      Load more messages
    </button>
  );
}
