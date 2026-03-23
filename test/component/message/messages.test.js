import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { renderMessagesComponent } from '../../helpers/render-helpers';
import { mapHistoricalMessagesToStandardMessageFormat } from '../../../src/utils/message-utils';

import inboundMessages from '../../data/inbound-messages.json';
import outboundMessages from '../../data/outbound-messages.json';
import historicalMessages from '../../data/restored-messages.json';
import largeSetOfHistoricalMessages from '../../data/large-set-restored-messages.json';
import Messages from '../../../src/components/message/messages';

describe('Message component', () => {
  test('renders multiple InboundTextMessage components for Inbound messages', () => {
    renderMessagesComponent(inboundMessages, [], false);

    const messages = screen.getAllByTestId('inbound-message');
    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveTextContent('09:38');
    expect(messages[1]).toHaveTextContent('09:41');
    expect(messages[2]).toHaveTextContent('09:42');
  });

  test('renders multiple OutboundTextMessage components for Outbound messages', () => {
    renderMessagesComponent(outboundMessages.slice(0, 3), [], false);

    const messages = screen.getAllByTestId('outbound-message');
    expect(messages).toHaveLength(3);
    messages.forEach((message) => {
      expect(message).toHaveTextContent('09:38');
    });
  });

  test('renders correct message components restored messages', () => {
    const history = mapHistoricalMessagesToStandardMessageFormat(historicalMessages.messages);
    renderMessagesComponent(history, history, true);

    const inbound = screen.getAllByTestId('inbound-message');
    expect(inbound).toHaveLength(2);
    expect(inbound[0]).toHaveTextContent('Hello, I need help with my application');
    expect(inbound[1]).toHaveTextContent('Please connect me to an agent');

    const outbound = screen.getAllByTestId('outbound-message');
    expect(outbound).toHaveLength(2);
    expect(outbound[0]).toHaveTextContent('Welcome to the webchat, in few word how can i help you today?');
    expect(outbound[1]).toHaveTextContent('Ok, for more information please see the documentation on our home page');
  });

  test('renders load more messages button when historicalMessages length is 25 or more and allHistoryFetched is false', () => {
    const history = mapHistoricalMessagesToStandardMessageFormat(largeSetOfHistoricalMessages.messages);

    renderMessagesComponent(history, history, false);

    const loadMoreButton = screen.getByTestId('load-more-messages-button');
    expect(loadMoreButton).toBeInTheDocument();

    const inbound = screen.getAllByTestId('inbound-message');
    expect(inbound).toHaveLength(13);

    const outbound = screen.getAllByTestId('outbound-message');
    expect(outbound).toHaveLength(12);
  });

  test('doesnt render load more messages button when historicalMessages length is 25 or more and allHistoryFetched is true', () => {
    const history = mapHistoricalMessagesToStandardMessageFormat(largeSetOfHistoricalMessages.messages);
    renderMessagesComponent(history, history, true);

    const loadMoreButton = screen.queryByText(/Load more messages/i);
    expect(loadMoreButton).toBeNull();

    const inbound = screen.getAllByTestId('inbound-message');
    expect(inbound).toHaveLength(13);

    const outbound = screen.getAllByTestId('outbound-message');
    expect(outbound).toHaveLength(12);
  });

  test('correctly determines which message should have the lastMessageRef attached for scrolling', async () => {
    const lastMessageRef = React.createRef();
    const testMessages = [
      { text: 'First', direction: 'inbound', type: 'text', channel: { time: '2025-07-31T09:38:00Z' }, metadata: {}, content: [] },
      { text: 'Second', direction: 'outbound', type: 'text', channel: { time: '2025-07-31T09:39:00Z' }, metadata: {}, content: [] },
      { type: 'event', direction: 'outbound', channel: { time: '2025-07-31T09:40:00Z' }, content: [], originatingEntity: 'Bot' }
    ];

    render(
      <Messages
        messages={testMessages}
        historicalMessages={[]}
        lastMessageRef={lastMessageRef}
        handleQuickReply={() => { }}
        fetchMessageHistory={() => { }}
        allHistoryFetched={true}
        serviceName="test"
      />
    );

    // Assert the 2nd message in the list is the one with the ref attached
    expect(lastMessageRef.current).toHaveTextContent('Second');
  });

  test('doesnt set the ref if no messages meet requirements', async () => {
    const lastMessageRef = React.createRef();
    const testMessages = [
      { text: 'First', direction: 'inbound', type: 'event', channel: { time: '2025-07-31T09:38:00Z' }, metadata: {}, content: [] },
      { text: 'Second', direction: 'outbound', type: 'event', channel: { time: '2025-07-31T09:39:00Z' }, metadata: {}, content: [] },
      { type: 'Third', direction: 'outbound', type: 'event', channel: { time: '2025-07-31T09:40:00Z' }, content: [], originatingEntity: 'Bot' }
    ];

    render(
      <Messages
        messages={testMessages}
        historicalMessages={[]}
        lastMessageRef={lastMessageRef}
        handleQuickReply={() => { }}
        fetchMessageHistory={() => { }}
        allHistoryFetched={true}
        serviceName="test"
      />
    );

    expect(lastMessageRef.current).toBeNull();
  });

  test('doesnt set the ref if there are no messages at all', async () => {
    const lastMessageRef = React.createRef();
    const testMessages = [];

    render(
      <Messages
        messages={testMessages}
        historicalMessages={[]}
        lastMessageRef={lastMessageRef}
        handleQuickReply={() => { }}
        fetchMessageHistory={() => { }}
        allHistoryFetched={true}
        serviceName="test"
      />
    );

    expect(lastMessageRef.current).toBeNull();
  });
});
