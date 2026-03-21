/**
 * Benchmark: Round-trip latency
 *
 * Opens N connections, sends messages sequentially on each,
 * measures individual round-trip times and calculates percentiles.
 */

const CLIENTS = Number(process.env.CLIENTS) || 10;
const SAMPLES = Number(process.env.SAMPLES) || 200;
const URL = process.env.SERVER_URL || "ws://localhost:3000";
const WS_URL = `${URL}/socket.io/?EIO=4&transport=websocket`;

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function connectAndWaitHandshake(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      const data = event.data as string;
      if (data.startsWith("0")) {
        ws.send("40");
      } else if (data.startsWith("40")) {
        resolve(ws);
      }
    };
    ws.onerror = () => reject(new Error("Connection failed"));
    setTimeout(() => reject(new Error("Connection timeout")), 5000);
  });
}

async function measureLatency(
  ws: WebSocket,
  samples: number,
  onSample?: (latency: number) => void,
): Promise<number[]> {
  const latencies: number[] = [];

  for (let i = 0; i < samples; i++) {
    const rtt = await new Promise<number>((resolve) => {
      const start = performance.now();

      ws.onmessage = (event) => {
        const data = event.data as string;
        if (data === "2") {
          // Respond to ping, keep waiting
          ws.send("3");
          return;
        }
        if (data.startsWith('42["echo"')) {
          resolve(performance.now() - start);
        }
      };

      ws.send(`42["echo","ping-${i}"]`);
    });

    latencies.push(rtt);
    if (onSample) onSample(rtt);
  }

  return latencies;
}

async function run() {
  const sockets = await Promise.all(
    Array.from({ length: CLIENTS }, () => connectAndWaitHandshake()),
  );

  const allLatencies: number[] = [];
  const timeSeries: { timestamp: number; latency: number }[] = [];
  const start = performance.now();

  // Measure all clients in parallel — each client sends sequentially on its own socket
  const perClient = await Promise.all(
    sockets.map((ws) => {
      const clientTs: { timestamp: number; latency: number }[] = [];
      return measureLatency(ws, SAMPLES, (l) => {
        clientTs.push({
          timestamp: Math.round(performance.now() - start),
          latency: +l.toFixed(2),
        });
      }).then((latencies) => ({ latencies, clientTs }));
    }),
  );

  for (const { latencies, clientTs } of perClient) {
    allLatencies.push(...latencies);
    timeSeries.push(...clientTs);
  }
  timeSeries.sort((a, b) => a.timestamp - b.timestamp);

  allLatencies.sort((a, b) => a - b);

  const avg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
  const p50 = percentile(allLatencies, 50);
  const p95 = percentile(allLatencies, 95);
  const p99 = percentile(allLatencies, 99);
  const min = allLatencies[0]!;
  const max = allLatencies[allLatencies.length - 1]!;

  for (const ws of sockets) ws.close();

  return {
    clients: CLIENTS,
    samples: allLatencies.length,
    minMs: +min.toFixed(2),
    avgMs: +avg.toFixed(2),
    p50Ms: +p50.toFixed(2),
    p95Ms: +p95.toFixed(2),
    p99Ms: +p99.toFixed(2),
    maxMs: +max.toFixed(2),
    rawLatencies: allLatencies.map((l) => +l.toFixed(2)),
    timeSeries,
  };
}

const result = await run();
console.log(`Result: ${JSON.stringify(result)}`);
