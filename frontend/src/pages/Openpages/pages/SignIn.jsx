import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Install with: npm install lucide-react
import API from "../../api/api";
import styles from "../css/SignIn.module.css";

export default function SignIn() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false); // 1. New State
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/auth/signin", form);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Sign In</h2>

        <input
          className={styles.input}
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />

        {/* 2. Wrap input in a relative container for the icon */}
        <div className={styles.passwordWrapper}>
          <input
            className={styles.input}
            name="password"
            type={showPassword ? "text" : "password"} // 3. Dynamic type
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button className={styles.button} type="submit">
          Sign In
        </button>
        <a className={styles.link} href="/signup">
          Don't have an account? Sign Up
        </a>
      </form>
    </div>
  );
}