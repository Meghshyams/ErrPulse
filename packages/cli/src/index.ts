import { startServer, resolveConfig } from "@errpulse/server";
import { startTail } from "./tail.js";

const args = process.argv.slice(2);
const command = args[0] ?? "start";

function printHelp(): void {
  console.log(`
  errpulse — the error monitoring tool that runs with one command

  Usage:
    errpulse [command] [options]

  Commands:
    start     Start the ErrPulse server (default) — streams errors to this terminal
    tail      Stream errors from a running ErrPulse server to this terminal
    mcp       Start an MCP server so AI coding agents can query errors
    status    Check if ErrPulse is running
    clear     Clear all stored errors and requests
    help      Show this help message

  Options:
    --port <number>    Port to listen on (default: 3800)
    --requests         Also print failed HTTP requests (4xx/5xx/network)
    --quiet            Don't stream errors to the terminal (start only)

  Examples:
    npx errpulse
    npx errpulse start --port 4000
    npx errpulse tail --requests
    npx errpulse clear

  Docs:
    https://meghshyams.github.io/ErrPulse/
  `);
}

function parsePort(): number | undefined {
  const portIdx = args.indexOf("--port");
  if (portIdx !== -1 && args[portIdx + 1]) {
    return Number(args[portIdx + 1]);
  }
  return undefined;
}

async function main(): Promise<void> {
  switch (command) {
    case "start":
    case undefined: {
      const port = parsePort();
      const { config } = await startServer({ port });
      if (!args.includes("--quiet")) {
        console.log("  Streaming new errors below (disable with --quiet)\n");
        startTail({
          port: config.port,
          showRequests: args.includes("--requests"),
          quiet: true,
        });
      }
      break;
    }

    case "tail": {
      const config = resolveConfig({ port: parsePort() });
      startTail({
        port: config.port,
        showRequests: args.includes("--requests"),
      });
      break;
    }

    case "mcp": {
      const config = resolveConfig({ port: parsePort() });
      const { startMcpServer } = await import("./mcp.js");
      await startMcpServer(config.port);
      break;
    }

    case "status": {
      const config = resolveConfig({ port: parsePort() });
      try {
        const res = await fetch(`http://localhost:${config.port}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`  ErrPulse is running on port ${config.port}`);
          console.log(`  Uptime: ${Math.round(data.uptime)}s`);
        } else {
          console.log(`  ErrPulse returned status ${res.status}`);
        }
      } catch {
        console.log(`  ErrPulse is not running on port ${config.port}`);
        process.exit(1);
      }
      break;
    }

    case "clear": {
      const config = resolveConfig({ port: parsePort() });
      try {
        const res = await fetch(`http://localhost:${config.port}/api/clear`, {
          method: "POST",
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          console.log("  All errors and requests cleared.");
        } else {
          console.log(`  Failed to clear: ${res.status}`);
        }
      } catch {
        console.log(`  ErrPulse is not running on port ${config.port}`);
        process.exit(1);
      }
      break;
    }

    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;

    default:
      console.log(`  Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Failed to start ErrPulse:", err);
  process.exit(1);
});
