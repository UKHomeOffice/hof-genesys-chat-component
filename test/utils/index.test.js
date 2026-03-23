import {
  formatDate,
  stringsAreEqualIgnoringCase,
  isConnectedToAgent,
  getCurrentAgentName
} from '../../src/utils'; // adjust path as needed

describe('formatDate', () => {
  test('formats a date to HH:MM (UK 24-hour format)', () => {
    // 14:05 UK time
    const date = new Date('2020-01-01T14:05:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('14:05');
  });

  test('handles string input and formats correctly', () => {
    const formatted = formatDate('2020-01-01T08:09:00Z');
    expect(formatted).toBe('08:09');
  });

  test('handles invalid date gracefully (results in "Invalid Date")', () => {
      const formatted = formatDate('not-a-date');
      expect(formatted).toBe('Invalid Date');
  });
});

describe('stringsAreEqualIgnoringCase', () => {
  test('returns true for equal strings with different casing', () => {
    expect(stringsAreEqualIgnoringCase('Hello', 'hello')).toBe(true);
  });

  test('returns false for different strings', () => {
    expect(stringsAreEqualIgnoringCase('Hello', 'world')).toBe(false);
  });

  test('handles mixed case and spacing', () => {
    expect(stringsAreEqualIgnoringCase('TeSt', 'tEsT')).toBe(true);
  });
});

describe('isConnectedToAgent', () => {
  test('returns true when direction is Outbound and nickname exists', () => {
    const msg = {
      direction: 'Outbound',
      channel: { from: { nickname: 'Agent Smith' } }
    };
    expect(isConnectedToAgent(msg)).toBe('Agent Smith');
  });

  test('returns false when direction is not Outbound', () => {
    const msg = {
      direction: 'Inbound',
      channel: { from: { nickname: 'Agent' } }
    };
    expect(isConnectedToAgent(msg)).toBe(false);
  });

  test('returns false when nickname is missing', () => {
    const msg = {
      direction: 'Outbound',
      channel: { from: {} }
    };
    expect(isConnectedToAgent(msg)).toBe(undefined);
  });

  test('returns false when message is undefined', () => {
    expect(isConnectedToAgent(undefined)).toBe(false);
  });
});

describe('getCurrentAgentName', () => {
  test('returns nickname when connected to agent', () => {
    const msg = {
      direction: 'Outbound',
      channel: { from: { nickname: 'Agent Smith' } }
    };
    expect(getCurrentAgentName(msg)).toBe('Agent Smith');
  });

  test('returns undefined when not connected to agent', () => {
    const msg = {
      direction: 'Inbound',
      channel: { from: { nickname: 'Agent' } }
    };
    expect(getCurrentAgentName(msg)).toBeUndefined();
  });

  test('returns undefined if message missing nickname', () => {
    const msg = {
      direction: 'Outbound',
      channel: { from: {} }
    };
    expect(getCurrentAgentName(msg)).toBeUndefined();
  });

  test('returns undefined if message is null', () => {
    expect(getCurrentAgentName(null)).toBeUndefined();
  });
});
