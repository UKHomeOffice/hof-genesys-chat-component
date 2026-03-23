const getCharacterCount = (maxLength, actualLength) => {
  if (actualLength > maxLength)
    return actualLength - maxLength;
  return 0;
};

const isTextOffset = (textLength) => {
  return textLength !== 0;
};

export {
  isTextOffset,
  getCharacterCount
};
