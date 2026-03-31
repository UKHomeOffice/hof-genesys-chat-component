import {
  getCharacterCount,
  isTextOffset
} from '../../src/utils/text-counter';


describe('getCharacterCount', () => {
  it('should return 0 when offset is greater than maxlength', () => {
    const expected = 0;
    const actual = getCharacterCount(4069, 3666);
    expect(actual).toBe(expected);
  });

  it('should return 1 when offset is greater than maxlength', () => {
    const expected = 1;
    const actual = getCharacterCount(4069, 4070);
    expect(actual).toBe(expected);
  });
  it('should return 0 when maxlength is equal offset', () => {
    const expected = 0;
    const actual = getCharacterCount(4069, 4069);
    expect(expected).toBe(actual);
  });
});


describe('isTextOffset', () => {

  it('should return false when offset is equal 0', () => {
    const expected = false;
    const actual = isTextOffset(0);
    expect(expected).toBe(actual);
  });

  it('should return true when offset is not equal 0', () => {
    const expected = true;
    const actual = isTextOffset(3);
    expect(expected).toBe(actual);
  });
});
