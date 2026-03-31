import React, { createContext, useContext } from 'react';
import { getConversationId } from './conversation-storage';

const ConversationContext = createContext();

/**
 * ConversationProvider component to provide conversation ID context.
 * This will be used to access the conversation ID for the duration
 * of an active conversation between the user and Genesys.
 * @param {ReactNode} children - react children components
 * @returns a Provider component wrapping the children
 */
export const ConversationProvider = ({ children }) => {
  const conversationId = getConversationId();

  return (
    <ConversationContext.Provider value={conversationId}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationId = () => useContext(ConversationContext);
