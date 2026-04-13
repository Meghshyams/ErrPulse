<p align="center">
  <img src="https://img.shields.io/badge/ErrPulse-React%20SDK-f43f5e?style=for-the-badge&labelColor=09090b" alt="@errpulse/react" />
</p>

# @errpulse/react

Frontend error monitoring SDK for React. Part of [ErrPulse](https://github.com/Meghshyams/ErrPulse) — the error monitoring tool that runs with one command.

## Installation

```bash
npm install @errpulse/react
```

## Quick Start

```tsx
import { ErrPulseProvider } from "@errpulse/react";

function App() {
  return (
    <ErrPulseProvider endpoint="http://localhost:3800" projectId="my-web-app">
      <YourApp />
    </ErrPulseProvider>
  );
}
```

That's it. Errors, failed requests, and React crashes are captured automatically.

### Add the DevTools Widget (optional)

A floating in-app debug panel to see errors, console logs, and network requests without leaving your app:

```tsx
import { ErrPulseProvider, ErrPulseDevTools } from "@errpulse/react";

function App() {
  return (
    <ErrPulseProvider endpoint="http://localhost:3800" projectId="my-web-app">
      <YourApp />
      <ErrPulseDevTools />
    </ErrPulseProvider>
  );
}
```

## What Gets Captured

| Error Type                    | How                                   |
| ----------------------------- | ------------------------------------- |
| JavaScript runtime errors     | `window.onerror`                      |
| Unhandled promise rejections  | `window.onunhandledrejection`         |
| React component crashes       | Built-in Error Boundary               |
| Failed fetch requests         | `fetch()` interceptor                 |
| Failed XHR requests           | `XMLHttpRequest` interceptor          |
| `console.error` calls         | Monkey-patch                          |
| `console.log/warn/info/debug` | Monkey-patch (opt-in)                 |
| Resource failures (img, css)  | Capture-phase error listener          |
| All HTTP requests             | Fetch interceptor with detail capture |

## Provider Props

| Prop                    | Type                                       | Default      | Description                                   |
| ----------------------- | ------------------------------------------ | ------------ | --------------------------------------------- |
| `endpoint`              | `string`                                   | **required** | ErrPulse server URL                           |
| `projectId`             | `string`                                   | `undefined`  | Project identifier for multi-project setups   |
| `captureConsoleErrors`  | `boolean`                                  | `true`       | Capture `console.error` calls                 |
| `captureConsoleLogs`    | `boolean`                                  | `false`      | Capture `console.log/warn/info/debug` to Logs |
| `captureFetch`          | `boolean`                                  | `true`       | Intercept and track fetch requests            |
| `captureXHR`            | `boolean`                                  | `true`       | Intercept and track XMLHttpRequest calls      |
| `captureResourceErrors` | `boolean`                                  | `true`       | Capture failed img/script/css loads           |
| `errorBoundaryFallback` | `ReactNode \| (error: Error) => ReactNode` | `undefined`  | Fallback UI for React crashes                 |

### Full Example

```tsx
<ErrPulseProvider
  endpoint="http://localhost:3800"
  projectId="my-web-app"
  captureConsoleErrors={true}
  captureConsoleLogs={true}
  captureFetch={true}
  captureXHR={true}
  captureResourceErrors={true}
  errorBoundaryFallback={(error) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  )}
>
  <App />
</ErrPulseProvider>
```

## Manual Capture

```tsx
import { useErrPulse } from "@errpulse/react";

function CheckoutButton() {
  const { captureError, captureMessage } = useErrPulse();

  const handleClick = async () => {
    try {
      await processPayment();
      captureMessage("Payment successful", "info");
    } catch (err) {
      captureError(err, { step: "payment" });
    }
  };

  return <button onClick={handleClick}>Checkout</button>;
}
```

## Error Boundary

The `ErrPulseProvider` includes a built-in error boundary. When a React component crashes, it captures the error with full stack trace and component stack, reports it to the server, and renders the `errorBoundaryFallback` if provided.

You can also use the error boundary directly:

```tsx
import { ErrPulseErrorBoundary } from "@errpulse/react";

<ErrPulseErrorBoundary fallback={<p>Something broke</p>}>
  <RiskyComponent />
</ErrPulseErrorBoundary>;
```

## Error Correlation

The SDK automatically injects an `X-ErrPulse-Correlation-ID` header into every outgoing `fetch` request. When paired with `@errpulse/node` on the backend, the dashboard shows the full chain: **user action -> frontend request -> backend error**.

## Request Detail Capture

The fetch interceptor captures full request/response details:

- Request and response headers (sensitive headers redacted)
- Request body (string and URLSearchParams)
- Response body (via `response.clone()`)
- Bodies capped at 16 KB each

## Page Unload

The SDK uses `navigator.sendBeacon()` on page unload to flush any remaining buffered events and logs, ensuring nothing is lost when the user navigates away.

## DevTools Widget

`<ErrPulseDevTools />` is a floating in-app debug panel — like React DevTools, but for errors, console logs, and network requests.

| Prop          | Type                                                           | Default          | Description                               |
| ------------- | -------------------------------------------------------------- | ---------------- | ----------------------------------------- |
| `position`    | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"` | Initial corner position (draggable after) |
| `initialOpen` | `boolean`                                                      | `false`          | Start with panel open                     |
| `enabled`     | `boolean`                                                      | `undefined`      | Force on/off. Default: auto (dev only)    |

**Features:**

- **Errors tab** — every captured error with severity, stack trace, and server-provided explanations
- **Console tab** — live console output with click-to-expand JSON tree viewer
- **Network tab** — all HTTP requests with full request/response headers and payloads
- **Expandable** — maximize to near-fullscreen for large payloads
- **Draggable** — drag the icon anywhere, position saved to localStorage
- **Keyboard shortcut** — `Ctrl+Shift+E` to toggle
- **Shadow DOM** — fully isolated styles, no CSS leakage
- **Hybrid data** — works locally without the server, enriched with explanations when connected

## Documentation

- [Full SDK Docs](https://meghshyams.github.io/ErrPulse/sdks/react)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
