import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import styles from "../css/Homepage.module.css";
const Homepage = () => {
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
    <div className={styles.homepageContainer}>
      <h1>Welcome to the Homepage!</h1>
      <p>This is a protected page. You are successfully authenticated.</p>
    </div>
  );
};

export default Homepage;
