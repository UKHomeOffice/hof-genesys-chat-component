import {
  formatDate,
  stringsAreEqualIgnoringCase,
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
