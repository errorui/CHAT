const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const userRoute = require('./backend/routes/userRoute');
const chatRoutes = require('./backend/routes/chatRoute');
const messageRoute = require('./backend/routes/messageRoutes');
const { notFound, errorHandler } = require('./backend/middleware/errorMiddleware');
const { Socket } = require('socket.io');

dotenv.config();
// comma separated list of frontends allowed to use the api
const origin = (process.env.CLIENT_URL || "https://chatchat-two.vercel.app")
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const missingEnv = ["MONGO_URL", "SECRET"].filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const mongoose=require('mongoose')
mongoose.connect(`${process.env.MONGO_URL}`).then(()=>{
  console.log(
  "connected succesffully"
)}).catch((err)=>{
console.error("MongoDB connection failed:", err.message)
process.exit(1)
})
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin:origin,
  credentials: true
}));
app.options('*', cors({
  origin:origin,
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('API is working');
});

// auth is a cookie, so other websites must not be able to make changes with it
const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
app.use('/api', (req, res, next) => {
  const from = req.headers.origin;
  if (from && !safeMethods.includes(req.method) && !origin.includes(from)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  next();
});

// responses are per user, so proxies and browsers must not store them
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});
app.use('/api/user', userRoute);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoute);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(
  PORT,
  () => console.log(`Server running on PORT ${PORT}...`)
);

const io = require('socket.io')(server, {
  pingTimeout: 100000,
  cors: {
    origin: origin,
    credentials: true
  },
  maxHttpBufferSize: 1e8 
});


io.on("connection", (socket) => {
  console.log("connected");

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on('joinchat', (room) => {
    socket.join(room);
    console.log("user joined the room " + room);
  });
  
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });
});