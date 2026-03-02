export interface EnvironmentInfo {
  runtime: "node" | "browser";
  runtimeVersion?: string;
  os?: string;
  arch?: string;
  nodeVersion?: string;
  browser?: string;
  browserVersion?: string;
  url?: string;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}
