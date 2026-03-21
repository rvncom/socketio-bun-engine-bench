import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const pollLatency = new Trend("poll_rtt_ms");
const pollRequests = new Counter("poll_requests");

export const options = {
  stages: [
    { duration: "10s", target: 50 },
    { duration: "10s", target: 200 },
    { duration: "10s", target: 500 },
    { duration: "20s", target: 500 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    poll_rtt_ms: ["p(95)<200"],
  },
};

const BASE_URL = __ENV.SERVER_URL || "http://localhost:3000";

export default function () {
  // Handshake
  const handshakeRes = http.get(
    `${BASE_URL}/socket.io/?EIO=4&transport=polling`,
  );

  const ok = check(handshakeRes, {
    "handshake 200": (r) => r.status === 200,
    "has sid": (r) => r.body.includes('"sid"'),
  });

  if (!ok) return;

  const body = handshakeRes.body;
  const sidMatch = body.match(/"sid":"([^"]+)"/);
  if (!sidMatch) return;
  const sid = sidMatch[1];

  // Send/receive loop
  for (let i = 0; i < 5; i++) {
    // Send a message
    const pushRes = http.post(
      `${BASE_URL}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
      `4msg-${i}`,
    );

    check(pushRes, {
      "push 200": (r) => r.status === 200,
    });

    // Poll for response
    const start = Date.now();
    const pollRes = http.get(
      `${BASE_URL}/socket.io/?EIO=4&transport=polling&sid=${sid}`,
    );

    pollLatency.add(Date.now() - start);
    pollRequests.add(1);

    check(pollRes, {
      "poll 200": (r) => r.status === 200,
    });

    sleep(0.1);
  }

  // Close
  http.post(`${BASE_URL}/socket.io/?EIO=4&transport=polling&sid=${sid}`, "1");
}
