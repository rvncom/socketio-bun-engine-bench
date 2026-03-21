import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT) || 3000;

const engine = new Engine({
  path: "/socket.io/",
  pingInterval: 25000,
  pingTimeout: 20000,
});

const io = new Server();
io.bind(engine);

io.on("connection", (socket) => {
  socket.on("echo", (data, cb) => {
    if (typeof cb === "function") {
      cb(data);
    } else {
      socket.emit("echo", data);
    }
  });

  socket.on("broadcast", (data) => {
    io.emit("broadcast", data);
  });
});

const server = Bun.serve({
  port: PORT,
  ...engine.handler(),
});

console.log(
  `[@socket.io/bun-engine] Benchmark server running on port ${server.port} (PID ${process.pid})`,
);
