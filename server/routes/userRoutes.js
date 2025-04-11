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

//edit profile api
const bcrypt = require("bcrypt");

// Edit Profile - update only username and password
router.put("/edit-profile", validateToken, async (req, res) => {
    try {
        const { username, password, aboutMe } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "Invalid user data" });
        }

        // Ensure at least one field is provided
        if (!username && !password) {
            return res.status(400).json({ message: "Username or password is required to update" });
        }

        const user = await Users.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update username if provided
        if (username) {
            user.username = username;
        }
        if (aboutMe) user.aboutMe = aboutMe;

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



module.exports = router;


