/**
 * Benchmark: Maximum connections per second
 *
 * Opens N WebSocket connections as fast as possible and measures
 * the time to establish all of them.
 */

const TARGET = Number(process.env.CONNECTIONS) || 1000;
const URL = process.env.SERVER_URL || "ws://localhost:3000";
const WS_URL = `${URL}/socket.io/?EIO=4&transport=websocket`;

async function run() {
  const sockets: WebSocket[] = [];
  let connected = 0;
  let failed = 0;

  const start = performance.now();
  const timeSeries: { timestamp: number; connections: number }[] = [];

  const updateTimeSeries = () => {
    timeSeries.push({
      timestamp: Math.round(performance.now() - start),
      connections: connected,
    });
  };

  const interval = setInterval(updateTimeSeries, 20);

  const promises = Array.from({ length: TARGET }, () => {
    return new Promise<void>((resolve) => {
      let resolved = false;
      const ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        const data = event.data as string;
        if (data.startsWith("0")) {
          // Engine.IO open — send Socket.IO connect
          ws.send("40");
        } else if (data.startsWith("40") && !resolved) {
          // Socket.IO connected — handshake complete
          resolved = true;
          connected++;
          sockets.push(ws);
          resolve();
        }
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          failed++;
          resolve();
        }
      };

      // Timeout after 10s
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          failed++;
          ws.close();
          resolve();
        }
      }, 10000);
    });
  });

  await Promise.all(promises);
  clearInterval(interval);
  updateTimeSeries();

  const elapsed = performance.now() - start;
  const rate = Math.round((connected / elapsed) * 1000);

  // Cleanup
  for (const ws of sockets) {
    ws.close();
  }

  return {
    target: TARGET,
    connected,
    failed,
    elapsedMs: Math.round(elapsed),
    rate,
    timeSeries,
  };
}

const result = await run();
console.log(`Result: ${JSON.stringify(result)}`);
