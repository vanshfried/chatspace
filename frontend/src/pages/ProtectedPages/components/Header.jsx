import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Header.module.css";

const Header = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await API.post("/api/auth/logout"); // cookie sent automatically
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.title}>
        <h1>My Protected App</h1>
      </Link>

      <nav>
        <Link to="/chats" className={styles.link}>
          Chats
        </Link>
        <Link to="/settings" className={styles.link}>
          Settings
        </Link>
      </nav>

      <button className={styles.logoutBtn} onClick={logout}>
        Logout
      </button>
    </header>
  );
};

export default Header;
