import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MessageMetaData from '../../../src/components/message/message-meta';

describe('MessageMetaData', () => {
  test('renders the display name and timestamp in the expected format', () => {
    render(
      <MessageMetaData
        type="Inbound"
        messageTimeStamp="2024-01-01T10:00:00Z"
        metaDisplay="You"
      />
    );
    expect(screen.getByText('You at 10:00')).toBeInTheDocument();
  });

  test('sets dateTime attribute on the time element to the formatted timestamp', () => {
    const { container } = render(
      <MessageMetaData
        type="Inbound"
        messageTimeStamp="2024-01-01T10:00:00Z"
        metaDisplay="You"
      />
    );
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', '10:00');
  });

  test('sets the aria-label on the time element', () => {
    const { container } = render(
      <MessageMetaData
        type="Inbound"
        messageTimeStamp="2024-01-01T10:00:00Z"
        metaDisplay="You"
      />
    );
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('aria-label', 'You at 10:00');
  });

  test('applies inbound-meta-data class for type Inbound', () => {
    const { container } = render(
      <MessageMetaData type="Inbound" messageTimeStamp="ts" metaDisplay="You" />
    );
    expect(container.querySelector('p')).toHaveClass('inbound-meta-data');
    expect(container.querySelector('p')).not.toHaveClass('outbound-meta-data');
  });

  test('applies outbound-meta-data class for type Outbound', () => {
    const { container } = render(
      <MessageMetaData type="Outbound" messageTimeStamp="ts" metaDisplay="Agent" />
    );
    expect(container.querySelector('p')).toHaveClass('outbound-meta-data');
    expect(container.querySelector('p')).not.toHaveClass('inbound-meta-data');
  });

  test('applies govuk-body class to the paragraph regardless of type', () => {
    const { container } = render(
      <MessageMetaData type="Inbound" messageTimeStamp="ts" metaDisplay="You" />
    );
    expect(container.querySelector('p')).toHaveClass('govuk-body');
  });

  test('renders the agent display name correctly', () => {
    render(
      <MessageMetaData type="Outbound" messageTimeStamp="ts" metaDisplay="Agent Smith" />
    );
    expect(screen.getByText(/Agent Smith/)).toBeInTheDocument();
  });
});
