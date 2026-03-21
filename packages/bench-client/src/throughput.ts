/**
 * Benchmark: Message throughput
 *
 * Opens N connections, each sends M messages. Server echoes them back.
 * Measures total messages/sec throughput.
 */

const CLIENTS = Number(process.env.CLIENTS) || 100;
const MESSAGES_PER_CLIENT = Number(process.env.MESSAGES) || 100;
const URL = process.env.SERVER_URL || "ws://localhost:3000";
const WS_URL = `${URL}/socket.io/?EIO=4&transport=websocket`;

async function connectAndWaitHandshake(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      const data = event.data as string;
      if (data.startsWith("0")) {
        // Engine.IO open, now send Socket.IO connect
        ws.send("40");
      } else if (data.startsWith("40")) {
        // Socket.IO connected
        resolve(ws);
      }
    };

    ws.onerror = () => reject(new Error("Connection failed"));

    setTimeout(() => reject(new Error("Connection timeout")), 5000);
  });
}

async function run() {
  // Connect all clients
  const sockets = await Promise.all(
    Array.from({ length: CLIENTS }, () => connectAndWaitHandshake()),
  );

  let received = 0;
  const totalExpected = CLIENTS * MESSAGES_PER_CLIENT;

  const done = new Promise<void>((resolve) => {
    for (const ws of sockets) {
      ws.onmessage = (event) => {
        const data = event.data as string;
        if (data === "2") {
          ws.send("3");
          return;
        } // Respond to ping
        if (!data.startsWith("42")) return; // Only count echo responses
        received++;
        if (received >= totalExpected) resolve();
      };
    }
  });

  const payload = '42["echo","' + "x".repeat(128) + '"]'; // Socket.IO event payload
  const start = performance.now();
  const timeSeries: { timestamp: number; throughput: number }[] = [];
  let prevReceived = 0;
  let prevTime = 0;

  const updateTimeSeries = () => {
    const now = performance.now() - start;
    const dt = now - prevTime;
    if (dt <= 0) return;
    const delta = received - prevReceived;
    // Instantaneous throughput: messages in this window, scaled to per-second
    const instantThroughput = Math.round((delta / dt) * 1000);
    prevReceived = received;
    prevTime = now;

    timeSeries.push({
      timestamp: Math.round(now),
      throughput: instantThroughput,
    });
  };

  const interval = setInterval(updateTimeSeries, 20);

  for (const ws of sockets) {
    for (let i = 0; i < MESSAGES_PER_CLIENT; i++) {
      ws.send(payload);
    }
  }

  // Wait for all echoes or timeout
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout waiting for echoes")), 30000),
  );

  try {
    await Promise.race([done, timeout]);
  } catch {
    // console.log(`Warning: Only received ${received}/${totalExpected} echoes`);
  }

  clearInterval(interval);
  updateTimeSeries();

  const elapsed = performance.now() - start;
  const throughput = Math.round((received / elapsed) * 1000);

  for (const ws of sockets) ws.close();

  return {
    clients: CLIENTS,
    messagesPerClient: MESSAGES_PER_CLIENT,
    received,
    elapsedMs: Math.round(elapsed),
    throughput,
    timeSeries,
  };
}

const result = await run();
console.log(`Result: ${JSON.stringify(result)}`);
