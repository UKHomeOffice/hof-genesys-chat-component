import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Messages from '../../../src/components/message/messages';

import inboundMessages from '../../data/inbound-messages.json';
import outboundMessages from '../../data/outbound-messages.json';
import historicalMessages from '../../data/restored-messages.json';
import largeSetOfHistoricalMessages from '../../data/large-set-restored-messages.json';
import restoredMessages from '../../data/restored-messages.json';

/*
 * Mock the message type components to simplify testing the Messages component in isolation.
 * This approach will still invoke the message registry though, so we're testing that the registry 
 * correctly resolves message types to components, without needing to test the actual rendering of 
 * each message type (which is covered in their own unit tests).
 */
jest.mock('../../../src/components/message/types/inbound-message', () => ({ message, isLast, lastMessageRef }) => (
  <div data-testid="inbound" data-is-last={String(isLast)} ref={isLast ? lastMessageRef : null}>
    {message.text}
  </div>
));

jest.mock('../../../src/components/message/types/outbound-message', () => ({ message, isLast, lastMessageRef }) => (
  <div data-testid="outbound" data-is-last={String(isLast)} ref={isLast ? lastMessageRef : null}>
    {message.text}
  </div>
));

jest.mock('../../../src/components/message/types/banner-message', () => ({ message, isLast, lastMessageRef }) => (
  <div data-testid="banner" data-is-last={String(isLast)} ref={isLast ? lastMessageRef : null}>
    {message.text}
  </div>
));

jest.mock('../../../src/components/message/load-more-messages', () => ({ onClick }) => (
  <button data-testid="load-more-btn" onClick={onClick}>Load more</button>
));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeBanner(text = 'Agent joined') {
  return { type: 'Banner', text };
}

function makeEventMessage() {
  // Event/presence messages have no text property
  return { direction: 'Outbound', type: 'Event' };
}

const defaultProps = {
  messages: [],
  lastMessageRef: null,
  handleQuickReply: jest.fn(),
  fetchMessageHistory: jest.fn(),
  allHistoryFetched: false,
  utmParam: '',
  botMetaDisplay: 'Digital assistant',
};

describe('Messages', () => {
  describe('container structure', () => {
    test('renders a chat-messages div with role log', () => {
      render(<Messages {...defaultProps} />);
      const log = screen.getByRole('log');
      expect(log).toHaveClass('chat-messages');
      expect(log).toHaveAttribute('aria-label', 'Chat messages');
      expect(log).toHaveAttribute('aria-live', 'polite');
    });

    test('renders nothing when messages is empty', () => {
      render(<Messages {...defaultProps} />);
      expect(screen.queryByTestId('inbound')).not.toBeInTheDocument();
      expect(screen.queryByTestId('outbound')).not.toBeInTheDocument();
      expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
    });
  });

  describe('message rendering via registry', () => {
    test('renders inbound messages', () => {
      const props = { ...defaultProps, messages: [inboundMessages[0]] };
      render(<Messages {...props} />);
      expect(screen.getByTestId('inbound')).toHaveTextContent("What's the price for this service");
    });

    test('renders outbound messages', () => {
      const props = { ...defaultProps, messages: [outboundMessages[0]] };
      render(<Messages {...props} />);
      expect(screen.getByTestId('outbound')).toHaveTextContent("Welcome to EVisa webchat, in few word how can i help you today?");
    });

    test('renders banner messages', () => {
      const props = { ...defaultProps, messages: [makeBanner('Agent joined')] };
      render(<Messages {...props} />);
      expect(screen.getByTestId('banner')).toHaveTextContent('Agent joined');
    });

    test('renders a mixed list of message types', () => {
      const props = {
        ...defaultProps,
        messages: [makeBanner(), outboundMessages[0], inboundMessages[0]],
      };
      render(<Messages {...props} />);
      expect(screen.getByTestId('banner')).toBeInTheDocument();
      expect(screen.getByTestId('outbound')).toBeInTheDocument();
      expect(screen.getByTestId('inbound')).toBeInTheDocument();
    });

    test('renders a mixed list of historical messages', () => {
      const props = {
        ...defaultProps,
        messages: restoredMessages.messages,
      };
      render(<Messages {...props} />);

      const outboundMessages = screen.getAllByTestId('outbound');
      const inboundMessages = screen.getAllByTestId('inbound');
 
      expect(outboundMessages[0]).toHaveTextContent("Welcome to the webchat, in few word how can i help you today?");
      expect(inboundMessages[0]).toHaveTextContent("Hello, I need help with my application");

      expect(outboundMessages[1]).toHaveTextContent("Ok, for more information please see the documentation on our home page");
      expect(inboundMessages[1]).toHaveTextContent("Please connect me to an agent");
    });

    test('skips messages that resolve to null (unrecognised types)', () => {
      const props = {
        ...defaultProps,
        messages: [makeEventMessage(), inboundMessages[0]],
      };
      render(<Messages {...props} />);
      // Only the inbound message should appear
      expect(screen.getAllByTestId('inbound')).toHaveLength(1);
    });
  });

  describe('isLast resolution', () => {
    test('marks only the last text-bearing message with isLast=true', () => {
      const lastMessageRef = React.createRef();

      const props = {
        ...defaultProps,
        messages: [inboundMessages[0], outboundMessages[0]],
        lastMessageRef
      };

      render(<Messages {...props} />);

      const inbound = screen.getByTestId('inbound');
      const outbound = screen.getByTestId('outbound');
      expect(inbound).toHaveAttribute('data-is-last', 'false');
      expect(outbound).toHaveAttribute('data-is-last', 'true');

      expect(lastMessageRef.current).not.toBeNull();
      expect(lastMessageRef.current).toHaveTextContent('Welcome to EVisa webchat, in few word how can i help you today?');
    });

    test('does not attach lastMessageRef to any message that is not last', () => {
      const lastMessageRef = React.createRef();

      const props = {
        ...defaultProps,
        messages: [inboundMessages[0], outboundMessages[0]],
        lastMessageRef,
      };
      render(<Messages {...props} />);
      // The ref should point to the last message, not the first
      expect(lastMessageRef.current).not.toHaveTextContent('First');
    });

    test('attaches lastMessageRef to the last text-bearing message when followed by an event message', () => {
      const lastMessageRef = React.createRef();
      const props = {
        ...defaultProps,
        messages: [inboundMessages[0], makeEventMessage()],
        lastMessageRef,
      };
      render(<Messages {...props} />);
      expect(lastMessageRef.current).not.toBeNull();
      expect(lastMessageRef.current).toHaveTextContent("What's the price for this service");
    });

    test('does not attach lastMessageRef when there are no text-bearing messages', () => {
      const lastMessageRef = React.createRef();
      const props = {
        ...defaultProps,
        messages: [makeEventMessage()],
        lastMessageRef,
      };
      render(<Messages {...props} />);
      expect(lastMessageRef.current).toBeNull();
    });

    test('skips event messages when resolving the last text-bearing message', () => {
      // The event message has no text; the inbound message should be isLast
      const props = {
        ...defaultProps,
        messages: [inboundMessages[0], makeEventMessage()],
      };
      render(<Messages {...props} />);
      expect(screen.getByTestId('inbound')).toHaveAttribute('data-is-last', 'true');
    });

    test('sets isLast=false for all messages when there are no text-bearing messages', () => {
      // An array with only event messages — none should get isLast=true
      // The registry returns null for event messages so nothing is rendered,
      // but resolveLastTextIndex should return -1 without throwing.
      const props = { ...defaultProps, messages: [makeEventMessage()] };
      expect(() => render(<Messages {...props} />)).not.toThrow();
    });
  });

  describe('Load more messages button', () => {
    test('shows the button when history is not fully fetched and batch count is 25', () => {
      render(<Messages {...defaultProps} allHistoryFetched={false} lastHistoryBatchCount={25} />);
      expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
    });

    test('does not show the button when batch count is below 25', () => {
      render(<Messages {...defaultProps} allHistoryFetched={false} lastHistoryBatchCount={24} />);
      expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
    });

    test('shows the button for short batch after user has sent a message', () => {
      render(
        <Messages
          {...defaultProps}
          allHistoryFetched={false}
          hasUserSentMessageSinceLastHistoryComplete={true}
          lastHistoryBatchCount={23}
        />
      );
      expect(screen.getByTestId('load-more-btn')).toBeInTheDocument();
    });

    test('does not show the button when history is fully fetched', () => {
      render(<Messages {...defaultProps} allHistoryFetched={true} lastHistoryBatchCount={25} />);
      expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument();
    });

    test('calls fetchMessageHistory when the button is clicked', () => {
      const fetchMessageHistory = jest.fn();
      render(
        <Messages
          {...defaultProps}
          allHistoryFetched={false}
          fetchMessageHistory={fetchMessageHistory}
          lastHistoryBatchCount={25}
        />
      );
      fireEvent.click(screen.getByTestId('load-more-btn'));
      expect(fetchMessageHistory).toHaveBeenCalledTimes(1);
    });
  });
});
