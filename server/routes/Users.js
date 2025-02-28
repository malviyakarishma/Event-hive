const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
require("dotenv").config();
const { validateToken } = require("../middlewares/AuthMiddleware");

const SECRET_KEY = process.env.JWT_SECRET || "defaultsecret";

// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
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

        const { username, password, isAdmin } = req.body;

        // Check if user already exists
        const existingUser = await Users.findOne({ where: { username } });
        if (existingUser) {
            return sendError(res, 400, "Username already taken");
        }

        // Hash password before storing it
        const hash = await bcrypt.hash(password, 10);

        // Create new user in the database
        const newUser = await Users.create({ 
            username, 
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
        const { username, password } = req.body;

        const user = await Users.findOne({ where: { username } });

        if (!user) {
            return sendError(res, 401, "User doesn't exist");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return sendError(res, 401, "Wrong Username and Password Combination");
        }

        // Generate JWT with user role
        const accessToken = sign(
            { username: user.username, id: user.id, isAdmin: user.isAdmin }, 
            SECRET_KEY, 
            { expiresIn: "1h" }
        );

        return res.json({ 
            token: accessToken, 
            user: { id: user.id, username: user.username, isAdmin: user.isAdmin } 
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

module.exports = router;
