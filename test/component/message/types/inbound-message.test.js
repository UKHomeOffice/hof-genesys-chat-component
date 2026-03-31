import '@testing-library/jest-dom'
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import InboundMessage from '../../../../src/components/message/types/inbound-message';

jest.mock('../../../../src/components/message/message-text', () => ({ text, type }) => (
  <div data-testid="message-text" data-type={type}>{text}</div>
));

jest.mock('../../../../src/components/message/message-meta', () => ({ type, messageTimeStamp, metaDisplay }) => (
  <div
    data-testid="message-meta"
    data-type={type}
    data-timestamp={messageTimeStamp}
    data-display={metaDisplay}
  />
));

describe('InboundMessage', () => {
  const baseMessage = {
    direction: 'Inbound',
    type: 'Text',
    text: 'Hello from user',
    channel: { time: '2024-01-01T10:00:00Z' },
  };

  test('renders MessageText with type Inbound and the message text', () => {
    render(<InboundMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    const text = screen.getByTestId('message-text');
    expect(text).toHaveTextContent('Hello from user');
    expect(text).toHaveAttribute('data-type', 'Inbound');
  });

  test('passes formatted timestamp to MessageMetaData using base message', () => {
    render(<InboundMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    const meta = screen.getByTestId('message-meta');
    expect(meta).toHaveAttribute('data-timestamp', '2024-01-01T10:00:00Z');
  });

  test('passes formatted timestamp to MessageMetaData using historical message', () => {
    const historicalMessage = {
      "text": "Hello, I need help with my application",
      "messageType": "inbound",
      "type": "text",
      "timestamp": "2025-07-31T09:39:15Z",
      "metadata": {
        "correlationId": "00000000-0000-0000-0000-000000000000"
      },
      "content": []
    };

    render(<InboundMessage message={historicalMessage} isLast={false} lastMessageRef={null} />);
    const meta = screen.getByTestId('message-meta');
    expect(meta).toHaveAttribute('data-timestamp', '2025-07-31T09:39:15Z');
  });

  test('passes "You" as metaDisplay to MessageMetaData', () => {
    render(<InboundMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    const meta = screen.getByTestId('message-meta');
    expect(meta).toHaveAttribute('data-display', 'You');
  });

  test('attaches ref when isLast is true', () => {
    const ref = createRef();
    render(<InboundMessage message={baseMessage} isLast={true} lastMessageRef={ref} />);
    expect(ref.current).not.toBeNull();
  });

  test('does not attach ref when isLast is false', () => {
    const ref = createRef();
    render(<InboundMessage message={baseMessage} isLast={false} lastMessageRef={ref} />);
    expect(ref.current).toBeNull();
  });
});
