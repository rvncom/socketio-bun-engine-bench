import ws from "k6/ws";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";

const latency = new Trend("ws_rtt_ms");
const messages = new Counter("ws_messages_sent");

export const options = {
  stages: [
    { duration: "10s", target: 100 }, // warm up
    { duration: "30s", target: 100 }, // steady
    { duration: "5s", target: 3000 }, // spike
    { duration: "15s", target: 3000 }, // hold spike
    { duration: "5s", target: 100 }, // recover
    { duration: "20s", target: 100 }, // verify stability
    { duration: "5s", target: 0 }, // ramp down
  ],
  thresholds: {
    ws_rtt_ms: ["p(99)<500"],
  },
};

const URL = __ENV.SERVER_URL || "ws://localhost:3000";

export default function () {
  const url = `${URL}/socket.io/?EIO=4&transport=websocket`;

  const res = ws.connect(url, null, function (socket) {
    let handshakeReceived = false;

    socket.on("message", (data) => {
      if (!handshakeReceived) {
        handshakeReceived = true;
        return;
      }
      if (data === "2") {
        socket.send("3");
        return;
      }
    });

    socket.setInterval(() => {
      if (!handshakeReceived) return;
      const start = Date.now();
      socket.send("4echo");
      socket.on("message", function handler(data) {
        if (data.startsWith("4")) {
          latency.add(Date.now() - start);
          messages.add(1);
        }
      });
    }, 200);

    socket.setTimeout(() => {
      socket.close();
    }, 8000);
  });

  check(res, {
    "status is 101": (r) => r && r.status === 101,
  });
}
