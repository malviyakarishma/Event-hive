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

// Forgot Password - Request Reset Link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email (using username field since that's your email field)
    const user = await Users.findOne({ where: { username: email } });
    
    if (!user) {
      // For security reasons, always return success even if email doesn't exist
      return res.json({ message: "If your email exists in our system, you will receive a reset link shortly." });
    }
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour from now
    
    // Store the token in the database
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    // Send email
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.json({ message: "If your email exists in our system, you will receive a reset link shortly." });
  } catch (error) {
    console.error("Password reset request error:", error);
    return sendError(res, 500, "Error processing password reset request");
  }
});

// Reset Password - Verify token and update password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    
    // Find user with the reset token that hasn't expired
    const user = await Users.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });
    
    if (!user) {
      return sendError(res, 400, "Password reset token is invalid or has expired");
    }
    
    // Password strength check
    if (password.length < 8) {
      return sendError(res, 400, "Password must be at least 8 characters long");
    }
    
    // Update the user's password
    const hash = await bcrypt.hash(password, 10);
    
    await user.update({
      password: hash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
    
    // Send confirmation email
    const mailOptions = {
      to: user.username, // Assuming username is the email
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      subject: 'Your password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.username} has just been changed.\n`
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.json({ message: "Password has been updated successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return sendError(res, 500, "Error resetting password");
  }
});

module.exports = router;