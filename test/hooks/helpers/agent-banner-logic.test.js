import {
  shouldShowAgentConnectedBanner,
  resetAgentBannerState,
} from '../../../src/hooks/helpers/agent-banner-logic';

describe('agent-banner-logic', () => {
  let ref;

  beforeEach(() => {
    // Fresh ref for every test
    ref = { current: false };
  });

  describe('shouldShowAgentConnectedBanner', () => {
    test('returns true when banner has not been shown', () => {
      expect(shouldShowAgentConnectedBanner(ref)).toBe(true);
    });

    test('returns false when banner has already been shown', () => {
      ref.current = true;
      expect(shouldShowAgentConnectedBanner(ref)).toBe(false);
    });

    test('does not mutate the ref itself', () => {
      shouldShowAgentConnectedBanner(ref);
      // should NOT change ref.current
      expect(ref.current).toBe(false);
    });
  });

  describe('resetAgentBannerState', () => {
    test('resets the ref to false when previously true', () => {
      ref.current = true;
      resetAgentBannerState(ref);
      expect(ref.current).toBe(false);
    });

    test('keeps ref as false when already false', () => {
      ref.current = false;
      resetAgentBannerState(ref);
      expect(ref.current).toBe(false);
    });
  });

  describe('integration-like behavior', () => {
    test('initial state → show banner, after setting → do not show banner', () => {
      // First check → should show
      expect(shouldShowAgentConnectedBanner(ref)).toBe(true);

      // Simulate hook marking banner as shown
      ref.current = true;

      // Next check → should NOT show
      expect(shouldShowAgentConnectedBanner(ref)).toBe(false);
    });

    test('after reset → banner can show again', () => {
      // First marked as shown
      ref.current = true;

      resetAgentBannerState(ref);

      expect(shouldShowAgentConnectedBanner(ref)).toBe(true);
    });
  });
});
