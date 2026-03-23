import {
  getConversationId,
  removeConversationId
} from '../conversation/conversation-storage';

/**
 * Genesys Service class for managing chat interactions
 */
export class GenesysService {
  isInitialized = false;
  logger = () => { }; // default to no-op, can be set to a custom logger if needed
  debugMode = false; // flag to enable debug mode for additional logging

  /**
   * Set the logger function on the service instance
   * @param {Function} callback function to log data
   */
  setLogger(callback) {
    if (typeof callback === 'function') {
      this.logger = callback;
    }
  }

  /**
   * Set debug mode for the service, which can is used to set the debug flag in the Genesys SDK configuration.
   * @param {boolean} debugMode - value to set debugMode for Genesys SDK
   */
  setDebugMode(debugMode) {
    this.debugMode = debugMode;
  }

  /**
   * Reusable logging function for the service
   * @param {string} level log-level to set the log at
   * @param {string} message message to log out
   * @param {Object} metadata metadata obejct to provide additional context to the log (optional)
   */
  log(level, message, metadata = {}) {
    this.logger({ level, message, metadata });
  }

  /**
   * Before the service can interact with Genesys, it must be initialized.
   * This function loads the Genesys script and sets up the environment.
   * @param {string} environment - The Genesys environment (e.g., 'mypurecloud.com')
   * @param {string} deploymentId - The deployment ID for your Genesys instance
   */
  loadGenesysScript(environment, deploymentId) {
    globalThis._genesysJs = 'Genesys';
    globalThis.Genesys = globalThis.Genesys || function () {
      (globalThis.Genesys.q = globalThis.Genesys.q || []).push(arguments);
    };
    globalThis.Genesys.t = 1 * new Date();
    globalThis.Genesys.c = {
      environment: environment,
      deploymentId: deploymentId,
      debug: this.debugMode
    };

    const script = document.createElement('script');
    script.src = 'https://apps.euw2.pure.cloud/genesys-bootstrap/genesys.min.js';
    script.async = true;
    script.charset = 'utf-8';
    script.id = 'genesys-sdk-script';
    document.head.appendChild(script);

    this.log('info', 'Genesys script executed and SDK loaded successfully', { conversationId: getConversationId() });
  }

  /* eslint-disable max-len */
  /**
   * This function initializes the Genesys conversation, by subscribing to a series of core
   * events output from Genesys. The ordering is important for a chat to become active; 
   * 1. Subscribe to the ready event (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-ready)
   * 2. Subscribe to the startConversation event (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-startconversation)
   * 3. Register for any session clearing events (sessionCleared, conversationReset, conversationCleared)
   * Once the conversation is started, all other Genesys events and commands can be used.
   * @param {Function} onGenesysReady - Callback when SDK is ready
   * @param {Function} onError - Callback on initialization error
   * @param {string} localStorageKey - Key for session storage
   */
  /* eslint-enable max-len */
  initialiseGenesysConversation(onGenesysReady, onError, localStorageKey) {
    if (this.isInitialized || !globalThis.Genesys) {
      /**
       * Check for an active session in local storage, if not found start a new conversation.
       * This covers the specific scenario where a user ends the chat, but then clicks the browser
       * back button instead of the link to start a new chat. In this case, the Genesys SDK is already and initialised,
       * but no conversation exists, so we need to start a new one to avoid an issue if the user ends the chat again.
       */
      const activeSessionExists = localStorage.getItem(localStorageKey);
      if (activeSessionExists) {
        return;
      }
      this.startConversation(localStorageKey, onError, onGenesysReady);
      return;
    }
    this.isInitialized = true;

    globalThis.Genesys('subscribe', 'MessagingService.ready', () => {
      this.log('info', 'Genesys SDK configured and ready', { conversationId: getConversationId() });

      const activeSessionExists = localStorage.getItem(localStorageKey);
      if (activeSessionExists) {
        onGenesysReady();
      } else {
        this.startConversation(localStorageKey, onError, onGenesysReady);
      }

      this.registerForSessionClearingEvents(localStorageKey);
    });
  }

  /**
   * Start a new conversation
   * @param {string} localStorageKey - Key for session storage
   * @param {Function} onError - Error callback
   * @param {Function} onGenesysReady - Ready callback
   */
  startConversation(localStorageKey, onError, onGenesysReady) {
    globalThis.Genesys('command', 'MessagingService.startConversation',
      () => {
        this.log('info', 'Conversation started successfully', { conversationId: getConversationId() });
        localStorage.setItem(localStorageKey, 'true');
        onGenesysReady();
      },
      () => {
        this.log('error', 'Error trying to start conversation', { conversationId: getConversationId() });
        onError();
      }
    );
  }

  /**
   * Send a message to Genesys
   * @param {string} message - The message to send
   * @param {Function} onError - Error callback
   */
  sendMessageToGenesys(message, onError) {
    globalThis.Genesys('command', 'MessagingService.sendMessage', {
      message: message
    },
    () => {
      this.log('debug', 'Message sent successfully', { conversationId: getConversationId() });
    },
    () => {
      this.log('error', 'sendMessage call rejected', { conversationId: getConversationId() });
      onError();
    });
  }

  /**
   * Fetch message history
   * @param {Function} onError - Error callback
   */
  fetchMessageHistory(onError) {
    globalThis.Genesys('command', 'MessagingService.fetchHistory',
      () => {
        this.log('debug', 'Message history successfully fetched', { conversationId: getConversationId() });
      },
      () => {
        this.log('error', 'Failed to fetch message history', { conversationId: getConversationId() });
        onError();
      }
    );
  }

  /* eslint-disable max-len */
  /**
   * Subscribe to the Genesys messagesReceived event: 
   * https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-messagesreceived
   * @param {onMessagesReceived} onMessagesReceived callback to handle incoming messages
   */
  /* eslint-enable max-len */
  subscribeToGenesysMessages(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.messagesReceived', ({ data }) => {
      console.log(data.messages);
      callback(data.messages);
    });
  }

  /* eslint-disable max-len */
  /**
   * Subscribe to the Genesys oldMessages and historyComplete events:
   * - https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-oldmessages
   * - https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-historycomplete
   * @param {onFetchHistory} onFetchHistory callback to handle incoming historical messages
   * @param {onHistoryComplete} onHistoryComplete callback to handle history fetch completion
   */
  /* eslint-enable max-len */
  subscribeToGenesysOldMessages(callback, onAllHistoryFetched) {
    globalThis.Genesys('subscribe', 'MessagingService.oldMessages', ({ data }) => {
      callback(data);
    });

    globalThis.Genesys('subscribe', 'MessagingService.historyComplete', () => {
      this.log('debug', 'All history fetched successfully', { conversationId: getConversationId() });
      onAllHistoryFetched();
    });
  }

  /* eslint-disable max-len */
  /**
   * Subscribe to the Genesys session restored event to get the latest 25 messages from the active conversation:
   * https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-restored
   * @param {onSessionRestored} onSessionRestored callback to handle restoring recent session messages
   */
  /* eslint-enable max-len */
  subscribeToSessionRestored(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.restored', ({ data }) => {
      this.log(
        'info', 'Session restored successfully for active conversation', 
        { conversationId: getConversationId() }
      );
      callback(data);
    });
  }

  /* eslint-disable max-len */
  /**
   * Subscribe to the Genesys reconnected event:
   * Published when WebSocket connection is back after previous reconnecting attempt.
   * MessagingService.reconnected: (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-reconnected)
   * @param {onReconnected} callback to handle reconnected state
   */
  subscribeToGenesysReconnected(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.reconnected', () => {
      this.log('info', 'Genesys connection re-established (reconnected)', { conversationId: getConversationId() });
      callback();
    });
  }

  /* eslint-disable max-len */
  /**
   * Subscribe to the Genesys offline event:
   * Published when connection goes offline due to no connectivity.
   * MessagingService.offline: (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-offline)
   * @param {onOffline} callback to handle offline state
   */
  subscribeToGenesysOffline(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.offline', () => {
      this.log('info', 'Genesys connection lost (offline)', { conversationId: getConversationId() });
      callback();
    });
  }

  /**
   * Subscribe to errors
   * @param {Function} callback - Callback for errors
   */
  subscribeToErrors(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.error', ({ data }) => {
      this.log('error', `Genesys error reported: ${JSON.stringify(data)}`, { conversationId: getConversationId() });
      callback(data);
    });
  }

  /**
   * Subscribe to agent typing
   * @param {Function} callback - Callback for agent typing
   */
  subscribeAgentTyping(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.typingReceived', callback);
  }

  /**
   * Unsubscribe from agent typing
   * @param {Function} callback - Callback to remove
   */
  unSubscribeAgentTyping(callback) {
    globalThis.Genesys('subscribe', 'MessagingService.typingTimeout', callback);
  }

  /* eslint-disable max-len */
  /**
   * Clear the conversation in Genesys to clear this conversation session.
   * This will clear all existing messages on the Genesys end: https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-clearconversation
   * @param {localStorageKey} the key of the local storage item to remove to indicate no active session
   */
  /* eslint-enable max-len */
  clearConversation(localStorageKey) {
    this.removeActiveSessionFromLocalStorage(localStorageKey);
    globalThis.Genesys('command', 'MessagingService.clearConversation',
      () => { },
      () => {
        this.log('error', 'Error clearing conversation', { conversationId: getConversationId() });
      }
    );
  }

  /* eslint-disable max-len */
  /**
   * Register for Genesys events that indicate the current session has been cleared or reset.
   * 1. MessagingService.sessionCleared (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-sessioncleared)
   * 2. MessagingService.conversationReset (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-conversationreset)
   * 3. MessagingService.conversationCleared (https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/SDKCommandsEvents/messagingServicePlugin#messagingservice-conversationcleared)
   * 
   * The aim here is that if the Genesys session has been cleared in any way, we also remove the custom local storage
   * key we use to track if there is an active session. This ensures that if the user continues to interact with the chat
   * after a session clear, a new conversation will be started.
   * @param {string} localStorageKey the local storage key used to access the active session
   */
  /* eslint-enable max-len */
  registerForSessionClearingEvents(localStorageKey) {
    globalThis.Genesys('subscribe', 'MessagingService.sessionCleared', () => {
      this.log('debug', 'Session cleared', { conversationId: getConversationId() });
      this.removeActiveSessionFromLocalStorage(localStorageKey);
    });

    globalThis.Genesys('subscribe', 'MessagingService.conversationReset', () => {
      this.log('debug', 'Conversation reset', { conversationId: getConversationId() });
      this.removeActiveSessionFromLocalStorage(localStorageKey);
    });

    globalThis.Genesys('subscribe', 'MessagingService.conversationCleared', () => {
      this.log('debug', 'Conversation cleared', { conversationId: getConversationId() });
      this.removeActiveSessionFromLocalStorage(localStorageKey);
    });
  }

  /**
   * Remove active session from local storage
   * @param {string} localStorageKey - Key for session storage
   */
  removeActiveSessionFromLocalStorage(localStorageKey) {
    this.log('debug', `Clearing session key for service ${localStorageKey}`, { localStorageKey });
    localStorage.removeItem(localStorageKey);
    removeConversationId();
  }
}

// Export a singleton instance
export const genesysService = new GenesysService();
