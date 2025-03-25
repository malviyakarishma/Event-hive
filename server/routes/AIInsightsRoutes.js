// routes/AIInsightsRoutes.js
const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/AuthMiddleware');
const SentimentService = require('../services/SentimentService');
const RecommendationService = require('../services/RecommendationService');
const { Events, Reviews, EventAnalytics, Users } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

/**
 * Get AI-powered insights for a specific event
 * Accessible by any user
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get event details with review data
    const event = await Events.findByPk(eventId, {
      include: [
        {
          model: Reviews,
          attributes: ['id', 'review_text', 'rating', 'sentiment', 'username', 'createdAt'],
        }
      ],
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get sentiment analysis and insights
    const insights = await SentimentService.analyzeEventReviews(eventId);
    
    // Return insights data
    res.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        category: event.category,
        location: event.location
      },
      insights: insights.insights,
      sentimentBreakdown: insights.sentimentBreakdown,
      averageRating: insights.averageRating,
      reviewCount: insights.reviewCount,
      topTopics: insights.topTopics || []
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

/**
 * Compare AI insights across multiple events
 * Admin only endpoint
 */
router.get('/compare', validateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { eventIds } = req.query;
    
    if (!eventIds) {
      return res.status(400).json({ error: 'Event IDs are required' });
    }
    
    const idList = eventIds.split(',').map(id => parseInt(id.trim(), 10));
    
    // Validate IDs
    if (idList.some(id => isNaN(id))) {
      return res.status(400).json({ error: 'Invalid event ID format' });
    }
    
    // Get insights for each event
    const insights = [];
    for (const id of idList) {
      try {
        const eventInsights = await SentimentService.analyzeEventReviews(id);
        insights.push(eventInsights);
      } catch (error) {
        console.error(`Error analyzing event ${id}:`, error);
        // Skip events with errors
      }
    }
    
    res.json({
      comparisonData: insights,
      comparisonSummary: generateComparisonSummary(insights)
    });
  } catch (error) {
    console.error('Error comparing AI insights:', error);
    res.status(500).json({ error: 'Failed to compare AI insights' });
  }
});

/**
 * Get personalized event recommendations for a user
 * Requires authentication
 */
router.get('/recommendations', validateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's interests (from request query or user profile)
    const { interests = '' } = req.query;
    const interestsArray = interests.split(',').map(i => i.trim().toLowerCase());
    
    // Get user's previous reviews/ratings
    const userReviews = await Reviews.findAll({
      where: { UserId: userId },
      include: [{ model: Events }]
    });
    
    // Get recommendations using the service
    const recommendations = await RecommendationService.getPersonalizedRecommendations(
      userId,
      interestsArray,
      userReviews
    );
    
    res.json({
      recommendations,
      explanation: 'These events are recommended based on your preferences, past reviews, and events similar to ones you enjoyed.'
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get personalized recommendations' });
  }
});

/**
 * Get trend analysis across all events (admin only)
 */
router.get('/trends', validateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Time range filter (default to last 6 months)
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months, 10));
    
    // Get review data with timestamps
    const reviews = await Reviews.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      include: [{ model: Events }],
      order: [['createdAt', 'ASC']]
    });
    
    // Process data for trend analysis
    const trends = processTrendData(reviews);
    
    res.json({
      periodMonths: parseInt(months, 10),
      trends
    });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({ error: 'Failed to analyze trends' });
  }
});

/**
 * Process trend data from reviews
 */
function processTrendData(reviews) {
  // Group reviews by month
  const reviewsByMonth = {};
  
  reviews.forEach(review => {
    const date = new Date(review.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!reviewsByMonth[monthKey]) {
      reviewsByMonth[monthKey] = [];
    }
    
    reviewsByMonth[monthKey].push(review);
  });
  
  // Calculate metrics for each month
  const trendData = [];
  
  Object.entries(reviewsByMonth).forEach(([month, monthReviews]) => {
    const totalRating = monthReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / monthReviews.length;
    
    const sentimentCounts = monthReviews.reduce((counts, r) => {
      counts[r.sentiment] = (counts[r.sentiment] || 0) + 1;
      return counts;
    }, { positive: 0, neutral: 0, negative: 0 });
    
    trendData.push({
      month,
      reviewCount: monthReviews.length,
      averageRating: avgRating,
      sentimentCounts
    });
  });
  
  // Sort by month
  trendData.sort((a, b) => a.month.localeCompare(b.month));
  
  return trendData;
}

/**
 * Generate a summary of the comparison data
 */
function generateComparisonSummary(insights) {
  if (insights.length === 0) {
    return { message: 'No events to compare' };
  }
  
  const averageRatings = insights.map(i => ({
    event: i.event,
    rating: i.averageRating
  }));
  
  const bestRated = averageRatings.reduce((best, current) => 
    current.rating > best.rating ? current : best
  , { event: '', rating: 0 });
  
  const worstRated = averageRatings.reduce((worst, current) => 
    current.rating < worst.rating ? current : worst
  , { event: '', rating: 5 });
  
  // Check if all events have sentiment data
  const allHaveSentiment = insights.every(i => i.sentimentBreakdown);
  
  let mostPositive = { event: '', score: 0 };
  let mostNegative = { event: '', score: 0 };
  
  if (allHaveSentiment) {
    mostPositive = insights.reduce((best, current) => 
      (current.sentimentBreakdown?.positive || 0) > best.score 
        ? { event: current.event, score: current.sentimentBreakdown.positive } 
        : best
    , { event: '', score: 0 });
    
    mostNegative = insights.reduce((worst, current) => 
      (current.sentimentBreakdown?.negative || 0) > worst.score 
        ? { event: current.event, score: current.sentimentBreakdown.negative } 
        : worst
    , { event: '', score: 0 });
  }
  
  return {
    comparedEvents: insights.length,
    bestRated,
    worstRated,
    mostPositive: allHaveSentiment ? mostPositive : null,
    mostNegative: allHaveSentiment ? mostNegative : null,
    averageRatingAcrossEvents: averageRatings.reduce((sum, curr) => sum + curr.rating, 0) / insights.length
  };
}

module.exports = router;