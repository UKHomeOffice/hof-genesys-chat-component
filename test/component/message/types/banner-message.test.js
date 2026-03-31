import '@testing-library/jest-dom'
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import BannerMessage from '../../../../src/components/message/types/banner-message';

describe('BannerMessage', () => {
  const baseMessage = { type: 'Banner', text: 'Agent has joined the chat' };

  test('renders the message text', () => {
    render(<BannerMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    expect(screen.getByText('Agent has joined the chat')).toBeInTheDocument();
  });

  test('has role article', () => {
    render(<BannerMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  test('has aria-label "Agent connected" when disconnected is not set', () => {
    render(<BannerMessage message={baseMessage} isLast={false} lastMessageRef={null} />);
    expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Banner message');
  });

  test('applies govuk-body class to the paragraph', () => {
    const { container } = render(
      <BannerMessage message={baseMessage} isLast={false} lastMessageRef={null} />
    );
    expect(container.querySelector('p.govuk-body')).toBeInTheDocument();
  });

  test('attaches ref when isLast is true', () => {
    const ref = createRef();
    render(<BannerMessage message={baseMessage} isLast={true} lastMessageRef={ref} />);
    expect(ref.current).not.toBeNull();
  });

  test('does not attach ref when isLast is false', () => {
    const ref = createRef();
    render(<BannerMessage message={baseMessage} isLast={false} lastMessageRef={ref} />);
    expect(ref.current).toBeNull();
  });
});
