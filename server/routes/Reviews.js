const express = require("express");
const router = express.Router();
const { Reviews, Events, Users, Notifications } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const Sentiment = require("sentiment");

const sentimentAnalyzer = new Sentiment(); // Initialize once

/**
 * Admin Response to a Review
 */
router.put("/respond/:reviewId", validateToken, async (req, res) => {
    try {
        console.log("Admin status:", req.user.isAdmin);
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: "Only administrators can respond to reviews" });
        }

        const { reviewId } = req.params;
        const { adminResponse } = req.body;

        if (!reviewId || !adminResponse.trim()) {
            return res.status(400).json({ error: "Review ID and admin response are required" });
        }

        const review = await Reviews.findByPk(reviewId, {
            include: [{ model: Users }]
        });
        
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        const event = await Events.findByPk(review.EventId);
        const eventTitle = event ? event.title : "an event";

        review.admin_response = adminResponse;
        console.log("Updating review:", review.toJSON());
        await review.save();

        // Create a notification in the database if Notifications model exists
        if (Notifications && review.UserId) {
            try {
                const notification = await Notifications.create({
                    message: `Admin responded to your review of "${eventTitle}"`,
                    type: "review_response",
                    relatedId: review.EventId,
                    userId: review.UserId,
                    isRead: false,
                    isAdminNotification: false,
                });
                
                // Send real-time notification if Socket.IO is configured
                if (req.app.io && review.UserId) {
                    req.app.io.to(`user-${review.UserId}`).emit("user-notification", {
                        id: notification.id,
                        message: `Admin responded to your review of "${eventTitle}"`,
                        type: "review_response",
                        relatedId: review.EventId,
                        isRead: false,
                        createdAt: new Date(),
                    });
                    console.log(`Notification sent to user-${review.UserId}`);
                }
            } catch (notificationError) {
                // Log notification error but continue with the response
                console.error("Error sending notification:", notificationError);
            }
        }

        return res.json({
            message: "Admin response added successfully.",
            response: review.admin_response,
        });
    } catch (error) {
        console.error("Error responding to review:", error.stack);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

/**
 * Fetch All Reviews for Admin Dashboard
 */
router.get("/", validateToken, async (req, res) => {
    try {
        console.log("Admin status:", req.user.isAdmin);
        if (!req.user.isAdmin) {
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
        console.error("Error fetching reviews:", error.stack);
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

        const result = sentimentAnalyzer.analyze(text);
        const sentimentCategory = result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";

        return res.json({ sentiment: sentimentCategory, score: result.score });
    } catch (error) {
        console.error("Error analyzing sentiment:", error.stack);
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

        // Get event details for the notification
        const event = await Events.findByPk(eventId);
        const eventTitle = event ? event.title : "Unknown Event";

        // Perform Sentiment Analysis
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

        // Send admin notification for new review
        if (req.app.io) {
            req.app.io.to('admin-channel').emit('new-review', {
                reviewId: newReview.id,
                eventId: eventId,
                userName: username,
                rating: rating,
                productName: eventTitle
            });
            console.log('Admin notification sent for new review');
        }

        console.log(`New review created by user ${username} for event ID ${eventId}`);

        // Also create a notification entry in the database for all admins
        try {
            const admins = await Users.findAll({ where: { isAdmin: true } });
            
            for (const admin of admins) {
                await Notifications.create({
                    message: `New review (${rating}★) submitted by ${username} for "${eventTitle}"`,
                    type: "review",
                    relatedId: newReview.id,
                    userId: admin.id,
                    isAdminNotification: true,
                    isRead: false,
                    metadata: JSON.stringify({
                        reviewId: newReview.id,
                        eventId: eventId,
                        rating: rating,
                        productName: eventTitle
                    })
                });
            }
        } catch (notificationError) {
            console.error("Error creating admin notification record:", notificationError);
            // Continue with the response even if notification fails
        }

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
        console.error("Error adding review:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get Event Details with Reviews
 */
router.get("/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Events.findByPk(eventId, {
            include: {
                model: Reviews,
                include: [{ model: Users, attributes: ["username"] }],
                order: [["createdAt", "DESC"]],
            },
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        return res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event details and reviews:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get a specific review by ID (for admin responses)
 */
router.get("/details/:reviewId", validateToken, async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await Reviews.findByPk(reviewId, {
            include: [
                { model: Users, attributes: ["username"] },
                { model: Events, attributes: ["id", "title", "date", "image"] }
            ]
        });
        
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }
        
        return res.status(200).json(review);
    } catch (error) {
        console.error("Error fetching review details:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get pending reviews (no admin response)
 */
router.get("/pending/list", validateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }

        const pendingReviews = await Reviews.findAll({
            where: {
                admin_response: null
            },
            include: [
                { model: Events, attributes: ["id", "title", "date"] }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json(pendingReviews);
    } catch (error) {
        console.error("Error fetching pending reviews:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Delete a Review
 */
router.delete("/:reviewId", validateToken, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        
        if (isNaN(reviewId) || reviewId <= 0) {
            return res.status(400).json({ error: "Invalid review ID" });
        }
        
        const review = await Reviews.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Allow Admin or Review Owner to delete
        if (req.user.isAdmin || review.UserId === req.user.id) {
            await review.destroy();
            return res.status(200).json({ message: "Review deleted successfully" });
        } else {
            return res.status(403).json({ error: "You are not authorized to delete this review" });
        }
    } catch (error) {
        console.error("Error deleting review:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get reviews statistics for an event
 */
router.get("/stats/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const reviews = await Reviews.findAll({
            where: { EventId: eventId },
            attributes: ['rating', 'sentiment']
        });
        
        if (reviews.length === 0) {
            return res.status(200).json({
                totalReviews: 0,
                averageRating: 0,
                sentimentBreakdown: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                },
                ratingDistribution: {
                    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
                }
            });
        }
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        // Calculate sentiment breakdown
        const sentimentBreakdown = {
            positive: reviews.filter(r => r.sentiment === 'positive').length,
            neutral: reviews.filter(r => r.sentiment === 'neutral').length,
            negative: reviews.filter(r => r.sentiment === 'negative').length
        };
        
        // Calculate rating distribution
        const ratingDistribution = {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
        };
        
        reviews.forEach(review => {
            ratingDistribution[review.rating.toString()]++;
        });
        
        return res.status(200).json({
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating.toFixed(1)),
            sentimentBreakdown,
            ratingDistribution
        });
    } catch (error) {
        console.error("Error fetching review statistics:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * Get user reviews for profile
 */
router.get("/user/:userId", validateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Only allow users to access their own reviews or admins to access any
        if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const reviews = await Reviews.findAll({
            where: { UserId: userId },
            include: [
                { model: Events, attributes: ["id", "title", "date", "image"] }
            ],
            order: [["createdAt", "DESC"]]
        });
        
        return res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching user reviews:", error.stack);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;