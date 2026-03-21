#!/usr/bin/env node

/**
 * Extracts relative benchmark metrics and generates markdown for README.
 *
 * Usage:
 *   node scripts/extract-relative.mjs \
 *     --input results.json \
 *     --version 1.0.7 \
 *     --report-url https://rvncom.github.io/socket-engine-bun-bench/reports/report-v1.0.7.html \
 *     --output-markdown readme-snippet.md \
 *     --output-json relative-metrics.json
 */

import { readFileSync, writeFileSync } from "node:fs";

function parseArgs(args) {
  const map = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      map[args[i].slice(2)] = args[++i];
    }
  }
  return map;
}

function fmt(n) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtMs(n) {
  return n < 1 ? n.toFixed(2) : n < 10 ? n.toFixed(1) : Math.round(n).toString();
}

function ratioLabel(ratio, higherIsBetter) {
  if (higherIsBetter) {
    if (ratio >= 1.05) return `**${ratio.toFixed(1)}x** faster`;
    if (ratio <= 0.95) return `**${Math.round((1 - ratio) * 100)}%** slower`;
    return "~same";
  }
  // Lower is better (latency)
  if (ratio <= 0.95) return `**${Math.round((1 - ratio) * 100)}%** lower`;
  if (ratio >= 1.05) return `**${Math.round((ratio - 1) * 100)}%** higher`;
  return "~same";
}

const opts = parseArgs(process.argv.slice(2));

if (!opts.input) {
  console.error("Usage: --input <file> --version <ver> --report-url <url> --output-markdown <file> --output-json <file>");
  process.exit(1);
}

const results = JSON.parse(readFileSync(opts.input, "utf-8"));
const ours = results["bun-native"];
const upstream = results["bun-socketio-engine"];

if (!ours || !upstream) {
  console.error("Missing bun-native or bun-socketio-engine in results");
  process.exit(1);
}

const version = opts.version || "unknown";
const reportUrl = opts["report-url"] || "#";

// Compute ratios
const metrics = {
  throughput: {
    ours: ours.throughput?.throughput ?? 0,
    upstream: upstream.throughput?.throughput ?? 0,
  },
  connections: {
    ours: ours.connections?.rate ?? 0,
    upstream: upstream.connections?.rate ?? 0,
  },
  latencyP95: {
    ours: ours.latency?.p95Ms ?? 0,
    upstream: upstream.latency?.p95Ms ?? 0,
  },
};

const ratios = {
  throughput: metrics.throughput.upstream > 0 ? metrics.throughput.ours / metrics.throughput.upstream : 0,
  connections: metrics.connections.upstream > 0 ? metrics.connections.ours / metrics.connections.upstream : 0,
  latencyP95: metrics.latencyP95.upstream > 0 ? metrics.latencyP95.ours / metrics.latencyP95.upstream : 0,
};

// Generate markdown
const rows = [
  `| Throughput | ${ratioLabel(ratios.throughput, true)} | ${fmt(metrics.throughput.ours)} msg/s | ${fmt(metrics.throughput.upstream)} msg/s |`,
  `| Connections | ${ratioLabel(ratios.connections, true)} | ${fmt(metrics.connections.ours)} conn/s | ${fmt(metrics.connections.upstream)} conn/s |`,
  `| Latency (p95) | ${ratioLabel(ratios.latencyP95, false)} | ${fmtMs(metrics.latencyP95.ours)} ms | ${fmtMs(metrics.latencyP95.upstream)} ms |`,
];

const markdown = `> Benchmarked on GitHub Actions (\`ubuntu-latest\`), v${version} vs \`@socket.io/bun-engine\`. [Full report](${reportUrl}).

| Metric | vs upstream | @rvncom | @socket.io |
|--------|------------|---------|------------|
${rows.join("\n")}`;

if (opts["output-markdown"]) {
  writeFileSync(opts["output-markdown"], markdown + "\n");
  console.log(`Wrote ${opts["output-markdown"]}`);
}

const jsonOutput = {
  version,
  date: new Date().toISOString().split("T")[0],
  ratios,
  absolute: {
    "bun-native": {
      throughput: metrics.throughput.ours,
      connections: metrics.connections.ours,
      latencyP95: metrics.latencyP95.ours,
    },
    "bun-socketio-engine": {
      throughput: metrics.throughput.upstream,
      connections: metrics.connections.upstream,
      latencyP95: metrics.latencyP95.upstream,
    },
  },
};

if (opts["output-json"]) {
  writeFileSync(opts["output-json"], JSON.stringify(jsonOutput, null, 2) + "\n");
  console.log(`Wrote ${opts["output-json"]}`);
}

// Always print markdown to stdout for debugging
console.log("\n--- Generated Markdown ---");
console.log(markdown);
