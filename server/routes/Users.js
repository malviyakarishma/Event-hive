const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require("sequelize");
require("dotenv").config();
const { validateToken } = require("../middlewares/AuthMiddleware");

const SECRET_KEY = process.env.JWT_SECRET || "defaultsecret";

// Configure your email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
      error: true,
      message
  });
};


// Middleware to check if the user is an admin
const validateAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return sendError(res, 403, "Access denied. Admins only.");
    }
    next();
};

// Register a new user (Admin or Regular User)
router.post("/", async (req, res) => {
  try {
      console.log("Received Registration Request:", req.body);

      const { username, email, password, isAdmin } = req.body;

      // Check if username already exists
      const existingUser = await Users.findOne({ where: { username } });
      if (existingUser) {
          return sendError(res, 400, "Username already taken");
      }

      // Optional: Check if email already exists
      const existingEmail = await Users.findOne({ where: { email } });
      if (existingEmail) {
          return sendError(res, 400, "Email already in use");
      }

      // Password strength check
      if (password.length < 8) {
          return sendError(res, 400, "Password must be at least 8 characters long");
      }

      // Hash password before storing it
      const hash = await bcrypt.hash(password, 10);

      // Create new user in the database
      const newUser = await Users.create({ 
          username, 
          email,
          password: hash, 
          isAdmin: isAdmin || false 
      });

      console.log("New User Created:", newUser);
      return res.json({ message: "SUCCESS", user: newUser });
  } catch (error) {
      console.error("Registration Error Details:", error);
      return sendError(res, 500, `Registration failed: ${error.message}`);
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
      console.log("Login Request:", req.body);
      const { identifier, password } = req.body; // 'identifier' can be username or email

      // Find user by username OR email
      const user = await Users.findOne({
          where: {
              [Op.or]: [
                  { username: identifier },
                  { email: identifier }
              ]
          }
      });

      if (!user) {
          return sendError(res, 401, "User doesn't exist");
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
          return sendError(res, 401, "Please check your credentials");
      }

      // Generate JWT
      const accessToken = sign(
          { username: user.username, email:user.email,id: user.id, isAdmin: user.isAdmin },
          SECRET_KEY,
          { expiresIn: "1h" }
      );

      return res.json({
          token: accessToken,
          user: { id: user.id,email:user.email, username: user.username, isAdmin: user.isAdmin }
      });
  } catch (error) {
      console.error("Login error:", error);
      return sendError(res, 500, "Server error");
  }
});


// Auth route to get the authenticated user's details
router.get('/auth', validateToken, (req, res) => {
    res.json(req.user);
});

// Admin-only route
router.get('/admin', validateToken, validateAdmin, (req, res) => {
    res.json({ message: "Welcome Admin!", user: req.user });
});

// update Password - 
router.patch("/forgot-password", async (req, res) => {
  const { usernameOrEmail, newPassword } = req.body;

  if (!usernameOrEmail || !newPassword) {
    return res.status(400).json({ error: "Username/email and password are required." });
  }

  try {
    // Find user by username or email
    const user = await Users.findOne({
      where: {
        [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "An error occurred. Please try again." });
  }
});

module.exports = router;



module.exports = router;