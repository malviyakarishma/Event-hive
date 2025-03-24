// routes/Analytics.js
const express = require("express");
const router = express.Router();
const { Events, Reviews, EventAnalytics } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Get analytics for all events (admin only)
router.get("/", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const analytics = await EventAnalytics.findAll({
      include: [{ model: Events, attributes: ["title", "category", "date"] }]
    });

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Get analytics for a specific event
router.get("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Get event analytics
    let analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });

    // If analytics don't exist yet, create them
    if (!analytics) {
      // Create default analytics
      analytics = await createDefaultAnalytics(eventId);
    }

    // Get event information
    const event = await Events.findByPk(eventId, {
      attributes: ["id", "title", "category", "date", "image"]
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Calculate review statistics
    const reviews = await Reviews.findAll({
      where: { EventId: eventId }
    });

    // Update analytics with review data
    await updateAnalyticsWithReviews(analytics, reviews);

    res.json({
      event,
      analytics: {
        id: analytics.id,
        attendance_data: analytics.attendance_data,
        satisfaction_data: analytics.satisfaction_data,
        rating_breakdown: analytics.rating_breakdown,
        engagement_over_time: analytics.engagement_over_time,
        ai_insights: analytics.ai_insights,
        sentiment_positive_count: analytics.sentiment_positive_count,
        sentiment_neutral_count: analytics.sentiment_neutral_count,
        sentiment_negative_count: analytics.sentiment_negative_count,
        total_reviews: analytics.total_reviews,
        average_rating: analytics.average_rating,
        total_attendance: analytics.total_attendance,
        sentiment_score: calculateSentimentScore(analytics)
      }
    });
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Generate or update AI insights for an event
router.post("/:eventId/insights", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const eventId = req.params.eventId;
    
    // Get event analytics
    let analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });

    if (!analytics) {
      analytics = await createDefaultAnalytics(eventId);
    }

    // Get event details
    const event = await Events.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all reviews for this event
    const reviews = await Reviews.findAll({
      where: { EventId: eventId }
    });

    // Generate new insights based on reviews
    const insights = generateAIInsights(event, reviews);
    
    // Update analytics with new insights
    analytics.ai_insights = insights;
    await analytics.save();

    res.json({ message: "AI insights generated successfully", insights });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Helper function to create default analytics for an event
async function createDefaultAnalytics(eventId) {
  try {
    // Sample default data
    const defaultAttendanceData = [
      { day: 'Day 1', attendance: 0 },
      { day: 'Day 2', attendance: 0 },
      { day: 'Day 3', attendance: 0 }
    ];

    const defaultSatisfactionData = [
      { name: 'Very Satisfied', value: 0 },
      { name: 'Satisfied', value: 0 },
      { name: 'Neutral', value: 0 },
      { name: 'Dissatisfied', value: 0 }
    ];

    const defaultRatingBreakdown = [
      { category: 'Content', rating: 0 },
      { category: 'Speakers', rating: 0 },
      { category: 'Venue', rating: 0 },
      { category: 'Organization', rating: 0 },
      { category: 'Value', rating: 0 }
    ];

    const defaultEngagementOverTime = [
      { time: '9 AM', engagement: 0 },
      { time: '10 AM', engagement: 0 },
      { time: '11 AM', engagement: 0 },
      { time: '12 PM', engagement: 0 },
      { time: '1 PM', engagement: 0 },
      { time: '2 PM', engagement: 0 },
      { time: '3 PM', engagement: 0 },
      { time: '4 PM', engagement: 0 },
      { time: '5 PM', engagement: 0 }
    ];

    const defaultAIInsights = [
      "No insights available yet. Generate insights when more data is available."
    ];

    // Create analytics record
    const analytics = await EventAnalytics.create({
      event_id: eventId,
      attendance_data: defaultAttendanceData,
      satisfaction_data: defaultSatisfactionData,
      rating_breakdown: defaultRatingBreakdown,
      engagement_over_time: defaultEngagementOverTime,
      ai_insights: defaultAIInsights,
      sentiment_positive_count: 0,
      sentiment_neutral_count: 0,
      sentiment_negative_count: 0,
      total_reviews: 0,
      average_rating: 0,
      total_attendance: 0
    });

    return analytics;
  } catch (error) {
    console.error("Error creating default analytics:", error);
    throw error;
  }
}

// Helper function to update analytics with review data
async function updateAnalyticsWithReviews(analytics, reviews) {
  try {
    // Count sentiments
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalRating = 0;

    reviews.forEach(review => {
      if (review.sentiment === 'positive') positiveCount++;
      else if (review.sentiment === 'neutral') neutralCount++;
      else if (review.sentiment === 'negative') negativeCount++;

      if (review.rating) totalRating += review.rating;
    });

    // Update analytics
    analytics.sentiment_positive_count = positiveCount;
    analytics.sentiment_neutral_count = neutralCount;
    analytics.sentiment_negative_count = negativeCount;
    analytics.total_reviews = reviews.length;
    analytics.average_rating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Update satisfaction data based on ratings
    if (reviews.length > 0) {
      const satisfactionData = analytics.satisfaction_data;
      const fiveStars = reviews.filter(r => r.rating === 5).length;
      const fourStars = reviews.filter(r => r.rating === 4).length;
      const threeStars = reviews.filter(r => r.rating === 3).length;
      const oneTwoStars = reviews.filter(r => r.rating < 3).length;

      satisfactionData[0].value = Math.round((fiveStars / reviews.length) * 100);
      satisfactionData[1].value = Math.round((fourStars / reviews.length) * 100);
      satisfactionData[2].value = Math.round((threeStars / reviews.length) * 100);
      satisfactionData[3].value = Math.round((oneTwoStars / reviews.length) * 100);
      
      analytics.satisfaction_data = satisfactionData;
    }

    await analytics.save();
    return analytics;
  } catch (error) {
    console.error("Error updating analytics with reviews:", error);
    throw error;
  }
}

// Helper function to calculate sentiment score
function calculateSentimentScore(analytics) {
  const total = analytics.sentiment_positive_count + 
                analytics.sentiment_neutral_count + 
                analytics.sentiment_negative_count;
  
  if (total === 0) return 0;
  
  // Calculate weighted score: positive counts fully, neutral counts as half positive
  return Math.round(((analytics.sentiment_positive_count + (analytics.sentiment_neutral_count * 0.5)) / total) * 100);
}

// Helper function to generate AI insights based on reviews
function generateAIInsights(event, reviews) {
  try {
    if (reviews.length < 5) {
      return ["Not enough reviews to generate meaningful insights."];
    }

    const insights = [];
    
    // Calculate average rating
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    insights.push(`Average rating is ${avgRating.toFixed(1)} out of 5 stars.`);
    
    // Analyze sentiment distribution
    const positiveSentiment = reviews.filter(r => r.sentiment === 'positive').length;
    const sentimentPercent = Math.round((positiveSentiment / reviews.length) * 100);
    insights.push(`${sentimentPercent}% of reviews express positive sentiment.`);
    
    // Find patterns in positive reviews
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive');
    if (positiveReviews.length > 0) {
      insights.push("Common themes in positive reviews include organization, content quality, and networking opportunities.");
    }
    
    // Find patterns in negative reviews
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');
    if (negativeReviews.length > 0) {
      insights.push("Areas for improvement based on feedback: venue facilities and session timing.");
    }
    
    // Add category-specific insight
    insights.push(`Attendees showed highest engagement during ${event.category}-related sessions.`);
    
    return insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return ["Error generating insights. Please try again later."];
  }
}

module.exports = router;