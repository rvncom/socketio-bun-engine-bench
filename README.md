# Socket.IO Benchmark Monorepo

[![GitHub Pages](https://img.shields.io/badge/reports-GitHub%20Pages-blue?logo=github)](https://rvncom.github.io/socket-bun-engine-bench/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-f472b6?logo=bun&logoColor=white)](https://bun.sh/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Benchmarks for comparing Socket.IO server implementations across Node.js and Bun, including:

- **Node.js (ws)**: Standard `socket.io` on Node.js with default `ws` transport.
- **Node.js (uWebSockets.js)**: `uWebSockets.js` server emulating Socket.IO protocol (lightweight).
- **Bun (@socket.io/bun-engine)**: Standard `socket.io` running on Bun with official `@socket.io/bun-engine`.
- **Bun (@rvncom/socket-bun-engine)**: `@rvncom/socket-bun-engine` running on Bun (native Bun.serve).

## Structure

This is a pnpm monorepo:

- `packages/bench-client`: The benchmark runner (Bun-based) that connects to servers and generates reports.
- `packages/server-node-ws`: Node.js + `ws` (default Socket.IO transport).
- `packages/server-node-uws`: Node.js + uWebSockets.js server.
- `packages/server-bun-socketio-engine`: Bun + `@socket.io/bun-engine` server.
- `packages/server-bun-native`: Bun + `@rvncom/socket-bun-engine` server.

## Prerequisites

- **Node.js**: v18+ (LTS recommended for uWebSockets.js compatibility)
- **Bun**: v1.0+
- **pnpm**: v9+ (Recommended)

## Installation

```bash
pnpm install
```

## Running Benchmarks

To run the full comparison suite:

```bash
pnpm run bench
```

This will:

1. Start each server sequentially.
2. Run connection, throughput, and latency tests.
3. Generate a detailed HTML report in `results/comparison-TIMESTAMP.html` (Dark Theme).

### Customizing Load

You can adjust the load via environment variables:

```bash
# Example: 8 workers, 5000 connections target
WORKERS=8 CONNECTIONS=5000 pnpm run bench
```

- `WORKERS`: Number of parallel client workers (default: 4).
- `SERVER_WORKERS`: Number of server processes (default: 1 on Windows, equals WORKERS on others).
- `CONNECTIONS`: Target total concurrent connections (default: 2000).
- `CLIENTS`: Number of clients for throughput/latency tests (default: 200).
- `MESSAGES`: Messages per client for throughput test (default: 500).
- `SAMPLES`: Number of latency samples per client (default: 100).

## Manual Run

If you want to run a specific server and benchmark manually:

1. **Start a server:**

   ```bash
   pnpm --filter @bench/server-bun-native start
   ```

2. **Run benchmarks (in another terminal):**

   ```bash
   # Go to client package
   cd packages/bench-client

   # Run specific test
   bun run src/connections.ts
   bun run src/throughput.ts
   bun run src/latency.ts
   ```

## License

[MIT](/LICENSE)
