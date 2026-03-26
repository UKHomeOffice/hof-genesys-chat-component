import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';
import { setHideContentPropertyWithIndex } from '../../utils/structured-message';

export function useSendMessage({ userInput, setUserInput, messageIndex, setMessages, setIsErrorState }) {
  const sendToGenesys = useCallback(() => {
    genesysService.sendMessageToGenesys(
      userInput,
      () => setIsErrorState(true)
    );
  }, [userInput, setIsErrorState]);

  const submitMessage = useCallback(() => {
    if (!userInput) {
      return;
    }

    sendToGenesys();

    if (messageIndex !== -1) {
      setMessages(prev =>
        setHideContentPropertyWithIndex(messageIndex, prev, true)
      );
    }

    setUserInput('');
  }, [userInput, messageIndex, sendToGenesys, setMessages, setUserInput]);

  const sendMessage = useCallback(
    (event) => {
      event.preventDefault();
      submitMessage();
    },
    [submitMessage]
  );

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitMessage();
      }
    },
    [submitMessage]
  );

  return { sendMessage, handleKeyPress, submitMessage };
}
