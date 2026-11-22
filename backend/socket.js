const { Server } = require("socket.io");

const createSocketServer = (server, origin) => {
  const io = new Server(server, {
    pingTimeout: 100000,
    cors: { origin, credentials: true },
    maxHttpBufferSize: 1e8,
  });

  io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
      if (typeof userData?._id !== "string") return;
      socket.join(userData._id);
      socket.emit("connected");
    });

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

    socket.on("message", (newMessageReceived) => {
      const chat = newMessageReceived?.chat;
      if (!Array.isArray(chat?.users)) return;

      chat.users.forEach((user) => {
        if (typeof user?._id !== "string" || user._id === newMessageReceived.sender?._id) return;
        socket.in(user._id).emit("message received", newMessageReceived);
      });
    });
  });

  return io;
};

module.exports = { createSocketServer };
