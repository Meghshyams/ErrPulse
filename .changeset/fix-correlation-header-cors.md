---
"@errpulse/react": patch
---

fix: stop injecting the correlation header into third-party requests

The fetch and XHR interceptors previously added `X-ErrPulse-Correlation-ID` to every outgoing request. A custom header makes cross-origin requests non-simple, forcing a CORS preflight — third-party APIs that don't allow the header would fail requests that worked before ErrPulse was installed.

The header is now only attached to same-origin requests and local dev hosts (`localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0`, `*.localhost`) by default. Use the new `correlationPropagationTargets` prop on `ErrPulseProvider` to propagate it to other backends you control (strings match as substrings, RegExps are tested against the full URL). All requests are still captured and logged either way — only the outgoing header is gated.
