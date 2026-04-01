# Web Messenger Sandbox

A demonstration and testing application for the HOF Genesys Chat Component.

## Purpose

This sandbox provides a sandbox environment to test, showcase, and develop the `hof-genesys-chat-component`. It integrates the chat component within a complete application context, allowing developers to validate functionality and styling across different use cases and scenarios.

## Getting Started

### Prerequisites

#### Tools

- Node.js (v20 or higher)
- yarn

### Installation & Running

#### Component Lib Build

If it's the first time you're running the sandbox, and you haven't previously built the component library, you'll need to do so before running the installation in the sandbox.

See the [component README](../README.md#13-sandbox) for more detail, or from the root of the `hof-genesys-chat-component`

1. Install the component lib dependencies
```bash
yarn install
```

1. Build the project
```bash
yarn build
# Creates ESM bundle in dist/ directory
```

3. Delete `node_modules/` (to prevent dual React bundling)
```bash
rm -rf node_modules/
```

4. Package the bundled `dist/` into a `.tgz` archive (**if you've not changed the component version, this will already match the version in the sandbox package.json**)
```bash
yarn pack
# Creates a .tgz bundle of the dist/ folder
```

5. Reinstall dependencies 
```bash
yarn install
```

#### Sandbox Installation

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn dev
```

The app will be available at `http://localhost:3000`

3. Build for production:
```bash
yarn build
```

Output will be generated in the `dist/` directory.

## Tech Stack

- **React** - UI library
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **GOV.UK Frontend** - UK Government design system components and styles
- **HOF Genesys Chat Component** - The chat component being showcased

## Environment Configuration

The sandbox uses environment variables defined in `.env` (you will need to create this locally in the root of the repo) for Genesys configuration:
- `VITE_SANDBOX_DEPLOYMENT_ID` - Unique deployment identifier
- `VITE_GENESYS_ENVIRONMENT` - Target Genesys environment

Reach out to the dev team, or use one of the web messenger non-prod keys from keybase (use `WM-env.json` and the `ETA_DEPLOYMENT_ID` value).
