# Architecture Overview - HOF Genesys Chat Component

## Component Hierarchy Diagram

```
GenesysChatComponent
├── Initialization Layer
│   ├── useGenesysInitialization()
│   │   └── Loads SDK, initializes conversation
│   │
│   ├── useChatState()
│   │   └── Centralizes all state (messages, userInput, etc.)
│   │
│   └── useGenesysSubscriptions()
│       └── Manages event subscriptions
│
├── User Interactions
│   └── useChatActions()
│       ├── sendMessage()
│       ├── handleKeyPress()
│       ├── handleEndChat()
│       ├── handleQuickReply()
│       └── handleFetchMessageHistory()
│
├── UI Rendering
│   ├── Messages
│   │   ├── MessageMeta (timestamp, agent info)
│   │   ├── MessageText (message content)
│   │   └── Message Components
│   │       ├── InboundMessage (from agent)
│   │       ├── OutboundMessage (from user)
│   │       └── StructuredMessage (quick replies, etc.)
│   │
│   ├── TypingIndicator
│   │   └── Shown when agent typing
│   │
│   ├── ChatForm
│   │   ├── TextArea for input
│   │   ├── CharacterCounter
│   │   ├── SendButton
│   │   └── EndChatButton (triggers EndChatModal)
│   │       └── EndChatModal (confirmation dialog)
│   │
│   └── ErrorComponent
│       └── Shown on errors
│
└── Support Components
    ├── LoadingSpinner (shown while loading)
    └── Banners (connection status, offline, etc.)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│         GenesysChatComponent (Parent)           │
└─────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   ┌─────────┐  ┌────────────────┐ ┌──────────┐
   │State    │  │Effects/Subs    │ │Actions/  │
   │         │  │                │ │Handlers  │
   ├─────────┤  ├────────────────┤ ├──────────┤
   │messages │  │Init Genesys    │ │Send Msg  │
   │userInput│  │Subscribe Msg   │ │End Chat  │
   │genesys  │  │Subscribe Off   │ │Quick     │
   │Ready    │  │Load History    │ │Reply     │
   │errors   │  │Agent Typography│ │          │
   └─────────┘  └────────────────┘ └──────────┘
        ↓               ↓               ↓
        └───────────────┼───────────────┘
                        ↓
            ┌──────────────────────┐
            │  GenesysService      │
            │  (SDK Abstraction)   │
            ├──────────────────────┤
            │ loadGenesysScript()  │
            │ sendMessageToGenesys │
            │ subscribeToMessages  │
            │ fetchMessageHistory  │
            └──────────────────────┘
                        ↓
            ┌──────────────────────┐
            │  Window.Genesys SDK  │
            │  (External Library)  │
            └──────────────────────┘
```

## State Management Flow

```
User Input → useChatActions() → GenesysService.sendMessage()
                ↓
            setUserInput('')
            setMessages([...])
                ↓
           useChatState (single source of truth)
                ↓
           Re-render Components
                ↓
           Messages / ChatForm / Indicators Updated
```

```
Genesys Event → useGenesysSubscriptions()
                ↓
         Update useChatState
         (setMessages, setAgentIsTyping, etc.)
                ↓
         useChatUI() processes changes
         (mergeChatHistory, scroll)
                ↓
         Components re-render with new data
```

## Hook Responsibility Matrix

| Hook | Purpose | Dependencies | Update Frequency |
|------|---------|--------------|-------------------|
| **useChatState** | Centralized state | useState | On user action / event |
| **useGenesysInitialization** | SDK setup | window.Genesys | Once on mount |
| **useGenesysSubscriptions** | Event handling | genesysIsReady | Continuous (events) |
| **useChatActions** | User handlers | All state + services | Per interaction |
| **useChatUI** | Display logic | messages, scroll flag | On message change |

## Service Layer Architecture

```
┌────────────────────────────────────────┐
│         GenesysService (Class)         │
│  (Single Responsibility - SDK wrapper) │
├────────────────────────────────────────┤
│ Public Methods:                        │
│ + loadGenesysScript()                  │
│ + initialiseGenesysConversation()      │
│ + sendMessageToGenesys()               │
│ + fetchMessageHistory()                │
│ + subscribeToGenesysMessages()         │
│ + subscribeToGenesysOldMessages()      │
│ + subscribeToSessionRestored()         │
│ + subscribeToGenesysReconnected()      │
│ + subscribeToGenesysOffline()          │
│ + subscribeToErrors()                  │
│ + subscribeAgentTyping()               │
│ + unSubscribeAgentTyping()             │
│ + clearConversation()                  │
│ + registerForSessionClearingEvents()   │
├────────────────────────────────────────┤
│ Private Methods:                       │
│ - startConversation()                  │
│ - removeActiveSessionFromLocalStorage()│
└────────────────────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  window.Genesys SDK  │
        │ (External library)   │
        └──────────────────────┘
```

## Utility Functions Organization

```
src/utils/
├── message-utils.js
│   ├── mapHistoricalMessagesToStandardMessageFormat()
│   ├── clearAgentTypingOnOutboundHumanMessage()
│   └── checkChatEnded()
│
├── genesys-agent.js
│   ├── getCurrentAgentName()
│   ├── isConnectedToAgent()
│   ├── setAgentConnectedBanner()
│   ├── setAgentDisconnectedBanner()
│   ├── setOfflineBanner()
│   └── setReconnectedBanner()
│
├── structured-message.js
│   ├── setHideContentProperty()
│   ├── getStructureMessageIndex()
│   ├── setHideContentPropertyWithIndex()
│   ├── setPreviousStructureHideTrue()
│   └── setHideContentToHistoricalMessages()
│
├── conversation-storage.js
│   ├── getConversationId()
│   ├── setConversationId()
│   └── removeConversationId()
│
├── text-converter.js
│   ├── convertToMarkdown()
│   └── [Other text processing functions]
│
├── text-counter.js
│   └── [Character counting functions]
│
├── env-bootstrap.js
    ├── loadEnvironmentConfig()
    └── getEnvValueByKey()
```

## Dependency Injection Pattern

```
GenesysChatComponent
│
├─→ useChatState()
│   └─→ Returns: {state, setState functions}
│
├─→ useChatUI()
│   └─→ Depends on: useChatState output
│   └─→ Returns: {mergeChatHistory}
│
├─→ useGenesysInitialization()
│   └─→ Depends on: useChatState setters
│   └─→ Uses: GenesysService functions
│
├─→ useGenesysSubscriptions()
│   └─→ Depends on: useChatState, mergeChatHistory
│   └─→ Uses: GenesysService functions
│
└─→ useChatActions()
    └─→ Depends on: useChatState, GenesysService
    └─→ Returns: action handlers (memoized)
```

## Event Flow Diagram

```
User Types Message
    ↓
ChatForm onChange
    ↓
handleSetInputMessage() (useChatActions)
    ↓
setUserInput() (useChatState)
    ↓
Component re-render
    ↓
CharacterCounter updates

────────────────────────────────────────

User Sends Message
    ↓
ChatForm onSubmit
    ↓
sendMessage() (useChatActions)
    ↓
sendMessageToGenesys() (GenesysService)
    ↓
window.Genesys SDK
    ↓
setUserInput('') (clear input)
    ↓
Component re-render

────────────────────────────────────────

Genesys SDK emits message event
    ↓
Subscription callback triggered (useGenesysSubscriptions)
    ↓
setMessages() with new message
    ↓
Update message index for structured messages
    ↓
setShouldScrollToLatestMessage(true)
    ↓
useChatUI auto-scroll effect runs
    ↓
lastMessageRef.scrollIntoView()
    ↓
Component re-render with new message
```

## Life Cycle Phases

### Phase 1: Initialization (Mount)
```
1. Component mounts
2. useGenesysInitialization runs:
   - Load script if needed
   - Subscribe to MessagingService.ready
   - Call initialiseGenesysConversation
3. Genesys SDK callback triggers
4. setGenesysIsReady(true)
5. useGenesysSubscriptions runs with genesysIsReady=true
```

### Phase 2: Subscription Setup
```
1. useGenesysSubscriptions effect runs
2. Multiple subscriptions created:
   - Messages
   - Old messages/history
   - Session restored
   - Offline/reconnect
   - Agent typing
   - Errors
3. All handlers update useChatState
4. Cleanup functions registered (unsubscribe)
```

### Phase 3: Active Conversation
```
1. User interacts (type, send, click)
2. useChatActions handlers fire
3. GenesysService methods called
4. Window.Genesys SDK queued commands
5. SDK emits events
6. Subscriptions caught in useGenesysSubscriptions
7. State updated through useChatState
8. Components re-render
```

### Phase 4: Cleanup (Unmount)
```
1. Component unmounts
2. Effect cleanup functions run
3. Event unsubscriptions executed
4. No memory leaks
```

## Error Handling Flow

```
Error occurs (Genesys SDK, Network, etc.)
    ↓
subscribeToErrors() callback triggered
    ↓
setIsErrorState(true)
    ↓
ErrorComponent renders
    ↓
User sees error message with contact link
    ↓
Chat is disabled, user directed to support
```

## Performance Optimization Points

```
1. useCallback Memoization
   - Prevents child re-renders unnecessarily
   - Updates only when dependencies change

2. useChatState Consolidation
   - Single setState source prevents cascading updates
   - Related state changes batched together

3. Effect Dependencies
   - Properly declared to prevent stale closures
   - Effects run only when truly needed

4. Subscription Isolation
   - Each concern in separate hook
   - Unrelated changes don't trigger all effects

5. Lazy Message Rendering
   - Messages component handles individual items
   - Only changed messages re-render
```
