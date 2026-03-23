import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StructuredMessage from '../../../../src/components/message/types/structured-message';

const structuredMessages = require('../../../data/structured-messages.json');

describe('StructuredMessage component', () => {
  test('renders StructuredMessage components with correct button content', async () => {
    render(
      <StructuredMessage
        contents={structuredMessages[0].content}
        handleQuickReply={() => { }}
      />
    );

    const quickReplyButtons = screen.getAllByRole('button');
    expect(quickReplyButtons).toHaveLength(2);
    expect(quickReplyButtons[0]).toHaveTextContent('Yes');
    expect(quickReplyButtons[1]).toHaveTextContent('No');
  });

  test('handles Yes button being clicked', async () => {

    const mockHandleReply = jest.fn();

    render(
      <StructuredMessage
        contents={structuredMessages[0].content}
        handleQuickReply={mockHandleReply}
      />
    );

    const quickReplyButtons = screen.getAllByRole('button');
    expect(quickReplyButtons).toHaveLength(2);
    expect(quickReplyButtons[0]).toHaveTextContent('Yes');
    expect(quickReplyButtons[1]).toHaveTextContent('No');

    const user = userEvent.setup();
    await user.click(quickReplyButtons[0]);
    expect(mockHandleReply).toHaveBeenCalledTimes(1);
  });

  test('handles No button being clicked', async () => {

    const mockHandleReply = jest.fn();

    render(
      <StructuredMessage
        contents={structuredMessages[0].content}
        handleQuickReply={mockHandleReply}
      />
    );

    const quickReplyButtons = screen.getAllByRole('button');
    expect(quickReplyButtons).toHaveLength(2);
    expect(quickReplyButtons[0]).toHaveTextContent('Yes');
    expect(quickReplyButtons[1]).toHaveTextContent('No');

    const user = userEvent.setup();
    await user.click(quickReplyButtons[1]);
    expect(mockHandleReply).toHaveBeenCalledTimes(1);
  });

  test('handles Enter key press on Yes button', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();

    const { container } = render(
      <StructuredMessage
        contents={structuredMessages[0].content}
        handleQuickReply={mockHandler}
      />
    );

    const noBtn = screen.getByRole('button', { name: 'No' });
    noBtn.focus();
    await user.keyboard('{Enter}');

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][1]).toBe('No');

    // hidden => nothing rendered
    expect(container).toBeEmptyDOMElement();

  });


  test('clicking a button falls back to payload when text is falsy/absent, then hides component', async () => {
    
    const sampleWithMissingText = [
      { quickReply: { text: '', payload: 'ONLY_PAYLOAD' } },
      { quickReply: { payload: 'PAYLOAD_WITHOUT_TEXT' } },
    ];

    const user = userEvent.setup();
    const mockHandler = jest.fn();

    const { container } = render(
      <StructuredMessage contents={sampleWithMissingText} handleQuickReply={mockHandler} />
    );

    // The first button will render as an empty label if text is '', but DOM will still have a button.
    // Prefer selecting by index if the accessible name is empty:
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    await user.click(buttons[0]); // text is '', payload is ONLY_PAYLOAD

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][1]).toBe('ONLY_PAYLOAD');

    // After click, component hidden => renders nothing
    expect(container).toBeEmptyDOMElement();
  });


  test('pressing a non-Enter key does not call handler and does not hide', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();

    render(
      <StructuredMessage
        contents={structuredMessages[0].content}
        handleQuickReply={mockHandler}
      />
    );

    const yesBtn = screen.getByRole('button', { name: 'Yes' });
    yesBtn.focus();

    // Use a key that does NOT activate buttons
    await user.keyboard('a');
    // or: await user.keyboard('{ArrowRight}')

    // Should not have been called; still visible
    expect(mockHandler).not.toHaveBeenCalled();

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });
});
