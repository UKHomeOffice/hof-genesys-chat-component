import { useCallback } from 'react';
import { genesysService } from '../../services/genesys-service';
import { hideQuickReplyMessageAtIndex } from '../../utils/quick-replies';

/**
 * Custom hook for handling sending messages to Genesys. 
 * 
 * @param {string} userInput - the user input message
 * @param {function} setUserInput - the function callback to set the user input state
 * @param {integer} lastQuickReplyMessageIndex - the array index of the last quick reply message
 * @param {function} setMessages - the function callback to set messages state
 * @param {function} setIsErrorState - the function callback to update whether an error has occurred 
 * @returns 
 */
export function useSendMessage({
  userInput,
  setUserInput,
  lastQuickReplyMessageIndex,
  setMessages,
  setIsErrorState,
  hasUserSentMessageSinceLastHistoryCompleteRef,
}) {
  const sendToGenesys = useCallback(() => {
    genesysService.sendMessageToGenesys(
      userInput,
      () => setIsErrorState(true)
    );
  }, [userInput, setIsErrorState]);

  /**
   * Shared handler for message submission.
   * Handles case where user has either clicked on, or typed response to quick reply
   * and the system needs to then hide that button and replace with textual representation.
   */
  const submitMessage = useCallback(() => {
    if (!userInput) {
      return;
    }

    if (hasUserSentMessageSinceLastHistoryCompleteRef) {
      hasUserSentMessageSinceLastHistoryCompleteRef.current = true;
    }

    sendToGenesys();

    /*
     * If lastQuickReplyMessageIndex is not -1, we need to hide the quick reply button.
     * This covers the cases where a user clicks a quick reply option button or types a response,
     * we then hide the buttons and show the user input as a message in chat.
     */ 
    if (lastQuickReplyMessageIndex !== -1) {
      setMessages(prev =>
        hideQuickReplyMessageAtIndex(lastQuickReplyMessageIndex, prev, true)
      );
    }

    setUserInput('');
  }, [
    hasUserSentMessageSinceLastHistoryCompleteRef,
    userInput,
    lastQuickReplyMessageIndex,
    sendToGenesys,
    setMessages,
    setUserInput
  ]);

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
