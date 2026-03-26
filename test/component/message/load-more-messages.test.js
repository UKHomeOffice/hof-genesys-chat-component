import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadMoreButton from '../../../src/components/message/load-more-messages';

describe('LoadMoreButton', () => {
  test('renders the button with correct text', () => {
    render(<LoadMoreButton onClick={jest.fn()} />);
    expect(screen.getByText('Load more messages')).toBeInTheDocument();
  });

  test('has type button (not submit)', () => {
    render(<LoadMoreButton onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  test('has the correct data-testid', () => {
    render(<LoadMoreButton onClick={jest.fn()} />);
    expect(screen.getByTestId('load-more-messages-button')).toBeInTheDocument();
  });

  test('has the correct id', () => {
    render(<LoadMoreButton onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('id', 'load-more-messages-button');
  });

  test('applies govuk secondary button classes', () => {
    render(<LoadMoreButton onClick={jest.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('govuk-button');
    expect(button).toHaveClass('govuk-button--secondary');
    expect(button).toHaveClass('fetch-history-button');
  });

  test('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<LoadMoreButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
