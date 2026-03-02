import { startServer, resolveConfig } from "@errlens/server";

const args = process.argv.slice(2);
const command = args[0] ?? "start";

function printHelp(): void {
  console.log(`
  errlens — the error monitoring tool that runs with one command

  Usage:
    errlens [command] [options]

  Commands:
    start     Start the ErrLens server (default)
    status    Check if ErrLens is running
    clear     Clear all stored errors and requests
    help      Show this help message

  Options:
    --port <number>    Port to listen on (default: 3800)

  Examples:
    npx errlens
    npx errlens start --port 4000
    npx errlens clear
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
      await startServer({ port });
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
          console.log(`  ErrLens is running on port ${config.port}`);
          console.log(`  Uptime: ${Math.round(data.uptime)}s`);
        } else {
          console.log(`  ErrLens returned status ${res.status}`);
        }
      } catch {
        console.log(`  ErrLens is not running on port ${config.port}`);
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
        console.log(`  ErrLens is not running on port ${config.port}`);
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
  console.error("Failed to start ErrLens:", err);
  process.exit(1);
});
