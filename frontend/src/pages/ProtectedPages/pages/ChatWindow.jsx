import { useState, useEffect, useRef } from "react";
import API from "../../api/api";
import styles from "../css/ChatWindow.module.css";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

const ChatWindow = ({ conversation, currentUser, socket, onlineUsers }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUser.id
  );
  const isOnline = onlineUsers.has(otherParticipant?._id);

  const decryptMessage = (encryptedMessage) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      console.error("Failed to decrypt message", err);
      return encryptedMessage;
    }
  };

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await API.get(
          `/api/chat/conversations/${conversation._id}/messages`
        );
        setMessages(data); // store encrypted content
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit("join:conversation", conversation._id);
    }

    return () => {
      if (socket) {
        socket.emit("leave:conversation", conversation._id);
      }
    };
  }, [conversation._id, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTypingUpdate = ({ userId, username, isTyping }) => {
      if (userId !== currentUser.id) {
        setTypingUser(isTyping ? username : null);
      }
    };

    socket.on("message:receive", handleMessageReceive);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.off("typing:update", handleTypingUpdate);
    };
  }, [socket, conversation._id, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit("typing:start", {
        conversationId: conversation._id,
        username: currentUser.username,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("typing:stop", { conversationId: conversation._id });
      }
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const encryptedMessage = CryptoJS.AES.encrypt(
      newMessage.trim(),
      SECRET_KEY
    ).toString();

    try {
      const { data } = await API.post("/api/chat/messages", {
        conversationId: conversation._id,
        content: encryptedMessage,
      });

      if (socket) {
        socket.emit("message:send", data);
        socket.emit("typing:stop", { conversationId: conversation._id });
      }

      // Store encrypted content; decrypt only when rendering
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={styles.chatWindow}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {otherParticipant?.username[0].toUpperCase()}
          </div>
          {isOnline && <div className={styles.onlineIndicator} />}
        </div>
        <div className={styles.headerInfo}>
          <h3>{otherParticipant?.username}</h3>
          <span className={styles.status}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <p>No messages yet</p>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const currentUserId = currentUser._id || currentUser.id;
            const isOwn = message.sender._id === currentUserId;

            return (
              <div
                key={message._id}
                className={`${styles.messageWrapper} ${
                  isOwn ? styles.own : styles.other
                }`}
              >
                <div className={styles.messageBubble}>
                  <div className={styles.messageContent}>
                    {decryptMessage(message.content)}
                  </div>
                  <div className={styles.messageTime}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUser && (
          <div className={styles.typingIndicator}>
            <span>{typingUser} is typing</span>
            <span className={styles.dots}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className={styles.messageInput} onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          className={styles.input}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim()}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
