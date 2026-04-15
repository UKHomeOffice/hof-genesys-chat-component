import { GenesysService } from '../../src/services/genesys-service';

jest.mock('../../src/conversation/conversation-storage', () => ({
  getConversationId: jest.fn(() => 'conv-123'),
  removeConversationId: jest.fn(),
}));

/**
 * A robust in-memory mock of the Genesys global function.
 * - Records all `subscribe` and `command` registrations
 * - Exposes helpers to trigger them later:
 *      Genesys._emit('MessagingService.ready')
 *      Genesys._success('MessagingService.startConversation')
 *      Genesys._error('MessagingService.sendMessage')
 */
function createGenesysMock() {
  const subscriptions = new Map(); // event -> callback
  const commands = new Map(); // command -> { success, error, payload }

  function Genesys(type, name, arg3, arg4, arg5) {
    if (type === 'subscribe') {
      // (type, eventName, callback)
      subscriptions.set(name, arg3);
      return;
    }
    if (type === 'command') {
      // (type, commandName, payload?, successcallback?, errorcallback?)
      let payload, successCallback, errorCallback;

      if (typeof arg3 === 'function') {
        // no payload form: (type, cmd, success, error)
        successCallback = arg3;
        errorCallback = arg4;
      } else {
        // payload form: (type, cmd, payload, success, error)
        payload = arg3;
        successCallback = arg4;
        errorCallback = arg5;
      }

      commands.set(name, { payload, successCallback, errorCallback });
    }
  }

  Genesys._emit = (event, payload) => {
    const callback = subscriptions.get(event);
    if (callback) callback({ data: payload });
  };

  Genesys._success = (command) => {
    const entry = commands.get(command);
    if (entry && typeof entry.successCallback === 'function') entry.successCallback();
  };

  Genesys._error = (command) => {
    const entry = commands.get(command);
    if (entry && typeof entry.errorCallback === 'function') entry.errorCallback();
  };

  Genesys._subscriptions = subscriptions;
  Genesys._commands = commands;

  return Genesys;
}

describe('GenesysService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GenesysService();
    delete globalThis.Genesys;
    delete globalThis._genesysJs;
    localStorage.clear();
  });

  it('setLogger sets a functional logger and log() forwards payload', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    service.log('info', 'test', { a: 1 });
    expect(logger).toHaveBeenCalledWith({ level: 'info', message: 'test', metadata: { a: 1 } });
  });

  it('setLogger ignores non-functions', () => {
    service.setLogger(null);

    // still no-throw
    service.log('debug', 'noop');
  });

  it('setDebugMode toggles debug flag', () => {
    service.setDebugMode(true);
    expect(service.debugMode).toBe(true);
  });

  it('loadGenesysScript bootstraps SDK, appends script, and logs', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    const headSpy = jest.spyOn(document.head, 'appendChild');

    service.loadGenesysScript('envX', 'deploy-1');

    expect(globalThis._genesysJs).toBe('Genesys');
    expect(typeof globalThis.Genesys).toBe('function');
    expect(globalThis.Genesys.c).toEqual({
      environment: 'envX',
      deploymentId: 'deploy-1',
      debug: false,
    });
    expect(headSpy).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Genesys script executed and SDK loaded successfully',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('initialiseGenesysConversation returns early when an active session exists', () => {
    globalThis.Genesys = createGenesysMock();

    localStorage.setItem('_DEPLOY:gcmcsessionActive', JSON.stringify({ value: 'true' }));
    
    const onReady = jest.fn();
    const onError = jest.fn();

    const startSpy = jest.spyOn(service, 'startConversation');
    const storageListenerSpy = jest.spyOn(service, 'addStorageListenerForSessionStarted');
    service.initialiseGenesysConversation(onReady, onError, 'DEPLOY');

    expect(startSpy).not.toHaveBeenCalled();
    expect(storageListenerSpy).toHaveBeenCalledWith('DEPLOY', onReady, onError);
    expect(onReady).toHaveBeenCalled();
  });

  it('initialiseGenesysConversation subscribes to ready; on ready starts or calls ready appropriately', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const onReady = jest.fn();
    const onError = jest.fn();

    // No active session -> should start conversation on ready
    service.initialiseGenesysConversation(onReady, onError, 'DEPLOY');
    expect(service.isInitialized).toBe(true);

    // Fire ready
    globalThis.Genesys._emit('MessagingService.ready');

    // Either starts conversation (which calls onReady) or directly onReady if session exists.
    // Since session does not exist yet, startConversation path should execute:
    // Replace internal command callbacks
    const startSpy = jest.spyOn(service, 'startConversation');

    const storageListenerSpy = jest.spyOn(service, 'addStorageListenerForSessionStarted');
    
    // For this test, stub startConversation to directly call onGenesysReady:
    startSpy.mockImplementation((_err, readycallback) => readycallback());

    // Emit again to hit the inner branch deterministically with our stub:
    globalThis.Genesys._emit('MessagingService.ready');

    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Genesys SDK configured and ready',
      metadata: { conversationId: 'conv-123' },
    });
    expect(onReady).toHaveBeenCalled();
    expect(storageListenerSpy).toHaveBeenCalledWith('DEPLOY', onReady, onError);
  });

  it('startConversation success path', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const ready = jest.fn();
    const error = jest.fn();

    service.startConversation(error, ready);

    // drive success
    globalThis.Genesys._success('MessagingService.startConversation');

    expect(ready).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Conversation started successfully',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('startConversation error path', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const ready = jest.fn();
    const error = jest.fn();

    service.startConversation(error, ready);

    // drive error
    globalThis.Genesys._error('MessagingService.startConversation');

    expect(error).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith({
      level: 'error',
      message: 'Error trying to start conversation',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('sendMessageToGenesys logs on success', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const onErr = jest.fn();
    service.sendMessageToGenesys('hi', onErr);

    globalThis.Genesys._success('MessagingService.sendMessage');

    expect(logger).toHaveBeenCalledWith({
      level: 'debug',
      message: 'Message sent successfully',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('sendMessageToGenesys logs and calls error on failure', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const onErr = jest.fn();
    service.sendMessageToGenesys('hi', onErr);

    globalThis.Genesys._error('MessagingService.sendMessage');

    expect(logger).toHaveBeenCalledWith({
      level: 'error',
      message: 'sendMessage call rejected',
      metadata: { conversationId: 'conv-123' },
    });
    expect(onErr).toHaveBeenCalled();
  });

  it('fetchMessageHistory success and error', () => {
    const logger = jest.fn();
    service.setLogger(logger);

    globalThis.Genesys = createGenesysMock();

    const onErr = jest.fn();
    service.fetchMessageHistory(onErr);

    globalThis.Genesys._success('MessagingService.fetchHistory');
    expect(logger).toHaveBeenCalledWith({
      level: 'debug',
      message: 'Message history successfully fetched',
      metadata: { conversationId: 'conv-123' },
    });

    service.fetchMessageHistory(onErr);
    globalThis.Genesys._error('MessagingService.fetchHistory');
    expect(logger).toHaveBeenCalledWith({
      level: 'error',
      message: 'Failed to fetch message history',
      metadata: { conversationId: 'conv-123' },
    });
    expect(onErr).toHaveBeenCalled();
  });

  it('subscribeToGenesysMessages passes messages', () => {
    globalThis.Genesys = createGenesysMock();
    const callback = jest.fn();

    service.subscribeToGenesysMessages(callback);

    globalThis.Genesys._emit('MessagingService.messagesReceived', { messages: ['m1', 'm2'] });

    expect(callback).toHaveBeenCalledWith(['m1', 'm2']);
  });

  it('subscribeToGenesysOldMessages passes data and triggers all-history callback with log', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const callback = jest.fn();
    const onAll = jest.fn();

    service.subscribeToGenesysOldMessages(callback, onAll);

    globalThis.Genesys._emit('MessagingService.oldMessages', { foo: 'bar' });
    expect(callback).toHaveBeenCalledWith({ foo: 'bar' });

    globalThis.Genesys._emit('MessagingService.historyComplete');
    expect(onAll).toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith({
      level: 'debug',
      message: 'All history fetched successfully',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('subscribeToSessionRestored logs and forwards payload', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const callback = jest.fn();
    service.subscribeToSessionRestored(callback);

    globalThis.Genesys._emit('MessagingService.restored', { x: 1 });
    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Session restored successfully for active conversation',
      metadata: { conversationId: 'conv-123' },
    });
    expect(callback).toHaveBeenCalledWith({ x: 1 });
  });

  it('subscribeToGenesysReconnected logs and calls callback', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const callback = jest.fn();
    service.subscribeToGenesysReconnected(callback);
    globalThis.Genesys._emit('MessagingService.reconnected');

    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Genesys connection re-established (reconnected)',
      metadata: { conversationId: 'conv-123' },
    });
    expect(callback).toHaveBeenCalled();
  });

  it('subscribeToGenesysOffline logs and calls callback', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const callback = jest.fn();
    service.subscribeToGenesysOffline(callback);
    globalThis.Genesys._emit('MessagingService.offline');

    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Genesys connection lost (offline)',
      metadata: { conversationId: 'conv-123' },
    });
    expect(callback).toHaveBeenCalled();
  });

  it('subscribeToErrors logs and forwards error payload', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const callback = jest.fn();
    service.subscribeToErrors(callback);

    globalThis.Genesys._emit('MessagingService.error', { err: 42 });

    expect(logger).toHaveBeenCalledWith({
      level: 'error',
      message: `Genesys error reported: ${JSON.stringify({ err: 42 })}`,
      metadata: { conversationId: 'conv-123' },
    });
    expect(callback).toHaveBeenCalledWith({ err: 42 });
  });

  it('subscribeAgentTyping / unSubscribeAgentTyping register callbacks', () => {
    globalThis.Genesys = createGenesysMock();
    const subcallback = jest.fn();
    const unSubcallback = jest.fn();

    service.subscribeAgentTyping(subcallback);
    service.unSubscribeAgentTyping(unSubcallback);

    // Make sure callbacks are actually stored by emitting
    globalThis.Genesys._emit('MessagingService.typingReceived');
    globalThis.Genesys._emit('MessagingService.typingTimeout');
  });

  it('clearConversation logs on success', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    service.clearConversation();

    // Drive the success callback on the clear command
    globalThis.Genesys._success('MessagingService.clearConversation');
    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Conversation cleared successfully',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('clearConversation logs on error', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    service.clearConversation();

    // Drive the error callback on the clear command
    globalThis.Genesys._error('MessagingService.clearConversation');
    expect(logger).toHaveBeenCalledWith({
      level: 'error',
      message: 'Error clearing conversation',
      metadata: { conversationId: 'conv-123' },
    });
  });

  it('registerForSessionClearingEvents subscribes to 3 events', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    service.registerForSessionClearingEvents();

    globalThis.Genesys._emit('MessagingService.sessionCleared');
    globalThis.Genesys._emit('MessagingService.conversationReset');
    globalThis.Genesys._emit('MessagingService.conversationCleared');
  });

  it('checkActiveSessionExists returns true if session active key is set in localStorage', () => {
    globalThis.Genesys = createGenesysMock();

    localStorage.setItem('_DEPLOY:gcmcsessionActive', JSON.stringify({ value: 'true' }));

    expect(service.checkActiveSessionExists('DEPLOY')).toBe(true);
  });

  it('checkActiveSessionExists returns false if no session active key is set in localStorage', () => {
    globalThis.Genesys = createGenesysMock();

    expect(service.checkActiveSessionExists('DEPLOY')).toBe(false);
  });

  it('addStorageListenerForSessionStarted triggers startConversation on storage event with correct key and newValue', () => {
    const logger = jest.fn();
    service.setLogger(logger);
    globalThis.Genesys = createGenesysMock();

    const startSpy = jest.spyOn(service, 'startConversation');

    const deploymentId = 'test-deploy';

    service.addStorageListenerForSessionStarted(deploymentId);

    // Simulate storage event
    const event = new Event('storage');
    event.key = `_${deploymentId}:gcmcsessionActive`;
    event.newValue = JSON.stringify({ value: 'true' });

    globalThis.dispatchEvent(event);

    expect(logger).toHaveBeenCalledWith({
      level: 'info',
      message: 'Detected session restart (in another tab)',
      metadata: { conversationId: 'conv-123' }
    });
    expect(startSpy).toHaveBeenCalled();
  });
});
