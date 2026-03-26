import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AgentConnected from '../../../src/components/message/agent-connected';

describe('AgentConnected component', () => {
  test('renders the agent connected message with provided text', () => {
    const testText = 'An agent has joined the chat';
    render(<AgentConnected text={testText} />);

    const banner = screen.getByTestId('agent-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(testText);
  });
});
