import { renderHook } from '@testing-library/react';
import { useGenesysInitialization } from '../../src/hooks/use-genesys-initialisation';

jest.mock('../../src/services/genesys-service', () => ({
  genesysService: {
    loadGenesysScript: jest.fn(),
    initialiseGenesysConversation: jest.fn(),
  },
}));

import { genesysService } from '../../src/services/genesys-service';

describe('useGenesysInitialization', () => {
  const baseParams = () => ({
    genesysEnvironment: 'dev',
    deploymentId: 'DEPLOY_ID',
    localStorageKey: 'LOCAL_KEY',
    setGenesysIsReady: jest.fn(),
    setIsErrorState: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete globalThis.Genesys; // Force default state
  });

  test('calls setGenesysIsReady immediately when globalThis.Genesys already exists', () => {
    genesysService.initialiseGenesysConversation = jest.fn(
      (onSuccess) => onSuccess()
    );

    globalThis.Genesys = {}; // Simulate SDK already loaded    

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(params.setGenesysIsReady).toHaveBeenCalledWith(true);
    expect(genesysService.loadGenesysScript).not.toHaveBeenCalled();
  });

  test('loads Genesys script when globalThis.Genesys is missing', () => {    

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(genesysService.loadGenesysScript).toHaveBeenCalledWith(
      'dev',
      'DEPLOY_ID'
    );

    expect(params.setGenesysIsReady).not.toHaveBeenCalled();
  });

  test('initialises Genesys conversation when Genesys exists', () => {
    globalThis.Genesys = {}; // Simulate SDK ready

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalledWith(
      expect.any(Function),  // success cb
      expect.any(Function),  // error cb
      'LOCAL_KEY'
    );
  });

  test('success callback of initialiseGenesysConversation triggers setGenesysIsReady', () => {
    globalThis.Genesys = {};

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    // Extract success callback
    const successCb = genesysService.initialiseGenesysConversation.mock.calls[0][0];

    successCb(); // Simulate successful init

    expect(params.setGenesysIsReady).toHaveBeenCalledWith(true);
  });

  test('error callback of initialiseGenesysConversation triggers setIsErrorState', () => {
    globalThis.Genesys = {};

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    // Extract error callback
    const errorCb = genesysService.initialiseGenesysConversation.mock.calls[0][1];

    errorCb(); // Simulate error

    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('initial script loading effect is triggered only by deploymentId / setGenesysIsReady', () => {
    globalThis.Genesys = {}; // Prevent script load

    const params = baseParams();
    const { rerender } = renderHook(() =>
      useGenesysInitialization(params)
    );

    // Clear mock calls
    jest.clearAllMocks();

    rerender(); // No changes in dependency array

    expect(genesysService.loadGenesysScript).not.toHaveBeenCalled();
    expect(params.setGenesysIsReady).not.toHaveBeenCalled();
  });
});
