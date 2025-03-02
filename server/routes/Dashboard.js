// In your routes file (e.g., dashboard.js)
const express = require("express");
const { Users, Events, Reviews } = require("../models"); // Assuming you have Sequelize models
const { validateToken } = require("../middleware/Middleware"); // Your authentication middleware

const router = express.Router();

// Fetch dashboard data, including events
router.get("/dashboard", validateToken, async (req, res) => {
    try {
        // Fetching all required data from SQL database using Sequelize models
        const [users, events, reviews] = await Promise.all([
            Users.findAll(), // Assuming a Users model exists
            Events.findAll(), // Assuming an Events model exists (fetch events from SQL)
            Reviews.findAll(), // Assuming a Reviews model exists
        ]);

        res.json({
            users,
            events,
            reviews,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

module.exports = router;
