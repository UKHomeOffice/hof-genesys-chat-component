import { renderHook } from '@testing-library/react';
import { useGenesysInitialization } from '../../src/hooks/use-genesys-initialisation';

jest.mock('../../src/services/genesys-service', () => ({
  genesysService: {
    loadGenesysScript: jest.fn(),
    initialiseGenesysConversation: jest.fn(),
  },
}));

jest.mock('react-router', () => ({
  useNavigationType: jest.fn(),
}));

import { genesysService } from '../../src/services/genesys-service';
import { useNavigationType } from 'react-router';

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
    globalThis.Genesys = {}; // Simulate SDK already loaded
    useNavigationType.mockReturnValue('PUSH');

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(params.setGenesysIsReady).toHaveBeenCalledWith(true);
    expect(genesysService.loadGenesysScript).not.toHaveBeenCalled();
  });

  test('loads Genesys script when globalThis.Genesys is missing', () => {
    useNavigationType.mockReturnValue('PUSH');

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
    useNavigationType.mockReturnValue('PUSH');

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalledWith(
      expect.any(Function),  // success cb
      expect.any(Function),  // error cb
      'LOCAL_KEY'
    );
  });

  test('initialises Genesys conversation when navigationType is POP (even if Genesys missing)', () => {
    useNavigationType.mockReturnValue('POP'); // Force POP navigation
    delete globalThis.Genesys;

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalled();
  });

  test('success callback of initialiseGenesysConversation triggers setGenesysIsReady', () => {
    globalThis.Genesys = {};
    useNavigationType.mockReturnValue('PUSH');

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    // Extract success callback
    const successCb = genesysService.initialiseGenesysConversation.mock.calls[0][0];

    successCb(); // Simulate successful init

    expect(params.setGenesysIsReady).toHaveBeenCalledWith(true);
  });

  test('error callback of initialiseGenesysConversation triggers setIsErrorState', () => {
    globalThis.Genesys = {};
    useNavigationType.mockReturnValue('PUSH');

    const params = baseParams();
    renderHook(() => useGenesysInitialization(params));

    // Extract error callback
    const errorCb = genesysService.initialiseGenesysConversation.mock.calls[0][1];

    errorCb(); // Simulate error

    expect(params.setIsErrorState).toHaveBeenCalledWith(true);
  });

  test('initial script loading effect is triggered only by deploymentId / setGenesysIsReady', () => {
    globalThis.Genesys = {}; // Prevent script load
    useNavigationType.mockReturnValue('PUSH');

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

  test('initialiseGenesysConversation effect depends on navigationType & localStorageKey', () => {
    globalThis.Genesys = {};
    useNavigationType.mockReturnValue('PUSH');

    const params = baseParams();
    const { rerender } = renderHook(() =>
      useGenesysInitialization(params)
    );

    jest.clearAllMocks();

    // Change navigationType to trigger second effect re-run
    useNavigationType.mockReturnValue('POP');

    rerender();

    expect(genesysService.initialiseGenesysConversation).toHaveBeenCalled();
  });
});
