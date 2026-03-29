# React SDK

`@errpulse/react` captures frontend errors, failed network requests, and React component crashes from your React application.

## Installation

```bash
npm install @errpulse/react
```

## ErrPulseProvider

Wrap your app with the provider to start capturing errors:

```tsx
import { ErrPulseProvider } from "@errpulse/react";

function App() {
  return (
    <ErrPulseProvider endpoint="http://localhost:3800">
      <YourApp />
    </ErrPulseProvider>
  );
}
```

### Props Reference

| Prop                    | Type                                       | Default      | Description                                 |
| ----------------------- | ------------------------------------------ | ------------ | ------------------------------------------- |
| `endpoint`              | `string`                                   | **required** | ErrPulse server URL                         |
| `projectId`             | `string`                                   | `undefined`  | Project identifier for multi-project setups |
| `captureConsoleErrors`  | `boolean`                                  | `true`       | Capture `console.error` calls               |
| `captureFetch`          | `boolean`                                  | `true`       | Intercept and track fetch requests          |
| `captureXHR`            | `boolean`                                  | `true`       | Intercept and track XMLHttpRequest calls    |
| `captureResourceErrors` | `boolean`                                  | `true`       | Capture failed img/script/css loads         |
| `errorBoundaryFallback` | `ReactNode \| (error: Error) => ReactNode` | `undefined`  | Fallback UI for React crashes               |

### Full Example

```tsx
<ErrPulseProvider
  endpoint="http://localhost:3800"
  projectId="my-web-app"
  captureConsoleErrors={true}
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

## useErrPulse Hook

Use the `useErrPulse` hook for manual error and message capture:

```tsx
import { useErrPulse } from "@errpulse/react";

function CheckoutButton() {
  const { captureError, captureMessage } = useErrPulse();

  const handleClick = async () => {
    try {
      await processPayment();
      captureMessage("Payment successful", "info", { plan: "pro" });
    } catch (err) {
      captureError(err, { step: "payment" });
    }
  };

  return <button onClick={handleClick}>Checkout</button>;
}
```

### `captureError(error, extra?)`

```ts
captureError(new Error("Form validation failed"), { field: "email" });
captureError("Something went wrong"); // String also accepted
```

### `captureMessage(message, severity?, extra?)`

```ts
captureMessage("User clicked CTA", "info");
captureMessage("API response slow", "warning", { duration: 5200 });
captureMessage("Upload failed", "error", { fileSize: "50MB" });
```

## Error Boundary

The `ErrPulseProvider` includes a built-in error boundary. When a React component crashes, it:

1. Captures the error with full stack trace and component stack
2. Reports it to the ErrPulse server
3. Renders the `errorBoundaryFallback` if provided, or nothing

You can also use the error boundary component directly:

```tsx
import { ErrPulseErrorBoundary } from "@errpulse/react";

function App() {
  return (
    <ErrPulseErrorBoundary fallback={<p>Something broke</p>}>
      <RiskyComponent />
    </ErrPulseErrorBoundary>
  );
}
```

## What Gets Captured

The SDK installs the following instruments automatically:

| Instrument             | What It Captures              | How                             |
| ---------------------- | ----------------------------- | ------------------------------- |
| Global error handler   | JavaScript runtime errors     | `window.onerror`                |
| Rejection handler      | Unhandled promise rejections  | `window.onunhandledrejection`   |
| Fetch interceptor      | Failed/errored fetch requests | Monkey-patches `window.fetch`   |
| XHR interceptor        | Failed/errored XHR requests   | Monkey-patches `XMLHttpRequest` |
| Console interceptor    | `console.error` calls         | Wraps `console.error`           |
| Resource error handler | Failed img/script/css loads   | Capture-phase event listener    |
| Error boundary         | React component crashes       | React error boundary            |

## Request Detail Capture

The fetch interceptor automatically captures request and response details for every outgoing `fetch` call:

- **Request headers** — sanitized (sensitive headers like `authorization` and `cookie` are redacted)
- **Response headers** — captured from the response
- **Request body** — captured for `string` and `URLSearchParams` bodies (Blob/ArrayBuffer/FormData are skipped for performance)
- **Response body** — captured by cloning the response stream (does not consume the original)

::: tip Performance
Request and response bodies are capped at **16 KB** each. Anything larger is truncated with a `...[truncated]` indicator. Response bodies are read via `response.clone()` so the original stream remains available to your application code.
:::

## Correlation ID

The React SDK automatically injects an `X-ErrPulse-Correlation-ID` header into every outgoing `fetch` request. This links frontend requests to backend errors:

```
Frontend: fetch("/api/checkout")
  → Header: X-ErrPulse-Correlation-ID: a1b2c3d4e5f6

Backend: expressRequestHandler() reads the header
  → If an error occurs, both the request and error share the same correlation ID

Dashboard: Shows the full chain from user action → request → error
```

This happens automatically when both `@errpulse/node` and `@errpulse/react` are installed. No configuration required.

## Page Unload

The SDK uses `navigator.sendBeacon()` on page unload to flush any remaining buffered events. This ensures errors captured right before the user navigates away are still delivered to the server.
