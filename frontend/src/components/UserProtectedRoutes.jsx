import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../pages/api/api";

const UserProtectedRoutes = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/api/auth/me"); // 👈 cookie sent automatically
        setIsAuth(true);
      } catch (error) {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <p>Loading...</p>;

  return isAuth ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default UserProtectedRoutes;
