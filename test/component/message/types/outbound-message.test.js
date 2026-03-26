import '@testing-library/jest-dom';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import OutboundMessage from '../../../../src/components/message/types/outbound-message';

const outboundMessages = require('../../../data/outbound-messages.json');
const structuredMessages = require('../../../data/structured-messages.json');

jest.mock('../../../../src/components/message/message-text', () => ({ text, type, utmParam }) => (
  <div data-testid="message-text" data-type={type} data-utm={utmParam}>{text}</div>
));

jest.mock('../../../../src/components/message/message-meta', () => ({ type, messageTimeStamp, metaDisplay }) => (
  <div
    data-testid="message-meta"
    data-type={type}
    data-timestamp={messageTimeStamp}
    data-display={metaDisplay}
  />
));

jest.mock('../../../../src/components/message/types/structured-message', () => ({ contents, handleQuickReply }) => (
  <div data-testid="structured-message" />
));

describe('OutboundMessage', () => {
  const baseMessage = outboundMessages[0];

  it('renders with role article', () => {
    render(
      <OutboundMessage
        message={baseMessage}
        isLast={false}
        lastMessageRef={null}
        handleQuickReply={jest.fn()}
        utmParam=""
        botMetaDisplay="Digital assistant"
      />
    );
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('renders MessageText with type Outbound and the message text', () => {
    render(
      <OutboundMessage
        message={baseMessage}
        isLast={false}
        lastMessageRef={null}
        handleQuickReply={jest.fn()}
        utmParam=""
        botMetaDisplay="Digital assistant"
      />
    );
    const text = screen.getByTestId('message-text');
    expect(text).toHaveTextContent('Welcome to EVisa webchat, in few word how can i help you today?');
  });

  it('passes utmParam through to MessageText', () => {
    render(
      <OutboundMessage
        message={baseMessage}
        isLast={false}
        lastMessageRef={null}
        handleQuickReply={jest.fn()}
        utmParam="?utm_source=chat"
        botMetaDisplay="Digital assistant"
      />
    );
    expect(screen.getByTestId('message-text')).toHaveAttribute('data-utm', '?utm_source=chat');
  });

  it('passes formatted timestamp to MessageMetaData using base message', () => {
    render(
      <OutboundMessage
        message={baseMessage}
        isLast={false}
        lastMessageRef={null}
        handleQuickReply={jest.fn()}
        utmParam=""
        botMetaDisplay="Digital assistant"
      />
    );
    expect(screen.getByTestId('message-meta')).toHaveAttribute(
      'data-timestamp',
      '2025-07-31T09:38:00Z'
    );
  });

  it('passes formatted timestamp to MessageMetaData using hisotrical message', () => {
    const historicalMessage = {
      "text": "Welcome to the webchat, in few word how can i help you today?",
      "messageType": "outbound",
      "type": "text",
      "timestamp": "2025-07-31T09:39:00Z",
      "metadata": {
        "correlationId": "00000000-0000-0000-0000-000000000000"
      },
      "originatingEntity": "Bot",
      "content": []
    }
    
    render(
      <OutboundMessage
        message={historicalMessage}
        isLast={false}
        lastMessageRef={null}
        handleQuickReply={jest.fn()}
        utmParam=""
        botMetaDisplay="Digital assistant"
      />
    );
    expect(screen.getByTestId('message-meta')).toHaveAttribute(
      'data-timestamp',
      '2025-07-31T09:39:00Z'
    );
  });

  describe('metaDisplay resolution', () => {
    it('uses the channel nickname when available', () => {
      render(
        <OutboundMessage
          message={baseMessage}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(screen.getByTestId('message-meta')).toHaveAttribute('data-display', 'Digital assistant');
    });

    it('falls back to botMetaDisplay when nickname is absent', () => {
      const message = {
        ...baseMessage,
        channel: { time: '2024-01-01T10:00:00Z', from: {} },
      };
      render(
        <OutboundMessage
          message={message}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(screen.getByTestId('message-meta')).toHaveAttribute('data-display', 'Digital assistant');
    });

    it('falls back to "Digital assistant" when both nickname and botMetaDisplay are absent', () => {
      const message = {
        ...baseMessage,
        channel: { time: '2024-01-01T10:00:00Z', from: {} },
      };
      render(
        <OutboundMessage
          message={message}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay={undefined}
        />
      );
      expect(screen.getByTestId('message-meta')).toHaveAttribute('data-display', 'Digital assistant');
    });

    it('falls back to "Digital assistant" when channel.from is absent', () => {
      const message = {
        ...baseMessage,
        channel: { time: '2024-01-01T10:00:00Z' },
      };
      render(
        <OutboundMessage
          message={message}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay={undefined}
        />
      );
      expect(screen.getByTestId('message-meta')).toHaveAttribute('data-display', 'Digital assistant');
    });
  });

  describe('StructuredMessage rendering', () => {
    const structuredMessage = structuredMessages[0];

    it('renders StructuredMessage when type is Structured and hideContent is false', () => {
      const message = {
        ...structuredMessage,
        content: Object.assign(structuredMessage.content, { hideContent: false }),
      };
      render(
        <OutboundMessage
          message={message}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(screen.getByTestId('structured-message')).toBeInTheDocument();
    });

    it('does not render StructuredMessage when hideContent is true', () => {
      const message = {
        ...structuredMessage,
        hideContent: true
      };
      render(
        <OutboundMessage
          message={message}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(screen.queryByTestId('structured-message')).not.toBeInTheDocument();
    });

    it('does not render StructuredMessage for a plain Text message', () => {
      render(
        <OutboundMessage
          message={baseMessage}
          isLast={false}
          lastMessageRef={null}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(screen.queryByTestId('structured-message')).not.toBeInTheDocument();
    });
  });

  describe('ref attachment', () => {
    it('attaches ref when isLast is true', () => {
      const ref = createRef();
      render(
        <OutboundMessage
          message={baseMessage}
          isLast={true}
          lastMessageRef={ref}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(ref.current).not.toBeNull();
    });

    it('does not attach ref when isLast is false', () => {
      const ref = createRef();
      render(
        <OutboundMessage
          message={baseMessage}
          isLast={false}
          lastMessageRef={ref}
          handleQuickReply={jest.fn()}
          utmParam=""
          botMetaDisplay="Digital assistant"
        />
      );
      expect(ref.current).toBeNull();
    });
  });
});
