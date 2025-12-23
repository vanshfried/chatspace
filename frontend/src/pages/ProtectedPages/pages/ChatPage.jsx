import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useSocket } from "../../hooks/useSocket";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import styles from "../css/ChatPage.module.css";

const ChatPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChat, setShowNewChat] = useState(false);

  const socket = useSocket(user?.id);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get("/api/auth/me");
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
        navigate("/signin");
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data } = await API.get("/api/chat/conversations");
        setConversations(data);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };
    fetchConversations();
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for user status changes
    socket.on("user:status", ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status === "online") {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for new messages
    socket.on("message:receive", (message) => {
      // Update conversation list
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === message.conversationId
            ? { ...conv, lastMessage: message, updatedAt: new Date() }
            : conv
        )
      );
    });

    return () => {
      socket.off("user:status");
      socket.off("message:receive");
    };
  }, [socket]);

  const logout = async () => {
    try {
      await API.post("/api/auth/logout");
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    if (socket) {
      socket.emit("join:conversation", conversation._id);
    }
  };

  const handleNewConversation = (conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    setSelectedConversation(conversation);
    setShowNewChat(false);
  };

  if (!user) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.chatPageContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.username[0].toUpperCase()}
            </div>
            <span className={styles.username}>{user.username}</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              onClick={() => setShowNewChat(!showNewChat)}
              title="New Chat"
            >
              ➕
            </button>
            <button
              className={styles.iconButton}
              onClick={logout}
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelect={handleConversationSelect}
          onlineUsers={onlineUsers}
          currentUserId={user.id}
        />
      </div>

      {/* Chat Window */}
      <div className={styles.mainContent}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={user}
            socket={socket}
            onlineUsers={onlineUsers}
          />
        ) : (
          <div className={styles.emptyState}>
            <h2>Welcome to Chat!</h2>
            <p>Select a conversation or start a new chat</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreateConversation={handleNewConversation}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};

// New Chat Modal Component
const NewChatModal = ({ onClose, onCreateConversation, currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.get(`/api/chat/users/search?query=${query}`);
      setUsers(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (userId) => {
    try {
      const { data } = await API.post("/api/chat/conversations", {
        participantId: userId,
      });
      onCreateConversation(data);
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>New Chat</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          autoFocus
        />
        <div className={styles.userList}>
          {loading ? (
            <div className={styles.loading}>Searching...</div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div
                key={user._id}
                className={styles.userItem}
                onClick={() => handleCreateConversation(user._id)}
              >
                <div className={styles.avatar}>
                  {user.username[0].toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
            ))
          ) : searchQuery ? (
            <div className={styles.emptyState}>No users found</div>
          ) : (
            <div className={styles.emptyState}>Start typing to search</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
