// backend (Express route)
const express = require("express");
const router = express.Router();
const { Users, Reviews, Events } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

// Get the logged-in user's profile and their reviews
router.get("/profile", validateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Invalid user data" });
        }

        const user = await Users.findOne({
            where: { id: req.user.id },
            attributes: ["id", "username", "isAdmin"],
            include: [
                {
                    model: Reviews,
                    attributes: ["id", "review_text", "rating", "sentiment", "admin_response", "createdAt"],
                    include: [
                        {
                            model: Events,
                            attributes: ["id", "title", "date"],
                        },
                    ],
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            reviews: user.Reviews.length ? user.Reviews.map((review) => ({
                id: review.id,
                text: review.review_text,
                rating: review.rating,
                sentiment: review.sentiment,
                adminResponse: review.admin_response,
                createdAt: review.createdAt,
                event: review.Event ? { id: review.Event.id, title: review.Event.title, date: review.Event.date } : null,
            })) : [],
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
