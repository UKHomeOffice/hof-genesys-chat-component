## 2026-08-19, Version 0.7.1 (Stable), @nzorba

### Changed

- Updated README to include disableTextMessageSendingOnQuickReply in serviceMetadata


## 2026-08-12, Version 0.7.0 (Stable), @nzorba

### Added

- Feature to disable message text box and send button on quick replies based on two conditions:
1. disableTextMessageSendingOnQuickReply flag from service which is set depending on whether service uses this feature
2. contentType of message is set to 'QuickReply'

## 2026-05-08, Version 0.6.0 (Stable), @gregwolversonHO

### Changed

- The way error fetching works. Rather than rely on a button to 'Load More Messages', the service now uses a scroll based approach to fetching history. When a user scrolls to the top of the messages window, the service will automatically handle fetching history, this will continue until fetching history is complete.  

## 2026-05-08, Version 0.5.2 (Stable), @anjurajanHO

### Fixed

- Fixed various lint issues previously missed in JSX files and updated lint configuration to include JSX.

## 2026-05-06, Version 0.5.1 (Stable), @anjurajanHO

### Added

- Added file to scan for malicious or vulnerable packages using hof-maestro-scanner.

## 2026-04-17, Version 0.5.0 (Stable), @gregwolversonHO

### Changed

- The way error handling works from the consumer side. Instead of receiving an `errorComponent` the component now takes an `errorCallback` to invoke upon error scenarios occurring.

## 2026-04-16, Version 0.4.0 (Stable), @gregwolversonHO

### Changed

- The way conversation sessions are handled. Now the component delegates session handling to Genesys rather than rely on consumer supplied key.

## 2026-04-16, Version 0.3.2 (Stable), @gregwolversonHO

### Fixed

- Bug with Safari being able to close the end chat dialog without interacting with buttons.

## 2026-04-02, Version 0.2.0 (Stable), @gregwolversonHO

### Added

- Added a sandbox app to help test component changes locally.

## 2026-04-02, Version 0.1.0 (Stable), @gregwolversonHO

### Added
- Implemented automated tagging and publishing to NPM.

### Changed
- Updated README to include additional contributing notes.
