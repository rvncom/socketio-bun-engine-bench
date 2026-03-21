import ws from "k6/ws";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";

const latency = new Trend("ws_rtt_ms");
const messages = new Counter("ws_messages_sent");

export const options = {
  stages: [
    { duration: "15s", target: 100 },
    { duration: "15s", target: 1000 },
    { duration: "15s", target: 5000 },
    { duration: "30s", target: 5000 }, // sustained
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    ws_rtt_ms: ["p(95)<100"],
  },
};

const URL = __ENV.SERVER_URL || "ws://localhost:3000";

export default function () {
  const url = `${URL}/socket.io/?EIO=4&transport=websocket`;

  const res = ws.connect(url, null, function (socket) {
    let handshakeReceived = false;

    socket.on("open", () => {});

    socket.on("message", (data) => {
      if (!handshakeReceived) {
        handshakeReceived = true;
        return;
      }

      // Respond to pings
      if (data === "2") {
        socket.send("3");
        return;
      }
    });

    // Send messages for the duration of the VU iteration
    socket.setInterval(() => {
      if (!handshakeReceived) return;

      const start = Date.now();
      socket.send("4ping");

      socket.on("message", function handler(data) {
        if (data.startsWith("4")) {
          latency.add(Date.now() - start);
          messages.add(1);
        }
      });
    }, 100);

    socket.setTimeout(() => {
      socket.close();
    }, 5000);
  });

  check(res, {
    "status is 101": (r) => r && r.status === 101,
  });
}
