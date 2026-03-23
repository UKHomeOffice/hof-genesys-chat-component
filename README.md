# HOF Genesys Chat Component

A reusable, modular, and maintainable React component library for integrating Genesys web chat into Home Office web messenger services.

## Overview

This component provides a complete chat interface with agent connectivity, message history, offline handling, and accessibility features. It's built with React 19 best practices, custom hooks for state management, and comprehensive test coverage.

## Key Features

- **Modular Architecture**: Separated concerns with custom hooks for state, subscriptions, actions, and UI
- **Full React 19 Support**: Functional components, hooks, context-based architecture
- **Genesys Integration**: Seamless integration with Genesys Messenger SDK
- **Accessibility**: WCAG 2.1 compliant with built-in accessibility testing
- **Offline Support**: Handles disconnections and reconnections gracefully
- **Message History**: Loads and displays conversation history
- **GovUK Design System**: Styled with GovUK frontend framework

## Architecture

For detailed component architecture, see the [component architecture overview](./docs/architecture.md)

### Core Component Flow

1. On initial load of the component, the service fetches and initialises the [Genesys Headless SDK](https://developer.genesys.cloud/commdigital/digital/webmessaging/messengersdk/messengerHeadlessmodeSDK). 
3. Whilst this is happening, a loading spinner is shown to indicate further loading is taking place. 
4. Once the SDK is loaded, the component will begin a sequence of actions to ensure the SDK is ready and subscribe to a number of core SDK events (see [genesys overview](./docs/genesys-overview.md) for more detail).
5. Once the application is deemed ready, the chat components will be loaded into the user browser, replacing the loading spinner. The user will then be able to interact with the digital assistant or live agent through the use of the chat form.

#### Genesys Integration

See the [genesys overview](./docs/genesys-overview.md) for details on how the service integrates with Genesys Cloud Platform.

### Component Hierarchy

```
GenesysChatComponent (main entry)
├── PageHeading
├── Messages
│   ├── MessageMeta
│   ├── MessageText
│   ├── TypingIndicator
│   └── Message Types
│       ├── InboundMessage
│       ├── OutboundMessage
│       └── StructuredMessage
├── ChatForm
    ├── CharacterCounter
    └── EndChatModal
```

### Custom Hooks

#### `useChatState`
Manages all chat-related state in a single source of truth.

```javascript
const {
  userInput,
  messages,
  genesysIsReady,
  isErrorState,
  // ... other state
} = useChatState();
```

#### `useGenesysInitialization`
Handles loading the Genesys SDK script and initializing conversations.

```javascript
useGenesysInitialization({
  deploymentId,
  localStorageKey,
  setGenesysIsReady,
  setIsErrorState,
});
```

#### `useGenesysSubscriptions`
Manages all Genesys event subscriptions (messages, offline/reconnect, history, etc.).

```javascript
useGenesysSubscriptions({
  genesysIsReady,
  setMessages,
  mergeChatHistory,
  // ... other setters
});
```

#### `useChatActions`
Encapsulates user actions (send message, end chat, fetch history, etc.) with memoization.

```javascript
const {
  sendMessage,
  handleKeyPress,
  handleQuickReply,
  handleEndChat,
  // ... other handlers
} = useChatActions({ /* params */ });
```

#### `useChatUI`
Handles UI behaviors like scrolling to latest messages and merging history.

```javascript
const { mergeChatHistory } = useChatUI({
  messages,
  shouldScrollToLatestMessage,
  lastMessageRef,
  // ... other params
});
```

### Services

#### `GenesysService` (Class-Based)
Provides a clean abstraction over the Genesys SDK with class methods.

```javascript
const service = new GenesysService();
service.loadGenesysScript(environment, deploymentId);
service.initialiseGenesysConversation(onReady, onError, storageKey);
```

## Usage

### Basic Implementation

The core component is designed to be flexible and not rely on any external configuration. It expects a `serivceMetadata` prop which lets external services configure the component as they desire:

```javascript
const serviceMetadata = {
  localStorageKey: config.localStorageKey,
  serviceName: config.sandbox.serviceName,
  agentConnectedText: config.bannerTypeDisplay.agentConnected,
  agentDisconnectedText: config.bannerTypeDisplay.agentDisconnected,
  offlineText: config.bannerTypeDisplay.offline,
  onlineText: config.bannerTypeDisplay.online,
  utmParam: config.sandbox.gaUtmParam,
  botMetaDisplay: config.botMetaDisplay
}
```

In the example component below, the LoadingSpinner component is from the `hods` library: `import LoadingSpinnner from '@hods/loading-spinner';`

```javascript
import { GenesysChatComponent } from 'hof-genesys-chat-component';

export function ChatPage() {
  return (
    <GenesysChatComponent
      genesysEnvironment="example-genesys-environment"
      deploymentId="example-deployment-id"
      serviceMetadata={serviceMetadata}
      loadingSpinner={<LoadingSpinnner>Loading web chat</LoadingSpinnner>}
      loggingCallback={logData}
      onChatEnded={() => navigate('/end-chat-confirmation')}
      errorComponent={
        <ErrorComponent contactFormLink={config.sandbox.errorContactLink} />
      }
    />
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `genesysEnvironment` | string | ✓ | - | Genesys environment |
| `deploymentId` | string | ✓ | - | Genesys deployment ID |
| `serviceMetadata` | object | ✓ | - | The metadata to use for specific genesys configration items |
| `loadingSpinner` | component | ✓ | - | The component to render when data loading takes place |
| `loggingCallback` | function | ✓ | - | The callback function to execute whenever logging takes place |
| `onChatEnded` | function | ✓ | - | Callback when chat ends |
| `errorComponent` | component | ✓ | - | The component the render in event of an error |

## Core Features

### 1. **Component Simplification**
- Each custom hook has a single responsibility (state, initialization, subscriptions, actions, UI)

### 2. **Better State Management**
Custom hooks replaced monolithic useState calls:
- `useChatState`: Centralizes all state declarations
- Effects properly organized in dedicated hooks (initialization, subscriptions, UI)
- Memoization with `useCallback` prevents unnecessary re-renders

### 3. **Service Layer Abstraction**
- `GenesysService` class encapsulates SDK interactions
- Clean methods with clear contracts
- Easier to test and mock

### 4. **Improved Code Organization**
- Utils: `message-utils`, `genesys-agent`, `conversation-storage`, etc.
- Components: Small, focused presentational components
- Hooks: Reusable logic separated by concern
- Services: Genesys SDK abstraction

### 6. **React 19 Best Practices**
- Pure functional components
- Hooks for state and side-effects
- Proper dependency arrays in `useEffect`
- `useCallback` for memoized callbacks
- Context API for shared state management (via conversation provider)
- No class components
- Proper cleanup in effects

## Development Workflow

### Running Tests
```bash
yarn test                    # Run all tests in watch mode
yarn test -- --watchAll=false  # Single test run with coverage
```

### Test Coverage Report
```bash
yarn test -- --watchAll=false --coverage
```

### Building
```bash
yarn run build
# Creates ESM bundle in dist/ directory
```

### Testing Development Changes

For testing any local changes during development, use the sandbox (TODO) project.

Steps

1. Bump the patch version 
```bash
yarn version --patch
# Bumps the version in the package.json to the next patch increment
```

2. Build the project
```bash
yarn run build
# Creates ESM bundle in dist/ directory
```

3. Delete `node_modules/` (to prevent dual React bundling)
```bash
rm -rf node_modules/
```

4. Package the bundled `dist/` into a `.tgz` archive
```bash
yarn pack
# Creates a .tgz bundle of the dist/ folder
```

5. Install the new package into the sandbox (TODO)
```bash
yarn add hof-genesys-chat-component-v<version>.tgz
# Install the newly package bundle as a dependency
```

## Common Integration Points

### Integrating with web-messengers
```javascript
// In your route component (e.g., eta.js)
import { GenesysChatComponent } from 'hof-genesys-chat-component';

export function ETAMessenger() {
  const navigate = useNavigate();

  return (
    <GenesysChatComponent
      deploymentId={process.env.REACT_APP_GENESYS_DEPLOYMENT_ID}
      localStorageKey="eta-chat-session"
      serviceName="ETA"
      serviceSubText="Employment Training Aid"
      errorContactLink="/contact"
      onChatEnded={() => navigate('/end-chat-confirmation')}
    />
  );
}
```

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant
- Jest-axe testing included

## Troubleshooting

### Chat won't connect
- Check `deploymentId` is correct
- Verify Genesys environment setting
- Check browser console for SDK load errors

### Messages not sending
- Verify local storage isn't full
- Check `localStorageKey` is unique per service
- Review Genesys SDK events in browser console

### Tests failing
- Run `yarn test -- --watchAll=false` for full coverage report
- Check `__mocks__` directory for mock files
- Ensure all peer dependencies installed

## File Structure

```
src/
├── components/
│   ├── genesys-chat-component.js (main component)
│   ├── chat/
│   ├── content/
│   ├── error/
│   └── message/
├── hooks/
│   ├── use-chat-state.js
│   ├── use-chat-actions.js
│   ├── use-chat-ui.js
│   ├── use-genesys-initialization.js
│   └── use-genesys-subscriptions.js
├── services/
│   └── genesys-service.js
├── utils/
│   ├── message-utils.js
│   ├── genesys-agent.js
│   ├── conversation-storage.js
│   ├── logging.js
│   └── ...
└── conversation/
    |── conversation-provider.js
    └── conversation-storage.js
```

## Support

For issues or questions, contact the development team or create an issue in the repository.
