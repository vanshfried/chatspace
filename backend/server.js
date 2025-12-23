import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

/* ---------- SOCKET.IO SETUP ---------- */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Make io accessible in routes
app.set("io", io);

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

/* ---------- SOCKET.IO LOGIC ---------- */
const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // User comes online
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;

    // Broadcast to all users that this user is online
    io.emit("user:status", {
      userId,
      status: "online",
    });

    console.log(`👤 User ${userId} is online`);
  });

  // Join a conversation room
  socket.on("join:conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(
      `💬 User ${socket.userId} joined conversation ${conversationId}`
    );
  });

  // Leave a conversation room
  socket.on("leave:conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`🚪 User ${socket.userId} left conversation ${conversationId}`);
  });

  // Send message (real-time broadcast)
  socket.on("message:send", (data) => {
    // Broadcast to all users in the conversation room
    io.to(data.conversationId).emit("message:receive", data);
    console.log(`📨 Message sent to conversation ${data.conversationId}`);
  });

  // Typing indicator - start
  socket.on("typing:start", (data) => {
    socket.to(data.conversationId).emit("typing:update", {
      userId: socket.userId,
      username: data.username,
      isTyping: true,
    });
  });

  // Typing indicator - stop
  socket.on("typing:stop", (data) => {
    socket.to(data.conversationId).emit("typing:update", {
      userId: socket.userId,
      isTyping: false,
    });
  });

  // Mark message as read
  socket.on("message:read", (data) => {
    socket.to(data.conversationId).emit("message:read:update", {
      messageId: data.messageId,
      userId: socket.userId,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      // Broadcast to all users that this user is offline
      io.emit("user:status", {
        userId: socket.userId,
        status: "offline",
      });

      console.log(`❌ User ${socket.userId} disconnected`);
    }
  });
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export io for use in routes if needed
export { io };
