import {
  hasVisibleQuickReply,
  setHideContentPropertyOnAllQuickReplies,
  getQuickReplyIndex,
  hideQuickReplyMessageAtIndex,
  hidePreviousQuickReplyMessages,
  hideHistoricalQuickReplyMessages
} from '../../src/utils/quick-replies';

const newMessage = require('../data/structured-messages.json');
const historicalMessage = require('../data/restored-messages.json');

const messages = [
  { direction: 'Inbound', type: 'Text' },
  {
    direction: 'Outbound',
    type: 'Structured',
    content: [{ contentType: 'QuickReply' }]
  },
  {
    direction: 'Outbound',
    type: 'Structured',
    content: [{ contentType: 'QuickReply' }]
  }
];

const messagesWithoutQuickReplies = [
  { direction: 'Inbound', type: 'Text' },
  {
    direction: 'Outbound',
    type: 'Structured',
    content: [{ contentType: 'Text' }]
  }
];

describe('setHideContentPropertyOnAllQuickReplies', () => {
  const newMessageOutbound = [
    {
      direction: 'Outbound',
      type: 'Structured',
    }
  ];

  it('should set hideContent = false when message is Outbound Structured with content', () => {
    const result = setHideContentPropertyOnAllQuickReplies(newMessage, false);
    expect(result[0].hideContent).toBe(false);
  });


  it('should set hideContent = true when message is Outbound Structured with content', () => {
    const result = setHideContentPropertyOnAllQuickReplies(newMessage, true);
    expect(result[0].hideContent).toBe(true);
  });

  it('should be undefined ', () => {
    const result = setHideContentPropertyOnAllQuickReplies(newMessageOutbound);
    expect(result.content).toBeUndefined();
  });
});

describe('hasVisibleQuickReply', () => {
  it('returns true when a quick reply message is visible', () => {
    expect(hasVisibleQuickReply(messages)).toBe(true);
  });

  it('returns false when quick replies are hidden', () => {
    const hiddenMessages = hidePreviousQuickReplyMessages(messages);
    expect(hasVisibleQuickReply(hiddenMessages)).toBe(false);
  });

  it('returns false when no quick reply content exists', () => {
    expect(hasVisibleQuickReply(messagesWithoutQuickReplies)).toBe(false);
  });
});

describe('getQuickReplyIndex', () => {
  it('should return the index of the last Outbound Structured message with content', () => {
    const result = getQuickReplyIndex(messages);
    expect(result).toBe(2); // last valid index
  });

  it('should return -1 if no Outbound Structured messages exist', () => {
    const result = getQuickReplyIndex(historicalMessage.messages);
    expect(result).toBe(-1);
  });

  it('should return position 2 ', () => {
    const result = getQuickReplyIndex(messages);
    expect(result).toBe(2);
  });
});


describe('hideQuickReplyMessageAtIndex', () => {
  it('should set hideContent = true at the given index', () => {
    const result = hideQuickReplyMessageAtIndex(2, messages, true);
    expect(result[2].hideContent).toBe(true);
  });
});


describe('hidePreviousQuickReplyMessages', () => {
  it('should set hideContent = true at the given index', () => {
    const result = hidePreviousQuickReplyMessages(messages);
    expect(result[2].hideContent).toBe(true);
  });

  it('should be undefined', () => {
    const result = hidePreviousQuickReplyMessages(messages);
    expect(result[0].content).toBeUndefined();
  });
});


describe('hideHistoricalQuickReplyMessages', () => {

  it('should exempt the last structure message then set remainig structured message hideContent = true ', () => {
    const result = hideHistoricalQuickReplyMessages(messages);
    expect(result[1].hideContent).toBe(true);
  });

  it('should set the last structure message hideContent = false', () => {
    const result = hideHistoricalQuickReplyMessages(messages);
    expect(result[2].hideContent).toBe(false);
  });
});
