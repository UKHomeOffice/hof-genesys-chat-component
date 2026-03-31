import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import StructuredMessage from '../../../../src/components/message/types/structured-message';

describe('StructuredMessage', () => {
  const contents = [
    { quickReply: { text: 'Yes', payload: 'Yes' } },
    { quickReply: { text: 'No', payload: 'No' } },
  ];

  it('renders a button for each quick reply', () => {
    render(<StructuredMessage contents={contents} handleQuickReply={jest.fn()} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('applies govuk-button class to each button', () => {
    render(<StructuredMessage contents={contents} handleQuickReply={jest.fn()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('govuk-button');
      expect(button).toHaveClass('message-button');
    });
  });

  it('calls handleQuickReply with the quick reply text on click', () => {
    const handleQuickReply = jest.fn();
    render(<StructuredMessage contents={contents} handleQuickReply={handleQuickReply} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(handleQuickReply).toHaveBeenCalledTimes(1);
    expect(handleQuickReply).toHaveBeenCalledWith(expect.any(Object), 'Yes');
  });

  it('calls handleQuickReply with payload when text is absent', () => {
    const contentsWithPayloadOnly = [
      { quickReply: { text: '', payload: 'payload-value' } },
    ];
    const handleQuickReply = jest.fn();
    render(<StructuredMessage contents={contentsWithPayloadOnly} handleQuickReply={handleQuickReply} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleQuickReply).toHaveBeenCalledWith(expect.any(Object), 'payload-value');
  });

  it('calls handleQuickReply with the quick reply text on Enter keydown', () => {
    const handleQuickReply = jest.fn();
    render(<StructuredMessage contents={contents} handleQuickReply={handleQuickReply} />);
    fireEvent.keyDown(screen.getByText('No'), { key: 'Enter' });
    expect(handleQuickReply).toHaveBeenCalledWith(expect.any(Object), 'No');
  });

  it('does not call handleQuickReply on non-Enter keydown', () => {
    const handleQuickReply = jest.fn();
    render(<StructuredMessage contents={contents} handleQuickReply={handleQuickReply} />);
    fireEvent.keyDown(screen.getByText('Yes'), { key: 'Space' });
    expect(handleQuickReply).not.toHaveBeenCalled();
  });

  it('does not manage its own hidden state — always renders when mounted', () => {
    // The component should render unconditionally; hideContent is controlled
    // upstream by the message object and checked in OutboundMessage before
    // StructuredMessage is rendered at all.
    const handleQuickReply = jest.fn();
    render(<StructuredMessage contents={contents} handleQuickReply={handleQuickReply} />);
    // Clicking a button should NOT cause the buttons to disappear from the DOM,
    // since there is no longer any local hidden state.
    fireEvent.click(screen.getByText('Yes'));
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders inside a govuk-button-group container', () => {
    const { container } = render(
      <StructuredMessage contents={contents} handleQuickReply={jest.fn()} />
    );
    expect(container.querySelector('.govuk-button-group.select-question')).toBeInTheDocument();
  });

  it('renders nothing when contents is an empty array', () => {
    const { container } = render(<StructuredMessage contents={[]} handleQuickReply={jest.fn()} />);
    expect(container.querySelector('.govuk-button-group')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
