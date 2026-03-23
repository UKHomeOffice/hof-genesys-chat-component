/**
 * Conversation storage utilities
 */

const CONVERSATION_ID_KEY = '__genesys_conversation_id__';

export function getConversationId() {
  return sessionStorage.getItem(CONVERSATION_ID_KEY);
}

export function setConversationId(id) {
  sessionStorage.setItem(CONVERSATION_ID_KEY, id);
}

export function removeConversationId() {
  sessionStorage.removeItem(CONVERSATION_ID_KEY);
}
