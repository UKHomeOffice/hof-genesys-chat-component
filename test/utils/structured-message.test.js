import {
  setHideContentProperty,
  getStructureMessageIndex,
  setHideContentPropertyWithIndex,
  setPreviousStructureHideTrue,
  setHideContentToHistoricalMessages
} from '../../src/utils/structured-message';

const newMessage = require('../data/structured-messages.json');
const historicalMessage = require('../data/restored-messages.json');

const messages = [
  { direction: 'Inbound', type: 'Text', },
  { direction: 'Outbound', type: 'Structured', content: [] },
  { direction: 'Outbound', type: 'Structured', content: [] }
];

describe('setHideContentProperty', () => {
  const newMessageOutbound = [
    {
      direction: 'Outbound',
      type: 'Structured',
    }
  ];

  it('should set hideContent = false when message is Outbound Structured with content', () => {
    const result = setHideContentProperty(newMessage, false);
    expect(result[0].content.hideContent).toBe(false);
  });


  it('should set hideContent = true when message is Outbound Structured with content', () => {
    const result = setHideContentProperty(newMessage, true);
    expect(result[0].content.hideContent).toBe(true);
  });

  it('should return the same object reference', () => {
    const result = setHideContentProperty(newMessage, false);
    expect(result).toBe(newMessage);
  });

  it('should be undefined ', () => {
    const result = setHideContentProperty(newMessageOutbound);
    expect(result.content).toBeUndefined();
  });
});

describe('getStructureMessageIndex', () => {
  it('should return the index of the last Outbound Structured message with content', () => {
    const result = getStructureMessageIndex(messages);
    expect(result).toBe(2); // last valid index
  });

  it('should return -1 if no Outbound Structured messages exist', () => {
    const result = getStructureMessageIndex(historicalMessage.messages);
    expect(result).toBe(-1);
  });

  it('should return position 2 ', () => {
    const result = getStructureMessageIndex(messages);
    expect(result).toBe(2);
  });
});


describe('setHideContentPropertyWithIndex', () => {
  it('should set hideContent = true at the given index', () => {
    const result = setHideContentPropertyWithIndex(2, messages, true);
    expect(result[2].content.hideContent).toBe(true);
  });
});


describe('setPreviousStructureHideTrue', () => {
  it('should set hideContent = true at the given index', () => {
    const result = setPreviousStructureHideTrue(messages);
    expect(result[2].content.hideContent).toBe(true);
  });

  it('should be undefined', () => {
    const result = setPreviousStructureHideTrue(messages);
    expect(result[0].content).toBeUndefined();
  });
});


describe('setHideContentToHistoricalMessages', () => {

  it('should exempt the last structure message then set remainig structured message hideContent = true ', () => {
    const result = setHideContentToHistoricalMessages(messages);
    expect(result[1].content.hideContent).toBe(true);
  });

  it('should set the last structure message hideContent = false', () => {
    const result = setHideContentToHistoricalMessages(messages);
    expect(result[2].content.hideContent).toBe(false);
  });
});
