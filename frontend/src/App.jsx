import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./pages/Openpages/pages/SignUp.jsx";
import SignIn from "./pages/Openpages/pages/SignIn.jsx";
import Homepage from "./pages/ProtectedPages/pages/Homepage.jsx";
import UserProtectedRoutes from "./components/UserProtectedRoutes.jsx";
import Header from "./pages/ProtectedPages/components/Header.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes (No Header here) */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Protected routes */}
        <Route element={<UserProtectedRoutes />}>
          {/* Option: Add Header here so it shows on ALL protected pages */}
          <Route 
            path="/" 
            element={
              <>
                <Header />
                <Homepage />
              </>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;