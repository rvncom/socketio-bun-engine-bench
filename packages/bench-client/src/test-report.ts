import path from "path";
import fs from "fs";
import { generateHtmlReport } from "./html-report";
import type { BenchmarkResult } from "./types";

const SCENARIOS = [
  { name: "node-ws", label: "Node.js (ws)", color: "rgba(54, 162, 235, 0.7)" },
  {
    name: "node-uws",
    label: "Node.js (uWebSockets.js)",
    color: "rgba(255, 99, 132, 0.7)",
  },
  { name: "bun-ws", label: "Bun (ws)", color: "rgba(255, 206, 86, 0.7)" },
  {
    name: "bun-socketio-engine",
    label: "Bun (@socket.io/bun-engine)",
    color: "rgba(153, 102, 255, 0.7)",
  },
  {
    name: "bun-native",
    label: "Bun (@rvncom/socket-bun-engine)",
    color: "rgba(75, 192, 192, 0.7)",
  },
];

function generateTimeSeries(
  count: number,
  base: number,
  jitter: number,
  metric: string,
) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: i * 500, // Every 500ms
    [metric]:
      base +
      (Math.random() - 0.5) * jitter +
      (metric === "throughput" ? i * 50 : 0),
  }));
}

const results: Record<string, BenchmarkResult> = {};

SCENARIOS.forEach((s, idx) => {
  const isRvn = s.name === "bun-native";
  const multiplier = isRvn ? 1.5 : 1.0;

  results[s.name] = {
    meta: s,
    connections: {
      target: 2000,
      connected: 2000,
      failed: 0,
      elapsedMs: 500 / multiplier,
      rate: 4000 * multiplier,
      timeSeries: generateTimeSeries(10, 200 * idx, 50, "connections"),
    },
    throughput: {
      clients: 200,
      messagesPerClient: 500,
      received: 100000,
      elapsedMs: 1000 / multiplier,
      throughput: 100000 * multiplier,
      timeSeries: generateTimeSeries(20, 5000, 1000, "throughput"),
    },
    latency: {
      clients: 1,
      samples: 100,
      minMs: 0.05 / multiplier,
      avgMs: 0.1 / multiplier,
      p50Ms: 0.1 / multiplier,
      p95Ms: 0.2 / multiplier,
      p99Ms: 0.3 / multiplier,
      maxMs: 0.5 / multiplier,
      timeSeries: generateTimeSeries(50, 0.2 / multiplier, 0.05, "latency"),
    },
  };
});

const report = generateHtmlReport(results, 4, 1);
const date = new Date().toISOString().split("T")[0];
const resultsDir = path.resolve(import.meta.dirname, "../../../results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

let counter = 1;
let filename = `test-report-${date}-${counter}.html`;
while (fs.existsSync(path.join(resultsDir, filename))) {
  counter++;
  filename = `test-report-${date}-${counter}.html`;
}
const outPath = path.join(resultsDir, filename);

fs.writeFileSync(outPath, report);
console.log(`\n--- Test Report Generated ---`);
console.log(`Output: ${outPath}\n`);
