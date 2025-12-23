import styles from "../css/NotFound.module.css";
import {Link} from "react-router-dom";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Page Not Found</h2>
      <p className={styles.description}>
        The page you’re looking for doesn’t exist or has been moved.
      </p>

      <Link to="/" className={styles.button}>
        Go back home
      </Link>
    </div>
  );
}
