import styles from "../css/ChatPage.module.css";

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelect,
  onlineUsers,
  currentUserId,
}) => {
  if (!conversations.length) {
    return <div className={styles.emptyState}>No conversations yet</div>;
  }

  return (
    <div className={styles.conversationList}>
      {conversations.map((conv) => {
        // Find the other participant
        const otherUser = conv.participants.find(
          (p) => p._id !== currentUserId
        );

        const isOnline = onlineUsers.has(otherUser?._id);
        const isSelected = selectedConversation?._id === conv._id;

        return (
          <div
            key={conv._id}
            className={`${styles.conversationItem} ${
              isSelected ? styles.activeConversation : ""
            }`}
            onClick={() => onSelect(conv)}
          >
            <div className={styles.avatar}>
              {otherUser?.username?.[0]?.toUpperCase()}
              {isOnline && <span className={styles.onlineDot} />}
            </div>

            <div className={styles.conversationInfo}>
              <div className={styles.conversationName}>
                {otherUser?.username}
              </div>

              <div className={styles.lastMessage}>
                {conv.lastMessage?.text || "No messages yet"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
