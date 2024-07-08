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
const mongoose=require('mongoose')
mongoose.connect(`${process.env.MONGO_URL}`).then(()=>{
  console.log(
  "connected succesffully"
)}).catch((err)=>{
console.log(err.message)
})
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: 'https://chatchat-two.vercel.app', // Allow your frontend's origin
  credentials: true // Allow cookies to be sent
}));

app.get('/', (req, res) => {
  res.send('API is working');
});

app.use('/api/user', userRoute);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoute);

app.use(notFound);
app.use(errorHandler);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://chatchat-two.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
app.options('*', cors({
  origin: 'https://chatchat-two.vercel.app',
  credentials: true
}));

const PORT = process.env.PORT || 4000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

const io = require('socket.io')(server, {
  pingTimeout: 100000,
  cors: {
    origin: "https://chatchat-two.vercel.app/",
    credentials: true
  },
  maxHttpBufferSize: 1e8 // Increase the buffer size (default is 1MB, this sets it to 100MB)
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
