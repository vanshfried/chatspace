import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// helper to send cookie
const sendToken = (res, user, statusCode = 200) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      secure: true, // ✅ REQUIRED on Render (HTTPS)
      sameSite: "none", // ✅ REQUIRED for Vercel ↔ Render
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: {
        id: user._id,
        username: user.username,
      },
    });
};

/**
 * SIGN UP
 */
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
    });

    sendToken(res, user, 201);
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
});

/**
 * SIGN IN
 */
router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    sendToken(res, user);
  } catch (error) {
    res.status(500).json({ message: "Signin failed" });
  }
});

/**
 * LOGOUT
 */
router.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({ message: "Logged out successfully" });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
