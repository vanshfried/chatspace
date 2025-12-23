// routes/chat.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
const router = express.Router();

// Get all conversations for logged-in user
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate("participants", "username")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Create or get conversation
router.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const { participantId } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
      isGroup: false,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
      });
    }

    await conversation.populate("participants", "username");
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

// Get messages for a conversation
router.get("/conversations/:id/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
    })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Send a message
router.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const message = await Message.create({
      conversationId,
      sender: req.user.id,
      content,
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    await message.populate("sender", "username");
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Search users
router.get("/users/search", authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: req.user.id },
    }).select("username");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;
