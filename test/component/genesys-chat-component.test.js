/**
 * GenesysChatComponent — comprehensive integration test suite
 *
 * Strategy:
 * - genesysService is mocked at the module boundary (the only external dependency
 *   that can't run in JSDOM). All hooks, utils, and message components run for real.
 * - Real-like fixture data drives message rendering assertions so tests reflect
 *   actual Genesys payloads rather than invented shapes.
 * - Each describe block covers a distinct lifecycle or feature area so failures
 *   pinpoint the relevant concern immediately.
 */
jest.mock('../../src/services/genesys-service.js', () => ({
  genesysService: {
    setLogger: jest.fn(),
    setDebugMode: jest.fn(),
    log: jest.fn(),
    loadGenesysScript: jest.fn(),
    sendMessageToGenesys: jest.fn(),
    subscribeAgentTyping: jest.fn(),
    unSubscribeAgentTyping: jest.fn(),
    initialiseGenesysConversation: jest.fn(),
    subscribeToGenesysMessages: jest.fn(),
    subscribeToGenesysOldMessages: jest.fn(),
    subscribeToSessionRestored: jest.fn(),
    subscribeToGenesysOffline: jest.fn(),
    subscribeToGenesysReconnected: jest.fn(),
    fetchMessageHistory: jest.fn(),
    subscribeToErrors: jest.fn(),
    clearConversation: jest.fn(),
  },
}));

import '@testing-library/jest-dom';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { genesysService } from '../../src/services/genesys-service.js';
import GenesysChatComponent from '../../src/components/genesys-chat-component';

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------
import inboundMessages from '../data/inbound-messages.json';
import outboundMessages from '../data/outbound-messages.json';
import restoredMessages from '../data/restored-messages.json';
import largeSetRestoredMessages from '../data/large-set-restored-messages.json';
import structuredMessages from '../data/structured-messages.json';

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  window.HTMLDialogElement.prototype.showModal = jest.fn();
  window.HTMLDialogElement.prototype.close = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  cleanup();
  delete globalThis.Genesys;
  try { jest.useRealTimers(); } catch (_) { }
});

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SERVICE_METADATA = {
  localStorageKey: 'test-local-storage-key',
  serviceName: 'ETA',
  agentConnectedText: 'You are now connected to an agent.',
  agentDisconnectedText: 'The agent has disconnected.',
  offlineText: 'You are currently offline. Messages cannot be sent until reconnected to the internet.',
  onlineText: 'You are now online. Messages can now be sent.',
  botMetaDisplay: 'Digital assistant',
};

/**
 * Renders the component.
 * genesysIsReady is only true after initialiseGenesysConversation calls its
 * first argument, so callers must mock that when they need the chat UI visible.
 */
function renderComponent({
  onChatEnded = jest.fn(),
  serviceMetadata = SERVICE_METADATA,
  maxCharacterLimit = 4096,
  debugMode = false,
} = {}) {
  return render(
    <GenesysChatComponent
      genesysEnvironment="test-environment"
      deploymentId="test-deployment-id"
      serviceMetadata={serviceMetadata}
      loadingSpinner={<p data-testid="loading-spinner">Loading…</p>}
      onChatEnded={onChatEnded}
      errorComponent={<p data-testid="error-component">An error has occurred</p>}
      maxCharacterLimit={maxCharacterLimit}
      debugMode={debugMode}
    />
  );
}

// Makes Genesys ready and wires up the standard empty-message subscription.
function makeGenesysReady() {
  globalThis.Genesys = {};
  genesysService.initialiseGenesysConversation.mockImplementation((onReady) => onReady());
  genesysService.subscribeToGenesysMessages.mockImplementation((callback) => callback([]));
}

// ---------------------------------------------------------------------------
// 1. Initialisation
// ---------------------------------------------------------------------------

describe('Initialisation', () => {
  test('shows the loading spinner while Genesys is not yet ready', () => {
    // Do NOT mock initialiseGenesysConversation — it never calls onReady
    renderComponent();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-messenger-form')).not.toBeInTheDocument();
  });

  test('shows the chat UI once Genesys is ready', () => {
    makeGenesysReady();
    renderComponent();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-messenger-form')).toBeInTheDocument();
  });

  test('loads the Genesys script when the SDK is not already present', () => {
    // globalThis.Genesys deliberately absent

    renderComponent();
    expect(genesysService.loadGenesysScript).toHaveBeenCalledWith(
      'test-environment',
      'test-deployment-id'
    );
    expect(genesysService.initialiseGenesysConversation).not.toHaveBeenCalled();
  });

  test('skips script loading and initialises directly when the SDK is already present', () => {
    makeGenesysReady();
    renderComponent();
    expect(genesysService.loadGenesysScript).not.toHaveBeenCalled();
    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalledTimes(1);
  });

  test('calls setLogger with the provided loggingCallback on mount', () => {
    const loggingCallback = jest.fn();
    render(
      <GenesysChatComponent
        genesysEnvironment="env"
        deploymentId="id"
        serviceMetadata={SERVICE_METADATA}
        loggingCallback={loggingCallback}
        onChatEnded={jest.fn()}
      />
    );
    expect(genesysService.setLogger).toHaveBeenCalledWith(loggingCallback);
  });

  test('calls setDebugMode with the debugMode prop', () => {
    renderComponent({ debugMode: true });
    expect(genesysService.setDebugMode).toHaveBeenCalledWith(true);
  });

  test('initialises the conversation with the correct localStorageKey', () => {
    makeGenesysReady();
    renderComponent();
    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'test-local-storage-key'
    );
  });

  test('applies default service metadata values when none are provided', () => {
    globalThis.Genesys = {};
    genesysService.initialiseGenesysConversation.mockImplementation((onReady) => onReady());
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => callback([]));

    render(
      <GenesysChatComponent
        genesysEnvironment="env"
        deploymentId="id"
        serviceMetadata={{}}
        onChatEnded={jest.fn()}
      />
    );

    // The component should not throw and the form should appear
    expect(screen.getByTestId('chat-messenger-form')).toBeInTheDocument();

    // Default localStorageKey is passed to initialiseGenesysConversation
    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      'genesys_chat_session'
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Message rendering — inbound
// ---------------------------------------------------------------------------

describe('Inbound message rendering', () => {
  beforeEach(() => makeGenesysReady());

  test('renders an inbound message with correct text', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([inboundMessages[0]])
    );
    renderComponent();
    const message = screen.getByTestId('inbound-message-wrapper');
    expect(message).toHaveTextContent("What's the price for this service");
  });

  test('renders the correct "You at" metadata for an inbound message', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([inboundMessages[0]])
    );
    renderComponent();
    expect(screen.getByText(/You at 09:38/i)).toBeInTheDocument();
  });

  test('renders multiple inbound messages in order', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback(inboundMessages)
    );
    renderComponent();
    const messages = screen.getAllByTestId('inbound-message-wrapper');
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]).toHaveTextContent("What's the price for this service");
    expect(messages[1]).toHaveTextContent("The Chat interface displays messages in a clear, " +
      "readable format Messages are grouped by sender with clear differentiation " +
      "(e.g. user messages on the right, recipient messages on the left)");
  });

  test('renders inside the chat log region', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([inboundMessages[0]])
    );
    renderComponent();
    const log = screen.getByRole('log');
    expect(within(log).getByTestId('inbound-message-wrapper')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 3. Message rendering — outbound
// ---------------------------------------------------------------------------

describe('Outbound message rendering', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    makeGenesysReady()
  });

  test('renders an outbound message with correct text', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([outboundMessages[2]])
    );
    renderComponent();
    const msg = screen.getByTestId('outbound-message-wrapper');
    expect(msg).toHaveTextContent('Hello and welcome to the ETA webchat service');
  });

  test('renders "Digital assistant at" metadata for a bot message', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([outboundMessages[2]])
    );
    renderComponent();
    expect(screen.getByText(/Digital assistant at 09:38/i)).toBeInTheDocument();
  });

  test('renders the agent nickname as metadata when an agent sends a message', () => {
    const agentMessage = {
      direction: 'Outbound',
      type: 'Text',
      text: 'Hello, this is your agent speaking.',
      channel: {
        time: '2025-07-31T09:40:00Z',
        from: { nickname: 'Agent Smith' },
      },
    };
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([agentMessage])
    );
    renderComponent();
    expect(screen.getByText(/Agent Smith at/i)).toBeInTheDocument();
  });

  test('does not render an outbound message with empty text', () => {
    const emptyMessage = {
      direction: 'Outbound',
      type: 'Text',
      text: '',
      channel: { time: '2025-07-31T09:38:00Z' },
    };
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([emptyMessage])
    );
    renderComponent();
    expect(screen.queryByTestId('outbound-message')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Session restore
// ---------------------------------------------------------------------------

describe('Session restore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    makeGenesysReady()
  });

  test('renders restored outbound messages', () => {
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );

    renderComponent();

    const messages = screen.getAllByTestId('outbound-message-wrapper');
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]).toHaveTextContent('Welcome to the webchat, in few word how can i help you today?');

    expect(messages[1]).toHaveTextContent('Ok, for more information please see the documentation on our home page');

    const messageMetaData = within(messages[1]).getByTestId('message-metadata')
    expect(messageMetaData).toHaveTextContent('Digital assistant at 09:39')
  });

  test('renders restored inbound messages', () => {
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );
    renderComponent();
    const messages = screen.getAllByTestId('inbound-message-wrapper');
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]).toHaveTextContent('Hello, I need help with my application');
    expect(messages[1]).toHaveTextContent('Please connect me to an agent');

    const messageMetaData = within(messages[1]).getByTestId('message-metadata')
    expect(messageMetaData).toHaveTextContent('You at 09:39')
  });

  test('restored mixed messages appear in correct chronological order', () => {
    // Arrange – restore with large mixed dataset
    genesysService.subscribeToSessionRestored.mockImplementation(callback =>
      callback(largeSetRestoredMessages)
    );

    renderComponent();

    // Extract rendered DOM messages in display order
    const rendered = screen.getAllByRole('article'); // all message wrappers
    const renderedTexts = rendered.map(message => message.textContent);

    // Build expected chronological order by sorting fixture timestamps
    const expectedOrder = [...largeSetRestoredMessages.messages]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(message => message.text);

    // Assert each DOM message text appears in the expected order
    expectedOrder.forEach((expectedText, index) => {
      expect(renderedTexts[index]).toContain(expectedText);
    });
  });

  test('does not restore session messages after a reconnect event', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([outboundMessages[0], inboundMessages[0]])
    );
    genesysService.subscribeToGenesysReconnected.mockImplementation((callback) => callback());
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );

    renderComponent();

    // Only the two live messages should appear, not the restored ones
    expect(screen.getAllByTestId('outbound-message-wrapper')).toHaveLength(1);
    expect(screen.getAllByTestId('inbound-message-wrapper')).toHaveLength(1);
  });

  test('scrolls to the latest message after session restore', () => {
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );
    renderComponent();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  test('correctly sets hidden property on historic quick reply buttons', () => {
    // Stuctured messages contains 6 individual quick reply buttnons
    const historicalMessages = { messages: [...restoredMessages.messages, ...structuredMessages] }

    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(historicalMessages)
    );

    renderComponent();

    // Only 2 buttons should be visible once the component is rendered
    const messages = screen.getAllByTestId('quick-reply-button');
    expect(messages.length).toBe(2);
  });

  test('correctly sets hidden property on last message upon sending a message post restore', async () => {
    const historicalMessages = { messages: [...restoredMessages.messages, ...structuredMessages] }

    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(historicalMessages)
    );

    renderComponent();

    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Test message');
    await userEvent.click(screen.getByTestId('send-message-button'));

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Test message',
      expect.any(Function)
    );
    expect(input).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// 5. Historical messages / load more
// ---------------------------------------------------------------------------

describe('Historical messages and load more', () => {
  let onFetchHistory;
  let onHistoryComplete;

  beforeEach(() => {
    makeGenesysReady();
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(largeSetRestoredMessages)
    );
    genesysService.subscribeToGenesysOldMessages.mockImplementation((onFetch, onComplete) => {
      onFetchHistory = onFetch;
      onHistoryComplete = onComplete;
    });
  });

  test('shows the "Load more messages" button when >= 24 historical messages are present', async () => {
    renderComponent();
    expect(
      await screen.findByRole('button', { name: /Load more messages/i })
    ).toBeInTheDocument();
  });

  test('calls fetchMessageHistory when the button is clicked', async () => {
    renderComponent();
    const button = await screen.findByRole('button', { name: /Load more messages/i });
    await userEvent.click(button);
    expect(genesysService.fetchMessageHistory).toHaveBeenCalledTimes(1);
  });

  test('appends newly fetched historical messages to the list', async () => {
    renderComponent();

    const before = screen.getAllByTestId('outbound-message-wrapper').length;

    act(() => {
      onFetchHistory({
        messages: [{
          text: 'An older message from history',
          messageType: 'outbound',
          type: 'text',
          timestamp: '2025-07-31T09:00:00Z',
          originatingEntity: 'Bot',
        }],
      });
    });

    await waitFor(() => {
      const outboundMessages = screen.getAllByTestId('outbound-message-wrapper');
      expect(outboundMessages.length).toBe(before + 1);

      const newOutboundMessage = screen.getByText(/An older message from history/i);
      expect(newOutboundMessage).toBeInTheDocument();
    });
  });

  test('hides the "Load more messages" button once all history is fetched', async () => {
    renderComponent();
    const button = await screen.findByRole('button', { name: /Load more messages/i });

    act(() => {
      onFetchHistory({ messages: [] });
      onHistoryComplete(true);
    });

    await waitFor(() => {
      expect(button).not.toBeInTheDocument();
    });
  });

  test('does not show the "Load more messages" button when fewer than 24 historical messages', () => {
    // Override with a small restored set
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );
    renderComponent();
    expect(
      screen.queryByRole('button', { name: /Load more messages/i })
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 6. Message input and sending
// ---------------------------------------------------------------------------

describe('Message input and sending', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    makeGenesysReady()
  });

  test('updates the input field as the user types', async () => {
    renderComponent();
    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Hello');
    expect(input).toHaveValue('Hello');
  });

  test('sends the message and clears the input on form submit', async () => {
    renderComponent();

    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Test message');
    await userEvent.click(screen.getByTestId('send-message-button'));

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Test message',
      expect.any(Function)
    );
    expect(input).toHaveValue('');
  });

  test('sends the message when Enter is pressed', async () => {
    renderComponent();
    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Enter message{Enter}');
    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith(
      'Enter message',
      expect.any(Function)
    );
  });

  test('does not send a message when Shift+Enter is pressed (allows newline)', async () => {
    renderComponent();
    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Hello, I need help{shift>}{enter}{/shift}with an ETA');
    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
    expect(input).toHaveTextContent('Hello, I need help with an ETA');
  });

  test('does not send an empty message on form submit', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('send-message-button'));

    expect(genesysService.sendMessageToGenesys).not.toHaveBeenCalled();
  });

  test('enforces the maxCharacterLimit on the input', () => {
    renderComponent({ maxCharacterLimit: 100 });
    const input = screen.getByTestId('message-input');
    expect(input).toHaveAttribute('maxlength', '100');
  });

  test('hides any active structured message content after the user sends a message', async () => {
    // Start with a structured message visible
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([structuredMessages[2]])
    );
    renderComponent();

    // Quick reply buttons should be visible
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();

    // User types and submits a message
    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Manual reply');
    await userEvent.click(screen.getByTestId('send-message-button'));

    // Quick reply buttons should now be hidden
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Quick replies
// ---------------------------------------------------------------------------

describe('Quick replies (structured messages)', () => {
  beforeEach(() => makeGenesysReady());

  test('renders quick reply buttons for a structured message', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([structuredMessages[2]])
    );
    renderComponent();
    expect(screen.getAllByRole('button', { name: /yes|no/i }).length).toBeGreaterThan(0);
  });

  test('sends the quick reply text to Genesys when a button is clicked', async () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([structuredMessages[2]])
    );
    renderComponent();

    const yesButton = screen.getByRole('button', { name: /yes/i });
    await userEvent.click(yesButton);

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('Yes', expect.any(Function));
  });

  test('invokes error handler when quick reply fails', async () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([structuredMessages[2]])
    );

    genesysService.sendMessageToGenesys.mockImplementation((_msg, onError) => onError());
    
    renderComponent();

    const yesButton = screen.getByRole('button', { name: /yes/i });
    await userEvent.click(yesButton);

    expect(screen.getByTestId('error-component')).toBeInTheDocument();
  });


  test('sends the quick reply text to Genesys when input text is sent', async () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([structuredMessages[2]])
    );
    renderComponent();

    const input = screen.getByTestId('message-input');
    await userEvent.type(input, 'Yes');
    await userEvent.click(screen.getByTestId('send-message-button'));

    expect(genesysService.sendMessageToGenesys).toHaveBeenCalledWith('Yes', expect.any(Function));
  });

  test('hides previously shown structured message when a new message arrives', async () => {
    let receiveMessage;
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => {
      receiveMessage = callback;
      callback([structuredMessages[2]]);
    });

    renderComponent();
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();

    act(() => {
      receiveMessage([outboundMessages[2]]);
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /yes/i })).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Typing indicator
// ---------------------------------------------------------------------------

describe('Typing indicator', () => {
  test('does not show the typing indicator on initial render', () => {
    renderComponent();
    expect(screen.queryByTestId('agent-typing')).not.toBeInTheDocument();
  });

  test('shows the typing indicator when the agent starts typing', () => {
    makeGenesysReady();

    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());

    renderComponent();

    expect(screen.getByTestId('agent-typing')).toHaveClass('show');
  });

  test('hides the typing indicator when the agent stops typing', () => {
    makeGenesysReady();

    let startTyping;
    let stopTyping;
    genesysService.subscribeAgentTyping.mockImplementation((callback) => { startTyping = callback; });
    genesysService.unSubscribeAgentTyping.mockImplementation((callback) => { stopTyping = callback; });

    renderComponent();

    act(() => { startTyping(); });
    expect(screen.getByTestId('agent-typing')).toHaveClass('show');

    act(() => { stopTyping(); });
    expect(screen.queryByTestId('agent-typing')).not.toBeInTheDocument();
  });

  test('hides the typing indicator when an outbound human message arrives', () => {
    let receiveMessage;
    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());
    makeGenesysReady();
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => {
      receiveMessage = callback;
      callback([]);
    });

    renderComponent();
    expect(screen.getByTestId('agent-typing')).toHaveClass('show');

    act(() => {
      receiveMessage([{
        direction: 'Outbound',
        type: 'Text',
        text: 'Here is your answer.',
        channel: { time: '2025-07-31T09:40:00Z' },
        originatingEntity: 'Human',
      }]);
    });

    expect(screen.queryByTestId('agent-typing')).not.toBeInTheDocument();
  });

  test('shows the agent connected banner when the agent starts typing', () => {
    makeGenesysReady();
    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());
    renderComponent();
    expect(screen.getByTestId('agent-banner')).toBeInTheDocument();
    expect(screen.getByTestId('agent-banner')).toHaveTextContent(
      'You are now connected to an agent.'
    );
  });

  test('only shows the agent connected banner once even with multiple typing events', () => {
    makeGenesysReady();

    let typingCallback;
    let messagesCallback;

    // Capture the typing callback
    genesysService.subscribeAgentTyping.mockImplementation(callback => {
      typingCallback = callback;
    });

    // Capture the messages callback
    genesysService.subscribeToGenesysMessages.mockImplementation(callback => {
      messagesCallback = callback;
    });

    renderComponent();

    // 1. First typing event → creates the first agent-connected banner
    act(() => typingCallback());
    expect(screen.getAllByTestId('agent-banner')).toHaveLength(1);

    // 2. Simulate a normal outgoing message arriving from Genesys
    act(() =>
      messagesCallback([
        {
          direction: 'Outbound',
          type: 'Text',
          text: 'Hello from the bot'
        }
      ])
    );

    // 3. Second typing callback should NOT create another banner message
    act(() => typingCallback());

    expect(screen.getAllByTestId('agent-banner')).toHaveLength(1);
  });

  test('only shows the agent connected banner correctly between disconnects', async () => {
    makeGenesysReady();

    let typingCallback;
    let messagesCallback;

    // Capture the typing callback
    genesysService.subscribeAgentTyping.mockImplementation(callback => {
      typingCallback = callback;
    });

    // Capture the messages callback
    genesysService.subscribeToGenesysMessages.mockImplementation(callback => {
      messagesCallback = callback;
    });

    renderComponent();

    // 1. First typing event → creates the first agent-connected banner
    act(() => typingCallback());
    expect(screen.getAllByTestId('agent-banner')).toHaveLength(1);
    expect(screen.getByText('You are now connected to an agent.')).toBeInTheDocument();

    // 2. Simulate an agent disconnect
    act(() =>
      messagesCallback([{
        direction: 'Outbound',
        type: 'Event',
        channel: { time: '2025-07-31T09:45:00Z' },
        events: [{
          eventType: 'Presence',
          presence: {
            type: 'Disconnect'
          }
        }],
        originatingEntity: "Human"
      }])
    );

    // 3. Check agent connected banner has now been remove and agent disconnected has been added
    await waitFor(() => {
      expect(screen.queryByText('You are now connected to an agent.')).toBe(null);
    });

    await waitFor(() => {
      expect(screen.getByText('The agent has disconnected.')).toBeInTheDocument();
    });

    // 4. Second typing callback should NOT create another banner message
    act(() => typingCallback());

    // 5. Check the agent connected banner is correct displayed again

    await waitFor(() => {
      expect(screen.getByText('You are now connected to an agent.')).toBeInTheDocument()
    });
  });
});

// ---------------------------------------------------------------------------
// 9. End chat
// ---------------------------------------------------------------------------

describe('End chat', () => {
  beforeEach(() => makeGenesysReady());

  test('opens the end chat modal when the end chat button is clicked', async () => {
    renderComponent();
    await userEvent.click(screen.getByTestId('end-chat-button'));
    expect(screen.getByTestId('end-chat-modal')).toBeInTheDocument();
  });

  test('closes the modal without ending chat when the cancel button is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('end-chat-button'));
    await userEvent.click(screen.getByTestId('close-end-chat-modal-button'));

    expect(screen.queryByTestId('end-chat-modal')).not.toBeInTheDocument();
    expect(genesysService.clearConversation).not.toHaveBeenCalled();
  });

  test('calls clearConversation with the correct key when end chat is confirmed', async () => {
    renderComponent();
    await userEvent.click(screen.getByTestId('end-chat-button'));
    await userEvent.click(screen.getByTestId('confirm-end-chat-button'));
    expect(genesysService.clearConversation).toHaveBeenCalledWith('test-local-storage-key');
  });

  test('calls the onChatEnded callback when end chat is confirmed', async () => {
    const onChatEnded = jest.fn();
    renderComponent({ onChatEnded });
    await userEvent.click(screen.getByTestId('end-chat-button'));
    await userEvent.click(screen.getByTestId('confirm-end-chat-button'));
    expect(onChatEnded).toHaveBeenCalledTimes(1);
  });

  test('logs the end chat event with the correct service name', async () => {
    renderComponent();
    await userEvent.click(screen.getByTestId('end-chat-button'));
    await userEvent.click(screen.getByTestId('confirm-end-chat-button'));
    expect(genesysService.log).toHaveBeenCalledWith(
      'info',
      'Ending conversation as per user request',
      { service: 'eta' }
    );
  });
});

// ---------------------------------------------------------------------------
// 10. Offline / reconnect banners
// ---------------------------------------------------------------------------

describe('Offline and reconnect banners', () => {
  beforeEach(() => makeGenesysReady());

  test('shows the offline banner when the offline event fires', () => {
    let goOffline;
    genesysService.subscribeToGenesysOffline.mockImplementation((callback) => { goOffline = callback; });
    renderComponent();

    act(() => { goOffline(); });

    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
  });

  test('disables the message input, send button, and end chat button when offline', async () => {
    let goOffline;
    genesysService.subscribeToGenesysOffline.mockImplementation((callback) => { goOffline = callback; });
    renderComponent();

    act(() => { goOffline(); });

    await waitFor(() => {
      expect(screen.getByTestId('message-input')).toBeDisabled();
      expect(screen.getByTestId('send-message-button')).toBeDisabled();
      expect(screen.getByTestId('end-chat-button')).toBeDisabled();
    });
  });

  test('shows the reconnected banner after the reconnect delay', async () => {
    jest.useFakeTimers();
    genesysService.subscribeToGenesysReconnected.mockImplementation((callback) => callback());
    renderComponent();

    act(() => { jest.advanceTimersByTime(10); });

    expect(screen.getByText(/You are now online/i)).toBeInTheDocument();
  });

  test('re-enables the form controls after reconnecting', async () => {
    jest.useFakeTimers();
    let goOffline;
    let goOnline;
    genesysService.subscribeToGenesysOffline.mockImplementation((callback) => { goOffline = callback; });
    genesysService.subscribeToGenesysReconnected.mockImplementation((callback) => { goOnline = callback; });
    renderComponent();

    act(() => { goOffline(); });
    await waitFor(() => expect(screen.getByTestId('message-input')).toBeDisabled());

    act(() => {
      goOnline();
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => expect(screen.getByTestId('message-input')).not.toBeDisabled());
  });

  test('does not restore session messages after a reconnect event', () => {
    genesysService.subscribeToGenesysReconnected.mockImplementation((callback) => callback());
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );
    renderComponent();
    expect(screen.queryByTestId('outbound-message')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 11. Error states
// ---------------------------------------------------------------------------

describe('Error states', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  })

  test('shows the error component when an SDK error fires', () => {
    makeGenesysReady();

    genesysService.subscribeToErrors.mockImplementation((callback) => callback());

    renderComponent();

    expect(screen.getByTestId('error-component')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-messenger-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  test('shows the error component when initialisation fails', () => {
    globalThis.Genesys = {};
    genesysService.initialiseGenesysConversation.mockImplementation((onReady, onError) => {
      onReady();
      onError();
    });
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => callback([]));
    renderComponent();
    expect(screen.getByTestId('error-component')).toBeInTheDocument();
  });

  test('shows the error component when sendMessageToGenesys fails', async () => {
    makeGenesysReady();
    genesysService.sendMessageToGenesys.mockImplementation((_msg, onError) => onError());
    renderComponent();

    await userEvent.type(screen.getByTestId('message-input'), 'test');
    await userEvent.click(screen.getByTestId('send-message-button'));

    expect(screen.getByTestId('error-component')).toBeInTheDocument();
  });

  test('shows the error component when fetchMessageHistory fails', async () => {
    makeGenesysReady();
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(largeSetRestoredMessages)
    );
    genesysService.subscribeToGenesysOldMessages.mockImplementation(() => { });
    let errorCallback;
    genesysService.fetchMessageHistory.mockImplementation((onError) => {
      errorCallback = onError;
    });

    renderComponent();

    const btn = await screen.findByRole('button', { name: /Load more messages/i });
    await userEvent.click(btn);

    act(() => { errorCallback(); });

    await waitFor(() => {
      expect(screen.getByTestId('error-component')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 12. Banner messages
// ---------------------------------------------------------------------------

describe('Banner messages', () => {
  beforeEach(() => makeGenesysReady());

  test('renders the agent connected banner inside the log region', () => {
    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());
    renderComponent();
    const log = screen.getByRole('log');
    expect(within(log).getByTestId('agent-banner')).toBeInTheDocument();
  });

  test('renders the agent disconnected banner with the correct text', async () => {
    let receiveMessage;

    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => {
      receiveMessage = callback;
      callback([]);
    });

    renderComponent();

    act(() => {
      receiveMessage([{
        direction: 'Outbound',
        type: 'Event',
        channel: { time: '2025-07-31T09:45:00Z' },
        events: [{
          eventType: 'Presence',
          presence: {
            type: 'Disconnect'
          }
        }],
        originatingEntity: "Human"
      }]);
    });

    await waitFor(() => {
      expect(screen.getByText('The agent has disconnected.')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 13. Scroll behaviour
// ---------------------------------------------------------------------------

describe('Scroll behaviour', () => {
  beforeEach(() => makeGenesysReady());

  test('scrolls to the latest message when a new message arrives', () => {
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([inboundMessages[0]])
    );
    renderComponent();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', block: 'nearest' })
    );
  });

  test('does not scroll when historical messages are prepended via load more', async () => {
    let onFetchHistory;

    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(largeSetRestoredMessages)
    );
    genesysService.subscribeToGenesysOldMessages.mockImplementation((onFetch) => {
      onFetchHistory = onFetch;
    });

    renderComponent();

    // Reset the spy after the initial scroll that happens on session restore
    Element.prototype.scrollIntoView.mockClear();

    const btn = await screen.findByRole('button', { name: /Load more messages/i });
    await userEvent.click(btn);

    act(() => {
      onFetchHistory({
        messages: [{
          text: 'Old message',
          messageType: 'outbound',
          type: 'text',
          timestamp: '2025-07-31T08:00:00Z',
          originatingEntity: 'Bot',
        }]
      });
    });

    // scrollIntoView should not have been called again for the prepended history
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// 14. Mixed live + historical message ordering
// ---------------------------------------------------------------------------

describe('Mixed live and historical message ordering', () => {
  beforeEach(() => makeGenesysReady());

  test('displays live messages after historical ones', () => {
    genesysService.subscribeToSessionRestored.mockImplementation((callback) =>
      callback(restoredMessages)
    );

    let receiveMessage;
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) => {
      receiveMessage = callback;
    });

    renderComponent();

    act(() => {
      receiveMessage([{
        "direction": "Inbound",
        "text": "I'd like to speak to an agent",
        "type": "Text",
        "channel": {
          "time": "2025-07-31T09:42:00Z"
        },
        "metadata": {
          "correlationId": "00000000-0000-0000-0000-000000000000"
        },
        "content": []
      }]);
    });


    const allInbound = screen.getAllByTestId('inbound-message-wrapper');

    // The live message should be last in the DOM
    expect(allInbound[allInbound.length - 1]).toHaveTextContent(
      "I'd like to speak to an agent"
    );
  });
});

// ---------------------------------------------------------------------------
// 15. Accessibility
// ---------------------------------------------------------------------------

describe('Accessibility', () => {
  const { axe, toHaveNoViolations } = require('jest-axe');
  expect.extend(toHaveNoViolations);

  test('the chat log region has the correct ARIA attributes', () => {
    makeGenesysReady();
    renderComponent();
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(log).toHaveAttribute('aria-label', 'Chat messages');
    expect(log).toHaveAttribute('aria-relevant', 'additions text');
  });

  test('the typing indicator has role status for screen readers', () => {
    makeGenesysReady();

    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());

    renderComponent();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('the chat form has no axe violations when Genesys is ready', async () => {
    makeGenesysReady();
    const { container } = renderComponent();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('the typing indicator has no axe violations when visible', async () => {
    genesysService.subscribeAgentTyping.mockImplementation((callback) => callback());
    const { container } = renderComponent();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('messages have role article', () => {
    makeGenesysReady();
    genesysService.subscribeToGenesysMessages.mockImplementation((callback) =>
      callback([inboundMessages[0], outboundMessages[2]])
    );
    renderComponent();
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(2);
  });
});
