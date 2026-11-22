const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatModel = require("./models/chatModel");
const { isValidId } = require("./utils/chatAccess");

const createSocketServer = (server, origin) => {
  const io = new Server(server, {
    pingTimeout: 100000,
    cors: { origin, credentials: true },

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

    socket.on("joinchat", async (room) => {
      try {
        if (!isValidId(room)) return;
        if (await chatModel.exists({ _id: room, users: socket.data.userId })) socket.join(room);
      } catch (error) {
        // nothing awaits this handler, a rejection here would kill the process
        console.error("joinchat failed:", error.message);
      }
    });

    socket.on("typing", (room) => {
      if (!socket.rooms.has(room)) return;
      socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
      if (!socket.rooms.has(room)) return;
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
