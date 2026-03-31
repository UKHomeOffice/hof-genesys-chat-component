import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from '../../src/components/message/typing-indicator';

const renderComponent = (isAgentTyping) => {
  return render(
    <TypingIndicator isAgentTyping={isAgentTyping} />
  );
};

describe('Typing Indicator component', () => {
  test('shows typing indicator when agent is typing', () => {
    renderComponent(true);
    const wrapper = screen.getByTestId('agent-typing');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toBeVisible();
  });

  test('show typing indicator when agent is typing', () => {
    renderComponent(true);
    const wrapper = screen.getByTestId('agent-typing');    
    expect(wrapper).toHaveClass('show');
    expect(wrapper).not.toHaveClass('hidden');
  });

  test('hides typing indicator when agent is not typing', () => {
    renderComponent(false);
    const wrapper = screen.getByTestId('agent-typing');
    expect(wrapper).toHaveClass('hidden');
    expect(wrapper).not.toHaveClass('show');
  });
});
