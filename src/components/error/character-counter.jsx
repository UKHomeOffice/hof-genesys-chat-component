import { getCharacterCount, isTextOffset } from '../../utils/text-counter';

export default function CharacterCounter({ maxCharacterLimit, textLength }) {
  const offSetText = getCharacterCount(maxCharacterLimit, textLength);
  const remainText = getCharacterCount(textLength, maxCharacterLimit);
  const isMaxLength = isTextOffset(offSetText);

  return (
    <div className={`${isMaxLength ? 'max-length-message' : null}`}
      role="article"
      aria-label="Character counter"
      data-testid="character-counter">
      {
        isMaxLength &&
        <p className='govuk-body'>
          {offSetText} characters over
        </p>
      }
      {
        (remainText <= 200 && !isMaxLength) &&
        <p className='govuk-body'>
          {remainText} characters left
        </p>
      }
    </div >
  );
};
