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
