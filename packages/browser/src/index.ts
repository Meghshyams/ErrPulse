export { init, type ErrPulseInitOptions } from "./init.js";

export {
  setEndpoint,
  getEndpoint,
  setProjectId,
  getProjectId,
  enqueueEvent,
  enqueueLog,
  sendRequestLog,
  flushWithBeacon,
  flushLogsWithBeacon,
  subscribe,
  getEventHistory,
  getLogHistory,
  getRequestHistory,
  type DevToolsEventType,
  type DevToolsSubscriber,
  type RequestLogData,
} from "./client.js";

export { installGlobalErrorHandler } from "./instruments/global-errors.js";
export { installUnhandledRejectionHandler } from "./instruments/unhandled-rejections.js";
export { installFetchInterceptor } from "./instruments/fetch-interceptor.js";
export { installXHRInterceptor } from "./instruments/xhr-interceptor.js";
export { installConsoleInterceptor } from "./instruments/console-interceptor.js";
export { installConsoleLogInterceptor } from "./instruments/console-log-interceptor.js";
export { installResourceErrorHandler } from "./instruments/resource-errors.js";
export {
  setCorrelationPropagationTargets,
  type CorrelationTarget,
} from "./instruments/correlation-target.js";
