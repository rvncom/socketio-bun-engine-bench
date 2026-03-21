import { Server } from "socket.io";
import { createServer } from "http";

const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/socket.io/",
  pingInterval: 25000,
  pingTimeout: 20000,
  transports: ["websocket", "polling"],
});

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

httpServer.listen(PORT, () => {
  console.log(
    `[node-ws] Benchmark server running on port ${PORT} (PID ${process.pid})`,
  );
});
