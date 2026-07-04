import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core",
  "packages/server",
  "packages/node",
  "packages/browser",
  "packages/react",
  "packages/cli",
  "packages/vite",
]);
