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
    registerForSessionClearingEvents: jest.fn(),
  },
  GenesysService: jest.fn(),
}));

import '@testing-library/jest-dom';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { genesysService } from '../../src/services/genesys-service.js';
import GenesysChatComponent from '../../src/components/genesys-chat-component';

import inboundMessages from '../data/inbound-messages.json';
import outboundMessages from '../data/outbound-messages.json';
import restoredMessages from '../data/restored-messages.json';
import largeSetRestoredMessages from '../data/large-set-restored-messages.json';
import incomingMessage from '../data/incoming-message.json';
import withStructuredMessages from '../data/structured-messages.json';

import {
  getStructureMessageIndex,
  setPreviousStructureHideTrue,
} from '../../src/utils/structured-message.js';

const { axe, toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

beforeAll(() => {
  // Mock scrollIntoView because JSDOM doesn't support it
  Element.prototype.scrollIntoView = jest.fn();

  // Mock the dialog prototype methods as JSDOM does not implement them
  window.HTMLDialogElement.prototype.showModal = jest.fn();
  window.HTMLDialogElement.prototype.close = jest.fn();
});

/* eslint-disable no-unused-vars */
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
  // Ensure any fake timers used in individual tests are reset so they don't
  // affect subsequent tests and cause unexpected timeouts when running the
  // whole test suite.
  try {
    jest.useRealTimers();
  } catch (e) {
    // Some Jest environments may not support switching timers; ignore errors
  }
});

const sampleServiceMetadata = {
  localStorageKey: 'test-local-storage-key',
  serviceName: 'ETA',
  serviceSubText: 'an ETA (electronic travel authorisation).',
  errorContactLink: 'http://localhost/example-error-link',
  agentConnectedText: 'You are now connected to an agent.',
  agentDisconnectedText: 'The agent has disconnected.',
  offlineText: "You are currently offline. Messages cannot be sent until reconnected to the internet.",
  onlineText: "You are now online. Messages can now be sent."
};

const renderGenesysChatComponent = (onChatEnded = {}) => render(
  <MemoryRouter>
    <GenesysChatComponent
      genesysEnvironment="test-genesys-environment"
      deploymentId="test-deployment-id"
      serviceMetadata={sampleServiceMetadata}
      loadingSpinner={<h1>Loading web chat</h1>}
      onChatEnded={onChatEnded}
      errorComponent={<p data-testid='error-message'>An error has occurred</p>}
    />
  </MemoryRouter>
);

describe('Genesys Chat Component', () => {  
  test('renders component with with web chat form when genesys is ready', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    renderGenesysChatComponent();

    expect(screen.getByTestId('chat-messenger-form')).toBeInTheDocument();
  });

  test('renders inbound message when message is sent to genesys', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([inboundMessages[0]]);
    });

    renderGenesysChatComponent();

    expect(screen.getByRole('log')).toBeInTheDocument();

    const messages = screen.getAllByTestId('inbound-message');
    expect(messages[0]).toBeInTheDocument();
    expect(messages[0]).toHaveTextContent("What's the price for this service");

    const messageMetaData = screen.queryByText(/You at/i);
    expect(messageMetaData).toHaveTextContent('You at 09:38');
  });

  test('renders outbound message when message is received from genesys', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([outboundMessages[2]]);
    });

    renderGenesysChatComponent();

    expect(screen.getByRole('log')).toBeInTheDocument();

    const messages = screen.getAllByTestId('outbound-message');
    expect(messages[0]).toBeInTheDocument();
    expect(messages[0]).toHaveTextContent("Hello and welcome to the ETA webchat service. Please ask me a question relating to the ETA process. You're communicating with a computer. Please do not disclose any personal or sensitive information.");

    const messageMetaData = screen.queryByText(/Digital assistant at/i);
    expect(messageMetaData).toHaveTextContent('Digital assistant at 09:38');
  });

  test('renders restored messages when previous genesys session is active', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    genesysService.subscribeToSessionRestored.mockImplementation((onSessionRestored) => {
      onSessionRestored(restoredMessages);
    });

    renderGenesysChatComponent();

    expect(screen.getByRole('log')).toBeInTheDocument();

    const outboundMessageHistory = screen.getAllByTestId('outbound-message');
    expect(outboundMessageHistory).toHaveLength(2);
    expect(outboundMessageHistory[1]).toBeInTheDocument();
    expect(outboundMessageHistory[1]).toHaveTextContent('Welcome to the webchat, in few word how can i help you today?');
    expect(outboundMessageHistory[0]).toBeInTheDocument();
    expect(outboundMessageHistory[0]).toHaveTextContent('Ok, for more information please see the documentation on our home page');

    const inboundMessageHistory = screen.getAllByTestId('inbound-message');
    expect(inboundMessageHistory).toHaveLength(2);
    expect(inboundMessageHistory[1]).toBeInTheDocument();
    expect(inboundMessageHistory[1]).toHaveTextContent('Hello, I need help with my application');
    expect(inboundMessageHistory[0]).toBeInTheDocument();
    expect(inboundMessageHistory[0]).toHaveTextContent('Please connect me to an agent');

    const messageMetaData = screen.queryAllByText(/Digital assistant at/i);
    messageMetaData.forEach((metaData) =>
      expect(metaData).toHaveTextContent('Digital assistant at 09:39'));
  });

  test('renders more historical messages when load more messages event is triggered', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    // Setup callback placeholders for later use
    let onFetchHistoryCallback;
    let onHistoryCompleteCallback;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    genesysService.subscribeToSessionRestored.mockImplementation((onSessionRestored) => {
      onSessionRestored(largeSetRestoredMessages);
    });

    genesysService.subscribeToGenesysOldMessages.mockImplementation((onFetchHistory, onHistoryComplete) => {
      onFetchHistoryCallback = onFetchHistory;
      onHistoryCompleteCallback = onHistoryComplete;
    });

    renderGenesysChatComponent();

    expect(screen.getByRole('log')).toBeInTheDocument();

    const outboundMessageHistory = screen.getAllByTestId('outbound-message');
    expect(outboundMessageHistory).toHaveLength(12);

    const inboundMessageHistory = screen.getAllByTestId('inbound-message');
    expect(inboundMessageHistory).toHaveLength(13);

    const assistantMetaData = screen.queryAllByText(/Digital assistant at/i);
    expect(assistantMetaData).toHaveLength(12);

    const userMetaData = screen.queryAllByText(/You at/i);
    expect(userMetaData).toHaveLength(13);

    const loadMoreMessagesButton = await screen.findByRole('button', { name: /Load more messages/i });
    expect(loadMoreMessagesButton).toBeInTheDocument();
    expect(loadMoreMessagesButton).toHaveTextContent('Load more messages');

    const user = userEvent.setup();
    await user.click(loadMoreMessagesButton);
    expect(genesysService.fetchMessageHistory).toHaveBeenCalledTimes(1);

    // Mock fetching history getting one more message and then setting the history as complete
    act(() => {
      onFetchHistoryCallback({
        messages: [{
          'text': 'Welcome to the webchat, in few word how can i help you today?',
          'messageType': 'outbound',
          'type': 'text',
          'timestamp': '2025-07-31T09:39:00Z',
          'metadata': {
            'correlationId': '00000000-0000-0000-0000-000000000000'
          },
          'originatingEntity': 'Bot'
        }]
      });
      onHistoryCompleteCallback(true);
    });

    // The latest historical message should now be populated in the messages list
    await waitFor(() => {
      const updatedMessages = screen.getAllByTestId('outbound-message');
      expect(updatedMessages).toHaveLength(13);
      expect(updatedMessages[0]).toHaveTextContent('Welcome to the webchat, in few word how can i help you today?');
    });

    // Now that all history is loaded, the load more messages button should be gone
    await waitFor(() => {
      expect(loadMoreMessagesButton).not.toBeInTheDocument();
    });
  });

  test('doesnt restore messages when reconnect event has occured', async () => {
    
    const messages = [outboundMessages[0], inboundMessages[0]];

    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived(messages);
    });

    genesysService.subscribeToGenesysReconnected.mockImplementation((onReconnected) => {
      onReconnected();
    });

    genesysService.subscribeToSessionRestored.mockImplementation((onSessionRestored) => {
      onSessionRestored(restoredMessages);
    });

    renderGenesysChatComponent();

    expect(screen.getByRole('log')).toBeInTheDocument();

    const outboundMessageHistory = screen.getAllByTestId('outbound-message');
    expect(outboundMessageHistory).toHaveLength(1);
    expect(outboundMessageHistory[0]).toBeInTheDocument();
    expect(outboundMessageHistory[0]).toHaveTextContent('Welcome to EVisa webchat, in few word how can i help you today?');

    const inboundMessageHistory = screen.getAllByTestId('inbound-message');
    expect(inboundMessageHistory).toHaveLength(1);
    expect(inboundMessageHistory[0]).toBeInTheDocument();
    expect(inboundMessageHistory[0]).toHaveTextContent('What\'s the price for this service');
  });

  test('handles user input across multiple lines', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    renderGenesysChatComponent();

    const messageInputArea = screen.getByTestId('message-input');
    await userEvent.type(messageInputArea, 'Hello, I need help{shift>}{enter}{/shift}with an ETA');

    expect(messageInputArea).toHaveTextContent('Hello, I need help with an ETA');
  });

  test('display typing indicator when agent is typing', async () => {

    genesysService.subscribeAgentTyping.mockImplementation((onAgentTyping) => {
      onAgentTyping();
    });

    const { container } = renderGenesysChatComponent();
    expect(screen.queryByRole('status')).not.toBeNull();
    expect(screen.getByTestId('agent-typing')).toHaveClass('show');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('hides typing indicator when agent stops typing', async () => {
    let agentStartTyping;
    let agentStoppedTyping;

    genesysService.subscribeAgentTyping.mockImplementation((onAgentTyping) => {
      agentStartTyping = onAgentTyping;
    });

    genesysService.unSubscribeAgentTyping.mockImplementation((onAgentStoppedTyping) => {
      agentStoppedTyping = onAgentStoppedTyping;
    });

    renderGenesysChatComponent();

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByTestId('agent-typing')).toBeNull();

    act(() => {
      agentStartTyping();
    });
    expect(screen.getByTestId('agent-typing')).toHaveClass('show');

    act(() => {
      agentStoppedTyping();
    });
    expect(screen.queryByTestId('agent-typing')).toBeNull();
  });

  test('hides typing indicator when agent sends message', async () => {
    let messagesReceived;

    genesysService.subscribeAgentTyping.mockImplementation((onAgentTyping) => {
      onAgentTyping();
    });

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      messagesReceived = onMessagesReceived;
    });

    renderGenesysChatComponent();

    expect(screen.queryByRole('status')).not.toBeNull();
    expect(screen.getByTestId('agent-typing')).toHaveClass('show');

    const message = {
      'direction': 'Outbound',
      'text': 'Great, this current price for visa categories varies on type of visa',
      'type': 'Text',
      'channel': {
        'time': '2025-07-31T09:38:00Z'
      },
      'metadata': {
        'correlationId': '00000000-0000-0000-0000-000000000000'
      },
      'originatingEntity': 'Human'
    };

    act(() => {
      messagesReceived([message]);
    });

    expect(screen.queryByTestId('agent-typing')).toBeNull();
  });

  test('handleEndChat clears conversation and calls onChatEnded callback', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    const mockOnChatEnded = jest.fn();
    // Mock clearConversation to track calls
    genesysService.clearConversation.mockImplementation(jest.fn());

    renderGenesysChatComponent(mockOnChatEnded);

    // Open the end chat modal
    const endChatButton = screen.getByTestId('end-chat-button');
    expect(endChatButton).toBeInTheDocument();
    await userEvent.click(endChatButton);

    // Modal should appear
    const modal = screen.getByTestId('end-chat-modal');
    expect(modal).toBeInTheDocument();

    // Click the confirm end chat button inside the modal
    const confirmEndChatButton = screen.getByTestId('confirm-end-chat-button');
    expect(confirmEndChatButton).toBeInTheDocument();
    await userEvent.click(confirmEndChatButton);

    // clearConversation should be called with test-local-storage-key
    expect(genesysService.clearConversation).toHaveBeenCalledWith('test-local-storage-key');

    expect(mockOnChatEnded).toHaveBeenCalled();
  });

  test('renders offline banner and disables chat form when offline event is triggered', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    let goOffline;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    genesysService.subscribeToGenesysOffline.mockImplementation((onOffline) => {
      goOffline = onOffline;
    });

    renderGenesysChatComponent();

    act(() => {
      goOffline();
    });

    expect(screen.getByRole('log')).toBeInTheDocument();

    const offlineBanner = screen.getByText(/You are currently offline/i);
    expect(offlineBanner).toBeInTheDocument();
    expect(offlineBanner).toHaveTextContent('You are currently offline. Messages cannot be sent until reconnected to the internet.');

    await waitFor(() => {
      expect(screen.getByTestId('send-message-button')).toBeDisabled();
      expect(screen.getByTestId('end-chat-button')).toBeDisabled();
      expect(screen.getByTestId('message-input')).toBeDisabled();
    });
  });

  test('renders reconnected banner when reconnect event is triggered', async () => {
    jest.useFakeTimers();
    
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    genesysService.subscribeToGenesysReconnected.mockImplementation((onReconnected) => {
      onReconnected();
    });

    renderGenesysChatComponent();

    act(() => {
      jest.advanceTimersByTime(10); // match the delay in the reconnected handler
    });

    expect(screen.getByRole('log')).toBeInTheDocument();

    const reconnectedBanner = screen.getByText(/You are now online/i);
    expect(reconnectedBanner).toBeInTheDocument();
    expect(reconnectedBanner).toHaveTextContent('You are now online. Messages can now be sent.');
  });
});

describe('Genesys Chat Component error handling', () => {

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  test('handles an error being returned from Genesys and displays correct content', async () => {
    genesysService.subscribeToErrors.mockImplementation((onError) => {
      onError();
    });

    renderGenesysChatComponent();

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('An error has occurred');
  });

  test('handles an error being returned from Genesys initialisation and displays correct content', async () => {
    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady, onError) => {
      onGenesysReady();
      onError();
    });

    renderGenesysChatComponent();

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('An error has occurred');
  });

  test('renders error component if fetch history throws an error', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};

    let errorCallback;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([]);
    });

    genesysService.subscribeToSessionRestored.mockImplementation((onSessionRestored) => {
      onSessionRestored(largeSetRestoredMessages);
    });

    genesysService.subscribeToGenesysOldMessages.mockImplementation((onFetchHistory, onHistoryComplete) => {
      onFetchHistoryCallback = onFetchHistory;
      onHistoryCompleteCallback = onHistoryComplete;
    });

    genesysService.fetchMessageHistory.mockImplementation((onError) => {
      errorCallback = onError;
    });

    renderGenesysChatComponent();

    const loadMoreMessagesButton = screen.getByRole('button', { name: /Load more messages/i });
    expect(loadMoreMessagesButton).toBeInTheDocument();
    expect(loadMoreMessagesButton).toHaveTextContent('Load more messages');

    const user = userEvent.setup();
    await user.click(loadMoreMessagesButton);

    // Simulate error callback being triggered by the Genesys SDK
    act(() => {
      errorCallback();
    });

    // Error component should be rendered
    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('An error has occurred');
    });
  });
});

describe('Enable and disable Visibilty to structured message', () => {
  test('handles visibilty to true for previous messages', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};
    let previousMessage;
    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });


    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([incomingMessage[0]]);
      previousMessage = setPreviousStructureHideTrue(withStructuredMessages);
    });

    renderGenesysChatComponent();

    expect(previousMessage[2].content.hideContent).toBe(true);
  });

  test('handles not to set visibilty to content', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};
    let previousMessage;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([incomingMessage[0]]);
      previousMessage = setPreviousStructureHideTrue(largeSetRestoredMessages);
    });

    renderGenesysChatComponent();

    for (let count = 0; count >= previousMessage.length; count++) {
      expect(previousMessage[count].content).toBeUndefined();
    };
  });

  test('handles the last index for structured message ', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};
    let previousMessage;
    let lastIndex;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([incomingMessage[0]]);
      previousMessage = setPreviousStructureHideTrue(withStructuredMessages);
      lastIndex = getStructureMessageIndex(previousMessage);
    });

    renderGenesysChatComponent();

    expect(lastIndex).toBe(2);
  });

  it('return -1 as the last index for structured message ', async () => {
    // Mock the Genesys window object 
    globalThis.Genesys = {};
    let previousMessage;
    let lastIndex;

    genesysService.initialiseGenesysConversation.mockImplementation((onGenesysReady) => {
      onGenesysReady();
    });

    genesysService.subscribeToGenesysMessages.mockImplementation((onMessagesReceived) => {
      onMessagesReceived([incomingMessage[0]]);
      previousMessage = setPreviousStructureHideTrue(largeSetRestoredMessages);
      lastIndex = getStructureMessageIndex(previousMessage);
    });

    renderGenesysChatComponent();

    expect(lastIndex).toBe(-1);
  });
});
