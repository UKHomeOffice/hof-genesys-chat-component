import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { renderMessage, LoadMoreMessagesButton } from '../../../src/components/message/message-helpers';

jest.mock('../../../src/components/message/types/inbound-message', () => (props) => (
  <div data-testid="inbound-text-message">{props.message.text}</div>
));
jest.mock('../../../src/components/message/types/outbound-message', () => (props) => (
  <div data-testid="outbound-text-message">{props.message.text}</div>
));
jest.mock('../../../src/components/content/agent-connected', () => (props) => (
  <div data-testid="agent-connected">{props.text}</div>
));

describe('Message Helpers', () => {
  const lastMessageRef = React.createRef();

  describe('renderMessage', () => {
    it('renders BannerMessage when type is Banner', () => {
      const message = { type: 'Banner', text: 'Agent joined' };
      const { getByTestId } = render(
        renderMessage(message, 0, true, lastMessageRef)
      );
      expect(getByTestId('agent-connected')).toHaveTextContent('Agent joined');
    });

    it('renders InboundMessage for inbound text message', () => {
      const message = { direction: 'Inbound', type: 'Text', text: 'Hello' };
      const { getByTestId } = render(
        renderMessage(message, 1, false, lastMessageRef)
      );
      expect(getByTestId('inbound-text-message')).toHaveTextContent('Hello');
    });

    it('renders OutboundMessage for outbound text message', () => {
      const message = { direction: 'Outbound', type: 'Text', text: 'Hi there' };
      const { getByTestId } = render(
        renderMessage(message, 2, false, lastMessageRef, jest.fn(), 'TestService')
      );
      expect(getByTestId('outbound-text-message')).toHaveTextContent('Hi there');
    });

    it('renders OutboundMessage for outbound structured message', () => {
      const message = { direction: 'Outbound', type: 'Structured', text: 'Structured content' };
      const { getByTestId } = render(
        renderMessage(message, 3, false, lastMessageRef, jest.fn(), 'TestService')
      );
      expect(getByTestId('outbound-text-message')).toHaveTextContent('Structured content');
    });

    it('returns null for unsupported message types', () => {
      const message = { direction: 'Inbound', type: 'Image', text: 'img.png' };
      const result = renderMessage(message, 4, false, lastMessageRef);
      expect(result).toBeNull();
    });

    it('returns null for outbound text message with empty text', () => {
      const message = { direction: 'Outbound', type: 'Text', text: '' };
      const result = renderMessage(message, 5, false, lastMessageRef);
      expect(result).toBeNull();
    });

    it('handles case-insensitive direction and type', () => {
      const message = { direction: 'inbound', type: 'text', text: 'lowercase' };
      const { getByTestId } = render(
        renderMessage(message, 6, false, lastMessageRef)
      );
      expect(getByTestId('inbound-text-message')).toHaveTextContent('lowercase');
    });
  });

  describe('LoadMoreMessagesButton', () => {
    it('renders button with correct text and attributes', () => {
      const { getByTestId } = render(<LoadMoreMessagesButton onClick={() => {}} />);
      const button = getByTestId('load-more-messages-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Load more messages');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('govuk-button--secondary');
    });

    it('calls onClick when clicked', () => {
      const onClick = jest.fn();
      const { getByTestId } = render(<LoadMoreMessagesButton onClick={onClick} />);
      fireEvent.click(getByTestId('load-more-messages-button'));
      expect(onClick).toHaveBeenCalled();
    });
  });
});
