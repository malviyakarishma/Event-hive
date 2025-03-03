const express = require("express");
const router = express.Router();
const { Reviews, Events, Users } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const Sentiment = require("sentiment");

/**
 * Admin Response to a Review
 */
router.put("/respond/:reviewId", validateToken, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: "Only administrators can respond to reviews" });
        }

        const { reviewId } = req.params;
        const { adminResponse } = req.body;

        if (!reviewId || !adminResponse.trim()) {
            return res.status(400).json({ error: "Review ID and admin response are required" });
        }

        const review = await Reviews.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        await Reviews.update({ admin_response: adminResponse }, { where: { id: reviewId } });

        // Log successful response
        console.log(`Review ID ${reviewId} updated with admin response.`);

        const updatedReview = await Reviews.findByPk(reviewId);
        return res.json({
            message: "Admin response added successfully.",
            response: updatedReview.admin_response,
        });
    } catch (error) {
        console.error("Error responding to review:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Fetch All Reviews for Admin Dashboard
 */
router.get("/", validateToken, async (req, res) => {
    try {
        if (!req.isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        const reviews = await Reviews.findAll({
            include: [{ model: Events, attributes: ["title"] }],
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json(reviews.map(review => ({
            id: review.id,
            review_text: review.review_text,
            rating: review.rating,
            username: review.username,
            sentiment: review.sentiment,
            admin_response: review.admin_response,
            event_name: review.Event ? review.Event.title : "Unknown Event",
            createdAt: review.createdAt,
        })));
    } catch (error) {
        console.error("Error fetching reviews:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Sentiment Analysis API (Standalone)
 */
router.post("/sentiment", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text.trim()) {
            return res.status(400).json({ error: "Text is required for sentiment analysis" });
        }

        const sentimentAnalyzer = new Sentiment();
        const result = sentimentAnalyzer.analyze(text);
        const sentimentCategory = result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";

        return res.json({ sentiment: sentimentCategory, score: result.score });
    } catch (error) {
        console.error("Error analyzing sentiment:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Post a New Review (with Sentiment)
 */
router.post("/", validateToken, async (req, res) => {
    try {
        const { review_text, rating, eventId } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;

        if (!userId || !username) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!review_text.trim() || !rating || !eventId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const existingReview = await Reviews.findOne({ where: { EventId: eventId, UserId: userId } });
        if (existingReview) {
            return res.status(400).json({ error: `You have already reviewed event ID ${eventId}.` });
        }

        // Perform Sentiment Analysis
        const sentimentAnalyzer = new Sentiment();
        const result = sentimentAnalyzer.analyze(review_text);
        const sentimentCategory = result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";

        const newReview = await Reviews.create({
            review_text,
            rating,
            EventId: eventId,
            UserId: userId,
            username,
            sentiment: sentimentCategory,
        });

        // Log successful review creation
        console.log(`New review created by user ${username} for event ID ${eventId}`);

        return res.status(201).json({
            message: "Review added successfully",
            review: {
                id: newReview.id,
                review_text,
                rating,
                eventId,
                username,
                sentiment: newReview.sentiment,
            },
        });
    } catch (error) {
        console.error("Error adding review:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get Event Details with Reviews
 */
router.get("/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Events.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            include: [{ model: Users, attributes: ["username"] }],
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ event, reviews });
    } catch (error) {
        console.error("Error fetching event details and reviews:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Delete a Review
 */
router.delete("/:reviewId", validateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        const userId = req.user?.id;
        if (isNaN(reviewId) || reviewId <= 0) {
            return res.status(400).json({ error: "Invalid review ID" });
        }
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const review = await Reviews.findOne({ where: { id: reviewId } });
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Ensure only the review owner or an admin can delete it
        if (req.isAdmin || review.UserId === userId) {
            await review.destroy();
            return res.status(200).json({ message: "Review deleted successfully" });
        } else {
            return res.status(403).json({ error: "You are not authorized to delete this review" });
        }
    } catch (error) {
        console.error("Error deleting review:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
