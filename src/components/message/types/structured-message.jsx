import { useState } from 'react';

export default function StructuredMessage({ contents, handleQuickReply }) {
  const [hidden, setHidden] = useState(false);

  const handleKeyDown = (event, content) => {
    if (event.key === 'Enter') {
      handleQuickReply(event,
        content.quickReply.text ||
        content.quickReply.payload);
      setHidden(true);
    }
  };

  if (!hidden) {
    return (
      <div className={'govuk-button-group select-question'}>
        {
          contents.map((content, index) => (
            <button key={index}
              className='govuk-button message-button'
              onClick={(event) => {
                handleQuickReply(event,
                  content.quickReply.text ||
                  content.quickReply.payload);
                setHidden(true);
              }}
              onKeyDown={(event) => handleKeyDown(event, content)}>
              {content.quickReply.text}
            </button>
          ))
        }
      </div>
    );
  }
}
