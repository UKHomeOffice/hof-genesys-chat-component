/* eslint-disable import/no-unresolved */
import { v4 as uuidv4 } from 'uuid';

/**
 * Get or create a unique conversation ID for the session.
 * This ID is stored in sessionStorage to persist across page reloads
 * but will be unique for each new session.
 * @returns {string} conversationId - unique conversation identifier
 */
let conversationId = sessionStorage.getItem('conversationId');
if (!conversationId) {
  conversationId = uuidv4();
  sessionStorage.setItem('conversationId', conversationId);
}

export const getConversationId = () => conversationId;

export function removeConversationId() {
  sessionStorage.removeItem('conversationId');
}
