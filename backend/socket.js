const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const createSocketServer = (server, origin) => {
  const io = new Server(server, {
    pingTimeout: 100000,
    cors: { origin, credentials: true },
    maxHttpBufferSize: 1e8,
  });

  io.use((socket, next) => {
    try {
      const { id, scope } = jwt.verify(socket.handshake.auth?.token, process.env.SECRET);
      if (scope !== "socket") throw new Error("wrong token type");
      socket.data.userId = id;
      next();
    } catch (error) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // the room comes from the verified token, never from what the client says
    socket.join(socket.data.userId);

    socket.on("joinchat", (room) => {
      if (typeof room !== "string") return;
      socket.join(room);
    });

    socket.on("typing", (room) => {
      socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
      socket.in(room).emit("stop typing");
    });

  });

  return io;
};

const emitToUsers = (io, userIds, event, data) => {
  const rooms = userIds.map(String);
  // io.to([]) would broadcast to every connected socket
  if (!rooms.length) return;
  // plain json, socket.io doesn't understand mongoose documents
  io.to(rooms).emit(event, JSON.parse(JSON.stringify(data)));
};

module.exports = { createSocketServer, emitToUsers };
