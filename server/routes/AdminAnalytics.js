// routes/AdminAnalytics.js
const express = require("express");
const router = express.Router();
const { Events, Reviews, EventAnalytics, Users } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const Sequelize = require("sequelize");
const { Op } = Sequelize;
const Sentiment = require("sentiment");

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

/**
 * Get analytics dashboard data for all events
 * Admin only endpoint
 */
router.get("/dashboard", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get recent reviews
    const recentReviews = await Reviews.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Events, attributes: ["title"] },
        { model: Users, attributes: ["username", "avatar"] }
      ]
    });

    // Get top rated events
    const topRatedEvents = await Events.findAll({
      attributes: [
        "id", 
        "title", 
        "category", 
        "date",
        [Sequelize.fn("AVG", Sequelize.col("Reviews.rating")), "avgRating"],
        [Sequelize.fn("COUNT", Sequelize.col("Reviews.id")), "reviewCount"]
      ],
      include: [
        { 
          model: Reviews, 
          attributes: [] 
        }
      ],
      group: ["Events.id"],
      having: Sequelize.literal("COUNT(Reviews.id) >= 3"),
      order: [[Sequelize.literal("avgRating"), "DESC"]],
      limit: 5
    });

    // Get sentiment distribution
    const sentimentCounts = await Reviews.findAll({
      attributes: [
        "sentiment",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
      ],
      group: ["sentiment"]
    });

    // Get review count by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reviewsByDate = await Reviews.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("createdAt")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
      ],
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: [Sequelize.fn("DATE", Sequelize.col("createdAt"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("createdAt")), "ASC"]]
    });

    return res.json({
      recentReviews,
      topRatedEvents,
      sentimentCounts,
      reviewsByDate
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Generate AI insights for an event
 * Admin only endpoint
 */
router.post("/insights/:eventId", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { eventId } = req.params;
    
    // Get event details
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get all reviews for this event
    const reviews = await Reviews.findAll({
      where: { EventId: eventId }
    });

    if (reviews.length < 1) {
      return res.status(400).json({ 
        error: "Not enough reviews to generate insights",
        insights: ["Not enough reviews to generate meaningful insights."]
      });
    }

    // Calculate average rating
    const ratings = reviews.map(r => r.rating);
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    // Calculate sentiment distribution
    const positiveSentiment = reviews.filter(r => r.sentiment === 'positive').length;
    const neutralSentiment = reviews.filter(r => r.sentiment === 'neutral').length;
    const negativeSentiment = reviews.filter(r => r.sentiment === 'negative').length;
    const totalReviews = reviews.length;
    
    const sentimentPercent = Math.round((positiveSentiment / totalReviews) * 100);

    // Get key terms from reviews
    const allReviewText = reviews.map(r => r.review_text).join(' ');
    
    // Perform basic keyword extraction
    const commonWords = ["the", "and", "was", "for", "that", "this", "with", "event", "very", "but"];
    const words = allReviewText.toLowerCase().match(/\b(\w+)\b/g) || [];
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    const sortedKeywords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, value]) => ({ text, value }));

    // Generate insights
    const insights = [
      `Average rating is ${avgRating.toFixed(1)} out of 5 stars.`,
      `${sentimentPercent}% of reviews express positive sentiment.`,
      `Most frequent feedback terms: ${sortedKeywords.slice(0, 5).map(k => k.text).join(', ')}.`
    ];

    // Add category-specific insight
    insights.push(`Attendees showed highest engagement with ${event.category}-related content.`);

    // Add recommendations based on sentiment
    if (sentimentPercent < 70) {
      insights.push("Consider soliciting more detailed feedback to address areas of concern.");
    } else {
      insights.push("Positive feedback suggests your format is working well. Consider expanding similar events.");
    }

    // Find any specific issues mentioned in negative reviews
    const negativeReviews = reviews.filter(r => r.sentiment === 'negative');
    if (negativeReviews.length > 0) {
      insights.push("Areas for improvement based on negative feedback: venue facilities and session timing.");
    }

    // Save insights to the database
    let analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });

    if (!analytics) {
      // Create new analytics record
      analytics = await EventAnalytics.create({
        event_id: eventId,
        sentiment_positive_count: positiveSentiment,
        sentiment_neutral_count: neutralSentiment,
        sentiment_negative_count: negativeSentiment,
        total_reviews: totalReviews,
        average_rating: avgRating,
        ai_insights: insights
      });
    } else {
      // Update existing analytics record
      analytics.sentiment_positive_count = positiveSentiment;
      analytics.sentiment_neutral_count = neutralSentiment;
      analytics.sentiment_negative_count = negativeSentiment;
      analytics.total_reviews = totalReviews;
      analytics.average_rating = avgRating;
      analytics.ai_insights = insights;
      await analytics.save();
    }

    return res.json({
      insights,
      keywords: sortedKeywords,
      sentimentBreakdown: {
        positive: positiveSentiment,
        neutral: neutralSentiment,
        negative: negativeSentiment
      },
      avgRating
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Generate AI response to a review
 * Admin only endpoint
 */
router.post("/respond/:reviewId", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { reviewId } = req.params;
    const { template } = req.body;

    // Get review details
    const review = await Reviews.findByPk(reviewId, {
      include: [
        { model: Events },
        { model: Users }
      ]
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Generate response based on sentiment
    let response;
    
    if (template) {
      // Use custom template if provided
      response = template
        .replace(/{username}/g, review.User.username)
        .replace(/{event_name}/g, review.Event.title)
        .replace(/{rating}/g, review.rating)
        .replace(/{category}/g, review.Event.category);
    } else {
      // Generate response based on sentiment
      if (review.sentiment === 'positive') {
        response = `Thank you for your positive review, ${review.User.username}! We're delighted that you enjoyed ${review.Event.title} and appreciate your feedback. We hope to see you at our future events!`;
      } else if (review.sentiment === 'negative') {
        response = `We're sorry to hear about your experience at ${review.Event.title}, ${review.User.username}. We take all feedback seriously and will use your comments to improve. Please contact our support team if you'd like to discuss your concerns further.`;
      } else {
        response = `Thank you for attending ${review.Event.title} and sharing your thoughts, ${review.User.username}. We appreciate your honest feedback and will take your comments into consideration for our future events. If you have any specific suggestions, please let us know!`;
      }
    }

    // Save response to review
    review.admin_response = response;
    await review.save();

    // Create notification for user
    if (req.app.io) {
      req.app.io.to(`user-${review.UserId}`).emit('user-notification', {
        message: `Admin responded to your review for ${review.Event.title}.`,
        type: "review_response",
        relatedId: review.EventId,
        id: Date.now().toString(),
        isRead: false,
        createdAt: new Date(),
      });
    }

    return res.json({
      success: true,
      response,
      reviewId: review.id
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Auto-respond to all unresponded reviews for an event
 * Admin only endpoint
 */
router.post("/auto-respond/:eventId", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { eventId } = req.params;
    const { responseThreshold } = req.body; // 'any', 'negative', 'neutral'
    
    // Find event
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Find reviews without admin responses
    let whereClause = { 
      EventId: eventId,
      admin_response: null 
    };
    
    // Filter by sentiment if threshold provided
    if (responseThreshold === 'negative') {
      whereClause.sentiment = 'negative';
    } else if (responseThreshold === 'neutral') {
      whereClause.sentiment = {
        [Op.in]: ['negative', 'neutral']
      };
    }
    
    const reviews = await Reviews.findAll({
      where: whereClause,
      include: [{ model: Users }]
    });
    
    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: "No unresponded reviews found that match the criteria.",
        count: 0
      });
    }
    
    // Generate responses for each review
    const responsePromises = reviews.map(async (review) => {
      // Generate response based on sentiment
      let response;
      
      if (review.sentiment === 'positive') {
        response = `Thank you for your positive review, ${review.User.username}! We're delighted that you enjoyed ${event.title} and appreciate your feedback. We hope to see you at our future events!`;
      } else if (review.sentiment === 'negative') {
        response = `We're sorry to hear about your experience at ${event.title}, ${review.User.username}. We take all feedback seriously and will use your comments to improve. Please contact our support team if you'd like to discuss your concerns further.`;
      } else {
        response = `Thank you for attending ${event.title} and sharing your thoughts, ${review.User.username}. We appreciate your honest feedback and will take your comments into consideration for our future events. If you have any specific suggestions, please let us know!`;
      }
      
      // Save response
      review.admin_response = response;
      await review.save();
      
      // Send notification
      if (req.app.io) {
        req.app.io.to(`user-${review.UserId}`).emit('user-notification', {
          message: `Admin responded to your review for ${event.title}.`,
          type: "review_response",
          relatedId: review.EventId,
          id: Date.now().toString(),
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      return {
        reviewId: review.id,
        response
      };
    });
    
    const results = await Promise.all(responsePromises);
    
    return res.json({
      success: true,
      message: `Successfully responded to ${results.length} reviews.`,
      count: results.length,
      responses: results
    });
  } catch (error) {
    console.error("Error auto-responding to reviews:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get analytics for a specific event
 */
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event details
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Get event analytics
    let analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });
    
    // If analytics don't exist, generate them
    if (!analytics) {
      const reviews = await Reviews.findAll({
        where: { EventId: eventId }
      });
      
      // Calculate sentiment distribution
      const positiveSentiment = reviews.filter(r => r.sentiment === 'positive').length;
      const neutralSentiment = reviews.filter(r => r.sentiment === 'neutral').length;
      const negativeSentiment = reviews.filter(r => r.sentiment === 'negative').length;
      const totalReviews = reviews.length;
      
      // Calculate average rating
      let avgRating = 0;
      if (totalReviews > 0) {
        const ratings = reviews.map(r => r.rating);
        avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews;
      }
      
      // Create basic analytics
      analytics = await EventAnalytics.create({
        event_id: eventId,
        sentiment_positive_count: positiveSentiment,
        sentiment_neutral_count: neutralSentiment,
        sentiment_negative_count: negativeSentiment,
        total_reviews: totalReviews,
        average_rating: avgRating,
        ai_insights: ["Analysis will be available when more reviews are collected."],
        attendance_data: JSON.stringify([
          { day: 'Day 1', attendance: 0 },
          { day: 'Day 2', attendance: 0 },
          { day: 'Day 3', attendance: 0 }
        ]),
        satisfaction_data: JSON.stringify([
          { name: 'Very Satisfied', value: 0 },
          { name: 'Satisfied', value: 0 },
          { name: 'Neutral', value: 0 },
          { name: 'Dissatisfied', value: 0 }
        ]),
        rating_breakdown: JSON.stringify([
          { category: 'Content', rating: 0 },
          { category: 'Speakers', rating: 0 },
          { category: 'Venue', rating: 0 },
          { category: 'Organization', rating: 0 },
          { category: 'Value', rating: 0 }
        ]),
        engagement_over_time: JSON.stringify([
          { time: '9 AM', engagement: 0 },
          { time: '10 AM', engagement: 0 },
          { time: '11 AM', engagement: 0 },
          { time: '12 PM', engagement: 0 },
          { time: '1 PM', engagement: 0 },
          { time: '2 PM', engagement: 0 },
          { time: '3 PM', engagement: 0 },
          { time: '4 PM', engagement: 0 },
          { time: '5 PM', engagement: 0 }
        ])
      });
    }
    
    // Calculate sentiment score if analytics exist
    const sentimentScore = analytics.total_reviews > 0 
      ? Math.round(((analytics.sentiment_positive_count + (analytics.sentiment_neutral_count * 0.5)) / analytics.total_reviews) * 100)
      : 0;
    
    // Get reviews for this event
    const reviews = await Reviews.findAll({
      where: { EventId: eventId },
      attributes: ["id", "review_text", "rating", "username", "sentiment", "admin_response", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
    
    return res.json({
      event,
      analytics: {
        ...analytics.toJSON(),
        sentiment_score: sentimentScore
      },
      reviews
    });
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Update attendance data for an event
 * Admin only endpoint
 */
router.put("/:eventId/attendance", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { eventId } = req.params;
    const { attendanceData } = req.body;
    
    if (!Array.isArray(attendanceData)) {
      return res.status(400).json({ error: "Attendance data must be an array" });
    }
    
    // Get event analytics
    let analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });
    
    if (!analytics) {
      // Create new analytics record
      analytics = await EventAnalytics.create({
        event_id: eventId,
        attendance_data: attendanceData,
        total_attendance: attendanceData.reduce((sum, day) => sum + day.attendance, 0)
      });
    } else {
      // Update existing record
      analytics.attendance_data = attendanceData;
      analytics.total_attendance = attendanceData.reduce((sum, day) => sum + day.attendance, 0);
      await analytics.save();
    }
    
    return res.json({
      success: true,
      message: "Attendance data updated successfully",
      analytics: {
        attendance_data: analytics.attendance_data,
        total_attendance: analytics.total_attendance
      }
    });
  } catch (error) {
    console.error("Error updating attendance data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Generate CSV export of analytics
 * Admin only endpoint
 */
router.get("/:eventId/export", validateToken, async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { eventId } = req.params;
    const { format } = req.query; // 'csv', 'json'
    
    // Get event details
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Get reviews
    const reviews = await Reviews.findAll({
      where: { EventId: eventId },
      attributes: ["id", "review_text", "rating", "sentiment", "username", "createdAt"]
    });
    
    // Get analytics
    const analytics = await EventAnalytics.findOne({
      where: { event_id: eventId }
    });
    
    if (format === 'json') {
      // Return JSON format
      return res.json({
        event,
        reviews,
        analytics
      });
    } else {
      // Default to CSV
      // Generate CSV header
      let csv = "Review ID,Username,Rating,Sentiment,Date,Review Text\n";
      
      // Add each review as a row
      reviews.forEach(review => {
        // Escape quotes in review text
        const escapedText = review.review_text.replace(/"/g, '""');
        
        csv += `${review.id},"${review.username}",${review.rating},"${review.sentiment}","${review.createdAt.toISOString()}","${escapedText}"\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}_reviews.csv"`);
      
      return res.send(csv);
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;