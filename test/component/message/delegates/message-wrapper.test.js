import '@testing-library/jest-dom'
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import MessageWrapper from '../../../../src/components/message/delegates/message-wrapper';

describe('MessageWrapper', () => {
  test('renders children', () => {
    render(
      <MessageWrapper isLast={false} lastMessageRef={null}>
        <p>Test content</p>
      </MessageWrapper>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('attaches the ref to the wrapper div when isLast is true', () => {
    const ref = createRef();
    render(
      <MessageWrapper isLast={true} lastMessageRef={ref}>
        <p>Last message</p>
      </MessageWrapper>
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('DIV');
  });

  test('does not attach the ref when isLast is false', () => {
    const ref = createRef();
    render(
      <MessageWrapper isLast={false} lastMessageRef={ref}>
        <p>Not last</p>
      </MessageWrapper>
    );
    expect(ref.current).toBeNull();
  });

  test('does not throw when lastMessageRef is null and isLast is false', () => {
    expect(() =>
      render(
        <MessageWrapper isLast={false} lastMessageRef={null}>
          <p>Safe</p>
        </MessageWrapper>
      )
    ).not.toThrow();
  });

  test('renders multiple children correctly', () => {
    render(
      <MessageWrapper isLast={false} lastMessageRef={null}>
        <span>First</span>
        <span>Second</span>
      </MessageWrapper>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
