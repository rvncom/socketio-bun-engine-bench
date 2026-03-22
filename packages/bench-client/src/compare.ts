import { fileURLToPath } from "url";
import path from "path";
import type { BenchmarkResult, ScenarioMeta } from "./types";
import { generateHtmlReport } from "./html-report";

import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const getOutputFilename = () => {
  const date = new Date().toISOString().split("T")[0];
  const resultsDir = path.resolve(__dirname, "../../../results");
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  let counter = 1;
  let filename = `report-${date}-${counter}.html`;
  while (fs.existsSync(path.join(resultsDir, filename))) {
    counter++;
    filename = `report-${date}-${counter}.html`;
  }
  return path.join(resultsDir, filename);
};

const OUT_HTML = getOutputFilename();
const WORKERS = Number(process.env.WORKERS) || 4;
const SERVER_WORKERS =
  Number(process.env.SERVER_WORKERS) ||
  (process.platform === "win32" ? 1 : WORKERS);
const TARGET_CONNECTIONS = process.env.CONNECTIONS || "2000";
const TARGET_CLIENTS = process.env.CLIENTS || "200";
const TARGET_MESSAGES = process.env.MESSAGES || "500";
const TARGET_SAMPLES = process.env.SAMPLES || "50";

console.log(`\n--- Socket.IO Benchmark Comparison ---`);
console.log(`Workers: ${WORKERS} Client / ${SERVER_WORKERS} Server`);
console.log(
  `Targets: ${TARGET_CONNECTIONS} Conn / ${TARGET_CLIENTS} Clients / ${TARGET_MESSAGES} Msgs`,
);
console.log(`Output: ${OUT_HTML}\n`);

const BUN_PATH = Bun.which("bun") || "bun";
const NODE_PATH = Bun.which("node") || "node";
const PACKAGES_DIR = path.resolve(__dirname, "../..");
const PKG_ROOT = path.resolve(PACKAGES_DIR, "..");

console.log("Debug Paths:", { PKG_ROOT, PACKAGES_DIR });

// Benchmark scenarios
const SCENARIOS: ScenarioMeta[] = [
  {
    name: "node-ws",
    label: "Node.js (ws)",
    cmd: [NODE_PATH, path.join(PACKAGES_DIR, "server-node-ws", "index.js")],
    cwd: path.join(PACKAGES_DIR, "server-node-ws"),
    color: "rgba(54, 162, 235, 0.7)", // Blue
  },
  {
    name: "node-uws",
    label: "Node.js (uWebSockets.js)",
    cmd: [NODE_PATH, path.join(PACKAGES_DIR, "server-node-uws", "index.js")],
    cwd: path.join(PACKAGES_DIR, "server-node-uws"),
    color: "rgba(255, 99, 132, 0.7)", // Red
  },
  {
    name: "bun-socketio-engine",
    label: "Bun (@socket.io/bun-engine)",
    cmd: [
      BUN_PATH,
      path.join(PACKAGES_DIR, "server-bun-socketio-engine", "index.ts"),
    ],
    cwd: path.join(PACKAGES_DIR, "server-bun-socketio-engine"),
    color: "rgba(153, 102, 255, 0.7)", // Purple
  },
  {
    name: "bun-native",
    label: "Bun (@rvncom/socket-bun-engine)",
    cmd: [BUN_PATH, path.join(PACKAGES_DIR, "server-bun-native", "index.ts")],
    cwd: path.join(PACKAGES_DIR, "server-bun-native"),
    color: "rgba(75, 192, 192, 0.7)", // Green
  },
];

// Data storage
const results: Record<string, BenchmarkResult> = {};

// Helper: Extract JSON from benchmark output
function extractJson<T>(output: string): T | null {
  const match = output.match(/Result: ({.*})/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

// Helper: Run a single benchmark script across multiple workers
async function runBenchScript(
  script: string,
  env: Record<string, string> = {},
) {
  const promises = [];

  for (let i = 0; i < WORKERS; i++) {
    const workerEnv = { ...process.env, ...env };

    if (env.CONNECTIONS) {
      workerEnv.CONNECTIONS = String(
        Math.ceil(Number(env.CONNECTIONS) / WORKERS),
      );
    }
    if (env.CLIENTS) {
      workerEnv.CLIENTS = String(Math.ceil(Number(env.CLIENTS) / WORKERS));
    }

    const proc = Bun.spawn(
      [process.execPath, "run", path.join("src", script)],
      {
        env: workerEnv,
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    promises.push(
      new Response(proc.stdout)
        .text()
        .then((text) => ({ text, exitCode: proc.exited })),
    );
  }

  const rawResults = await Promise.all(promises);
  const parsed = rawResults
    .map((r) => extractJson<any>(r.text))
    .filter((r) => r !== null);

  if (parsed.length === 0) return null;

  // Merge time series from all workers by bucketing timestamps
  function mergeTimeSeries(
    workers: any[],
    key: string,
    mode: "sum" | "avg",
  ): any[] {
    // Determine bucket size based on data density
    // Use 20ms buckets for short tests, 100ms for longer ones
    const allPoints: { timestamp: number; value: number }[] = [];
    for (const worker of workers) {
      const ts = worker.timeSeries || [];
      for (const point of ts) {
        allPoints.push({ timestamp: point.timestamp, value: point[key] ?? 0 });
      }
    }
    if (allPoints.length === 0) return [];

    const maxTs = Math.max(...allPoints.map((p) => p.timestamp));
    // Use smaller buckets for short benchmarks, larger for long ones
    const bucketMs = maxTs < 500 ? 20 : maxTs < 2000 ? 50 : 100;

    const buckets = new Map<number, number[]>();
    for (const point of allPoints) {
      const bucket = Math.round(point.timestamp / bucketMs) * bucketMs;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(point.value);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, values]) => ({
        timestamp,
        [key]:
          mode === "sum"
            ? values.reduce((a, b) => a + b, 0)
            : +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      }));
  }

  // Merge latency time series: preserve per-sample granularity, just concatenate and sort
  function mergeLatencyTimeSeries(workers: any[]): any[] {
    const allPoints: { timestamp: number; latency: number }[] = [];
    for (const worker of workers) {
      const ts = worker.timeSeries || [];
      for (const point of ts) {
        allPoints.push({
          timestamp: point.timestamp,
          latency: point.latency ?? 0,
        });
      }
    }
    return allPoints.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Aggregate
  if (script.includes("connections")) {
    const target = parsed.reduce((sum, p) => sum + p.target, 0);
    const connected = parsed.reduce((sum, p) => sum + p.connected, 0);
    const failed = parsed.reduce((sum, p) => sum + p.failed, 0);
    const elapsedMs = Math.max(...parsed.map((p) => p.elapsedMs));
    const rate = Math.round((connected / elapsedMs) * 1000);
    const timeSeries = mergeTimeSeries(parsed, "connections", "sum");
    return { target, connected, failed, elapsedMs, rate, timeSeries };
  } else if (script.includes("throughput")) {
    const clients = parsed.reduce((sum, p) => sum + p.clients, 0);
    const messagesPerClient = parsed[0].messagesPerClient;
    const received = parsed.reduce((sum, p) => sum + p.received, 0);
    const elapsedMs = Math.max(...parsed.map((p) => p.elapsedMs));
    const throughput = Math.round((received / elapsedMs) * 1000);
    const timeSeries = mergeTimeSeries(parsed, "throughput", "sum");
    return {
      clients,
      messagesPerClient,
      received,
      elapsedMs,
      throughput,
      timeSeries,
    };
  } else if (script.includes("latency")) {
    // Merge raw latencies from all workers for correct percentile calculation
    const allRaw: number[] = parsed.flatMap((p) => p.rawLatencies || []);
    allRaw.sort((a, b) => a - b);

    const clients = parsed.reduce((sum, p) => sum + p.clients, 0);
    const samples = allRaw.length;
    const minMs = allRaw[0] ?? 0;
    const maxMs = allRaw[allRaw.length - 1] ?? 0;
    const avgMs = +(allRaw.reduce((a, b) => a + b, 0) / allRaw.length).toFixed(
      2,
    );

    const pct = (p: number) => {
      const idx = Math.ceil((p / 100) * allRaw.length) - 1;
      return allRaw[Math.max(0, idx)] ?? 0;
    };

    const p50Ms = pct(50);
    const p95Ms = pct(95);
    const p99Ms = pct(99);
    const timeSeries = mergeLatencyTimeSeries(parsed);
    return {
      clients,
      samples,
      minMs,
      avgMs,
      p50Ms,
      p95Ms,
      p99Ms,
      maxMs,
      timeSeries,
    };
  }
}

// --- Main Loop ---
async function main() {
  for (const scenario of SCENARIOS) {
    console.log(`\n>>> Testing: ${scenario.label} <<<`);

    // 1. Start Server(s)
    const serverProcs = [];
    console.log(`Starting ${SERVER_WORKERS} server processes...`);

    // Ensure port 3000 is free before starting
    if (process.platform === "win32") {
      try {
        const { stdout } = Bun.spawnSync([
          "cmd",
          "/c",
          "netstat -ano | findstr :3000 | findstr LISTENING",
        ]);
        const line = stdout.toString().trim();
        if (line) {
          const pid = line.split(/\s+/).pop();
          if (pid && pid !== "0") {
            console.log(`Port 3000 is busy (PID ${pid}). Killing...`);
            Bun.spawnSync(["taskkill", "/F", "/PID", pid]);
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      } catch {}
    }

    // Check if command is valid (e.g. node might not be in path, but usually is)
    try {
      for (let i = 0; i < SERVER_WORKERS; i++) {
        const proc = Bun.spawn(scenario.cmd, {
          env: { ...process.env, PORT: "3000" }, // Use same port, assuming reusePort is handled or only 1 worker
          stdout: "inherit",
          stderr: "inherit",
          cwd: scenario.cwd || PKG_ROOT, // Execute from package root
        });
        serverProcs.push(proc);
      }
    } catch (e) {
      console.error(`Failed to start ${scenario.name}:`, e);
      continue;
    }

    // Give server time to warm up
    await new Promise((r) => setTimeout(r, 1000));

    // Check if servers are still running
    const aliveServers = serverProcs.filter((p) => p.exitCode === null);
    if (aliveServers.length === 0) {
      console.error(
        `Server(s) for ${scenario.name} failed to start or exited early.`,
      );
      console.log("Skipping benchmarks for this scenario.");
      continue;
    } else if (aliveServers.length < SERVER_WORKERS) {
      console.warn(
        `Warning: Only ${aliveServers.length}/${SERVER_WORKERS} servers are running.`,
      );
    }

    // Initialize result object
    results[scenario.name] = {
      meta: scenario,
    };

    try {
      // 2. Run Benchmarks

      // Phase 1: Connections + Latency in parallel (low interference — conn only opens sockets, latency is light)
      console.log("  - Benchmarking Connections + Latency (parallel)...");
      const [conn, lat] = await Promise.all([
        runBenchScript("connections.ts", { CONNECTIONS: TARGET_CONNECTIONS }),
        runBenchScript("latency.ts", {
          CLIENTS: "20",
          SAMPLES: TARGET_SAMPLES,
        }),
      ]);
      console.log(`    Connections: ${conn ? `${conn.rate}/sec` : "Failed"}`);
      console.log(`    Latency: ${lat ? `p95: ${lat.p95Ms}ms` : "Failed"}`);
      if (conn) results[scenario.name].connections = conn;
      if (lat) results[scenario.name].latency = lat;

      // Phase 2: Throughput alone (heavy load — floods the server)
      process.stdout.write("  - Benchmarking Throughput... ");
      const tp = await runBenchScript("throughput.ts", {
        CLIENTS: TARGET_CLIENTS,
        MESSAGES: TARGET_MESSAGES,
      });
      console.log(tp ? `${tp.throughput} msg/sec` : "Failed");
      if (tp) results[scenario.name].throughput = tp;
    } catch (e) {
      console.error("Benchmark failed:", e);
    } finally {
      // 3. Stop Server
      console.log("Stopping servers...");
      for (const proc of serverProcs) {
        proc.kill();
      }

      // Force kill any remaining processes on port 3000 (Windows)
      if (process.platform === "win32") {
        try {
          // Find PID listening on port 3000
          const { stdout } = Bun.spawnSync([
            "cmd",
            "/c",
            "netstat -ano | findstr :3000 | findstr LISTENING",
          ]);
          const line = stdout.toString().trim();
          if (line) {
            const pid = line.split(/\s+/).pop();
            if (pid && pid !== "0") {
              console.log(`Force killing PID ${pid} on port 3000...`);
              Bun.spawnSync(["taskkill", "/F", "/PID", pid]);
            }
          }
        } catch {
          // ignore
        }
      }

      // Cool down
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const html = generateHtmlReport(results, WORKERS, SERVER_WORKERS);
  Bun.write(OUT_HTML, html);
  console.log(`\nReport generated: ${OUT_HTML}`);

  // Output summary JSON for CI extraction (strip timeSeries/rawLatencies)
  const summaryResults = Object.fromEntries(
    Object.entries(results).map(([k, v]) => [
      k,
      {
        meta: { name: v.meta.name, label: v.meta.label },
        connections: v.connections
          ? { rate: v.connections.rate, connected: v.connections.connected }
          : undefined,
        throughput: v.throughput
          ? {
              throughput: v.throughput.throughput,
              received: v.throughput.received,
            }
          : undefined,
        latency: v.latency
          ? {
              p50Ms: v.latency.p50Ms,
              p95Ms: v.latency.p95Ms,
              p99Ms: v.latency.p99Ms,
              avgMs: v.latency.avgMs,
            }
          : undefined,
      },
    ]),
  );
  console.log(`Results-JSON: ${JSON.stringify(summaryResults)}`);
}

main().catch(console.error);
