import uWS from "uWebSockets.js";

const PORT = Number(process.env.PORT) || 3000;

const app = uWS.App();

// Minimal Socket.IO protocol emulation
// 0: Open
// 2: Ping -> 3: Pong
// 40: Connect
// 42: Event

app.ws("/*", {
  compression: uWS.DISABLED,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 30, // 30 seconds

  open: (ws) => {
    // Send Engine.IO Open packet
    // 0{"sid":"...","upgrades":[],"pingInterval":25000,"pingTimeout":20000}
    const sid = Math.random().toString(36).substring(2, 15);
    const handshake = JSON.stringify({
      sid,
      upgrades: [],
      pingInterval: 25000,
      pingTimeout: 20000,
    });
    ws.send(`0${handshake}`);
  },

  message: (ws, message, _isBinary) => {
    const msg = Buffer.from(message).toString();

    // Note: "broadcast" event is not implemented in this minimal server,
    // but benchmarks currently only use "echo".

    if (msg === "2") {
      // Ping -> Pong
      ws.send("3");
    } else if (msg === "40") {
      // Connect -> Connected
      ws.send("40");
    } else if (msg.startsWith("42")) {
      // Event: 42["echo", ...]
      try {
        const payload = JSON.parse(msg.substring(2));
        if (Array.isArray(payload) && payload[0] === "echo") {
          // Echo back
          ws.send(msg);
        }
      } catch {
        // ignore malformed
      }
    }
  },

  drain: (_ws) => {
    // Backpressure handling if needed
  },

  close: (_ws, _code, _message) => {
    // cleanup
  },
});

app.listen(PORT, (token) => {
  if (token) {
    console.log(
      `[node-uws] Benchmark server running on port ${PORT} (PID ${process.pid})`,
    );
  } else {
    console.log(`[node-uws] Failed to listen to port ${PORT}`);
    process.exit(1);
  }
});
