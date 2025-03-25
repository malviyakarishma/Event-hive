const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/AuthMiddleware");
const { Events, Reviews, Users } = require("../models");
const Sequelize = require("sequelize");
const { Op } = Sequelize;

/**
 * Get personalized recommendations for a user
 */
router.get("/", validateToken, async (req, res) => {
    try {
        // Extract userId and interests from query parameters
        const { userId, interests } = req.query;

        // Validate user ID from token middleware
        if (!req.user || !req.user.id) {
            return res.status(400).json({ 
                error: 'User ID is required',
                recommendations: [],
                explanation: 'Could not generate recommendations without a user ID'
            });
        }

        // Ensure the requested userId matches the token's userId
        const parsedUserId = parseInt(userId || req.user.id, 10);
        if (parsedUserId !== req.user.id) {
            return res.status(403).json({ 
                error: 'Unauthorized access',
                recommendations: [],
                explanation: 'User ID mismatch'
            });
        }

        // Convert interests to array if exists
        const interestArray = interests 
            ? (typeof interests === 'string' ? interests.split(',') : interests)
            : [];

        // Fetch user's previous reviews
        const userReviews = await Reviews.findAll({
            where: { UserId: parsedUserId },
            include: [{ model: Events }]
        });

        // If no reviews, rely on interests or popular events
        let recommendations = [];
        if (userReviews.length === 0) {
            recommendations = await getRecommendationsByInterests(parsedUserId, interestArray);
        } else {
            recommendations = await getCollaborativeFilteringRecommendations(
                parsedUserId, 
                userReviews,
                interestArray
            );
        }

        // Respond with recommendations
        res.json({
            recommendations,
            explanation: recommendations.length > 0 
                ? 'Personalized recommendations based on your profile and interests' 
                : 'No recommendations found at this time'
        });

    } catch (error) {
        console.error('Recommendations generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate recommendations',
            recommendations: [],
            explanation: 'An unexpected error occurred while generating recommendations'
        });
    }
});

// Helper function for collaborative filtering recommendations
async function getCollaborativeFilteringRecommendations(userId, userReviews, interests) {
    try {
        // Find highly rated events by the user
        const likedEventIds = userReviews
            .filter(review => review.rating >= 4)
            .map(review => review.EventId);

        // Get liked categories
        const likedCategories = new Set();
        userReviews
            .filter(review => review.rating >= 4 && review.Event?.category)
            .forEach(review => likedCategories.add(review.Event.category));

        // Find similar users based on liked events
        const similarUserReviews = await Reviews.findAll({
            where: {
                EventId: { [Op.in]: likedEventIds },
                rating: { [Op.gte]: 4 },
                UserId: { [Op.ne]: userId }
            },
            include: [{ model: Events }]
        });

        // Group recommendations by event
        const eventRecommendations = new Map();
        similarUserReviews.forEach(review => {
            if (review.Event) {
                const existing = eventRecommendations.get(review.EventId) || {
                    count: 0,
                    event: review.Event
                };
                eventRecommendations.set(review.EventId, {
                    count: existing.count + 1,
                    event: existing.event
                });
            }
        });

        // Convert to recommendations
        const recommendations = Array.from(eventRecommendations.entries())
            .filter(([_, { event }]) => {
                // Only future events
                return new Date(event.date) > new Date();
            })
            .map(([_, { count, event }]) => ({
                id: event.id,
                title: event.title,
                date: event.date,
                category: event.category,
                location: event.location,
                image: event.image,
                matchScore: Math.min(count * 20, 85), // Max 85% match
                reason: 'People with similar tastes enjoyed this event'
            }));

        // If not enough recommendations, add interest-based recommendations
        if (recommendations.length < 5 && interests && interests.length) {
            const interestRecs = await getRecommendationsByInterests(userId, interests);
            recommendations.push(...interestRecs);
        }

        return recommendations.slice(0, 10);
    } catch (error) {
        console.error('Collaborative filtering error:', error);
        return [];
    }
}

// Helper function for interest-based recommendations
async function getRecommendationsByInterests(userId, interests = []) {
    try {
        // If no interests, get popular events
        if (!interests || interests.length === 0) {
            return await getPopularEvents(userId);
        }

        // Find events matching interests
        const events = await Events.findAll({
            where: {
                [Op.or]: interests.map(interest => ({
                    [Op.or]: [
                        { category: { [Op.like]: `%${interest}%` } },
                        { title: { [Op.like]: `%${interest}%` } },
                        { description: { [Op.like]: `%${interest}%` } }
                    ]
                })),
                date: { [Op.gte]: new Date() }
            },
            limit: 10
        });

        // Get user's past reviews to exclude reviewed events
        const userReviews = await Reviews.findAll({
            where: { UserId: userId },
            attributes: ['EventId']
        });
        const reviewedEventIds = userReviews.map(r => r.EventId);

        return events
            .filter(event => !reviewedEventIds.includes(event.id))
            .map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                category: event.category,
                location: event.location,
                image: event.image,
                matchScore: 70, // Base score for interest match
                reason: 'Matches your interests'
            }));
    } catch (error) {
        console.error('Interest-based recommendations error:', error);
        return [];
    }
}

// Helper function for popular events
async function getPopularEvents(userId) {
    try {
        // Find most highly-rated upcoming events
        const popularEvents = await Events.findAll({
            include: [{
                model: Reviews,
                attributes: []
            }],
            attributes: [
                'id', 'title', 'date', 'category', 'location', 'image',
                [Sequelize.fn('AVG', Sequelize.col('Reviews.rating')), 'avgRating'],
                [Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), 'reviewCount']
            ],
            where: {
                date: { [Op.gte]: new Date() }
            },
            group: ['Events.id'],
            having: Sequelize.literal('COUNT(Reviews.id) > 0'),
            order: [[Sequelize.literal('avgRating'), 'DESC']],
            limit: 10
        });

        // Get user's past reviews
        const userReviews = await Reviews.findAll({
            where: { UserId: userId },
            attributes: ['EventId']
        });
        const reviewedEventIds = userReviews.map(r => r.EventId);

        return popularEvents
            .filter(event => !reviewedEventIds.includes(event.id))
            .map(event => {
                const avgRating = event.getDataValue('avgRating') || 4;
                const reviewCount = event.getDataValue('reviewCount') || 0;

                // Calculate match score
                const normalizedRating = ((avgRating - 1) / 4) * 100;
                const popularityBonus = Math.min(reviewCount * 2, 20);
                const matchScore = Math.min(Math.round(normalizedRating + popularityBonus), 100);

                return {
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    category: event.category,
                    location: event.location,
                    image: event.image,
                    matchScore,
                    reason: 'Popular highly-rated event'
                };
            });
    } catch (error) {
        console.error('Popular events error:', error);
        return [];
    }
}

module.exports = router;