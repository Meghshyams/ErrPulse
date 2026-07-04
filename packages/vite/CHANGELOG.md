# @errpulse/vite

## 0.7.0

### Minor Changes

- f37c9b0: feat: zero-config Vite plugin + framework-agnostic browser SDK
  - **New `@errpulse/browser`**: the frontend capture layer (fetch/XHR/console interceptors, global error handlers, batching client) extracted from `@errpulse/react` into a framework-agnostic package with a single `init(options)` entry point. Works in React, Vue, Svelte, Solid, or vanilla JS. `init()` returns a teardown function and is idempotent.
  - **New `@errpulse/vite`**: one line in `vite.config.ts` — `plugins: [errpulse()]` — injects the browser SDK into `index.html` before any app code runs. No SDK install in the app, no provider wrapping. Dev-only by design (`apply: "serve"`): production builds contain zero ErrPulse code. `projectId` defaults to the app's package.json name; RegExp values in `correlationPropagationTargets` are supported.
  - **`@errpulse/react`** now delegates capture to `@errpulse/browser` (new dependency). Public API is unchanged; the provider is a thin wrapper over `init()`.

### Patch Changes

- Updated dependencies [f37c9b0]
  - @errpulse/browser@0.7.0
