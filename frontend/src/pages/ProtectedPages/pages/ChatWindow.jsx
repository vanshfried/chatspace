import { useState, useEffect, useRef } from "react";
import API from "../../api/api";
import styles from "../css/ChatWindow.module.css";

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

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await API.get(
          `/api/chat/conversations/${conversation._id}/messages`
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
    
    // Join conversation room
    if (socket) {
      socket.emit("join:conversation", conversation._id);
    }

    return () => {
      // Leave conversation room on cleanup
      if (socket) {
        socket.emit("leave:conversation", conversation._id);
      }
    };
  }, [conversation._id, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleMessageReceive = (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    // Listen for typing updates
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

  // Auto-scroll to bottom
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

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("typing:stop", {
          conversationId: conversation._id,
        });
      }
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const { data } = await API.post("/api/chat/messages", {
        conversationId: conversation._id,
        content: newMessage.trim(),
      });

      // Emit through socket for real-time update
      if (socket) {
        socket.emit("message:send", data);
        socket.emit("typing:stop", {
          conversationId: conversation._id,
        });
      }

      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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
            const isOwn = message.sender._id === currentUser.id;

            return (
              <div
                key={message._id}
                className={`${styles.messageWrapper} ${
                  isOwn ? styles.own : styles.other
                }`}
              >
                <div className={styles.messageBubble}>
                  <div className={styles.messageContent}>
                    {message.content}
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