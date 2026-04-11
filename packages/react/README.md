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

## What Gets Captured

| Error Type                    | How                                       |
| ----------------------------- | ----------------------------------------- |
| JavaScript runtime errors     | `window.onerror`                          |
| Unhandled promise rejections  | `window.onunhandledrejection`             |
| React component crashes       | Error Boundary                            |
| Failed fetch/XHR requests     | `fetch()` + `XMLHttpRequest` interceptors |
| `console.error` calls         | Monkey-patch                              |
| `console.log/warn/info/debug` | Monkey-patch (opt-in)                     |
| Resource failures (img, css)  | Capture-phase error listener              |
| All HTTP requests             | Fetch interceptor                         |

## Provider Props

| Prop                    | Type        | Default      | Description                                   |
| ----------------------- | ----------- | ------------ | --------------------------------------------- |
| `endpoint`              | `string`    | **required** | ErrPulse server URL                           |
| `projectId`             | `string`    | `undefined`  | Project identifier for multi-project setups   |
| `captureConsoleErrors`  | `boolean`   | `true`       | Capture `console.error` calls                 |
| `captureConsoleLogs`    | `boolean`   | `false`      | Capture `console.log/warn/info/debug` to Logs |
| `captureFetch`          | `boolean`   | `true`       | Intercept and track fetch requests            |
| `captureXHR`            | `boolean`   | `true`       | Intercept and track XMLHttpRequest calls      |
| `captureResourceErrors` | `boolean`   | `true`       | Capture failed img/script/css loads           |
| `errorBoundaryFallback` | `ReactNode` | `undefined`  | Fallback UI for React crashes                 |

## Error Correlation

The SDK automatically injects an `X-ErrPulse-Correlation-ID` header into every `fetch` request. When paired with `@errpulse/node` on the backend, the dashboard shows the full chain: **user action -> frontend request -> backend error**.

## Documentation

- [Full SDK Docs](https://github.com/Meghshyams/ErrPulse/blob/main/docs/sdks/react.md)
- [GitHub Repository](https://github.com/Meghshyams/ErrPulse)

## License

[MIT](https://github.com/Meghshyams/ErrPulse/blob/main/LICENSE)
