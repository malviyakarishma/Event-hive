const { Events, Reviews, Users } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

class RecommendationService {
  /**
   * Get personalized event recommendations for a user
   * @param {number} userId - User ID
   * @param {Array<string>} interests - User's interests
   * @returns {Promise<Array>} Recommended events
   */
  static async getPersonalizedRecommendations(userId, interests = []) {
    try {
      // Fetch user's past reviews
      const userReviews = await Reviews.findAll({
        where: { UserId: userId },
        include: [{ model: Events }]
      });

      // If no reviews, get recommendations by interests or popular events
      if (userReviews.length === 0) {
        return await this.getRecommendationsByInterests(userId, interests);
      }

      // Find highly rated events by the user
      const likedEventIds = userReviews
        .filter(review => review.rating >= 4)
        .map(review => review.EventId);

      // Get liked categories
      const likedCategories = new Set();
      userReviews
        .filter(review => review.rating >= 4 && review.Event?.category)
        .forEach(review => likedCategories.add(review.Event.category));

      // Combine recommendation strategies
      const recommendations = [
        ...(await this.getCollaborativeFilteringRecommendations(userId, likedEventIds)),
        ...(await this.getContentBasedRecommendations(userId, likedCategories, likedEventIds)),
        ...(await this.getRecommendationsByInterests(userId, interests))
      ];

      // Deduplicate and sort recommendations
      const uniqueRecs = Array.from(
        new Map(recommendations.map(r => [r.id, r]))
      ).map(([_, rec]) => rec);

      // Sort by match score
      return uniqueRecs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    } catch (error) {
      console.error('Error in personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on collaborative filtering
   */
  static async getCollaborativeFilteringRecommendations(userId, likedEventIds) {
    try {
      // Find similar users based on event ratings
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
      return Array.from(eventRecommendations.entries())
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
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on content similarity
   */
  static async getContentBasedRecommendations(userId, likedCategories, likedEventIds) {
    try {
      const categories = Array.from(likedCategories);
      
      if (categories.length === 0) return [];

      const similarEvents = await Events.findAll({
        where: {
          category: { [Op.in]: categories },
          id: { [Op.notIn]: likedEventIds },
          date: { [Op.gte]: new Date() }
        },
        limit: 10
      });

      return similarEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        category: event.category,
        location: event.location,
        image: event.image,
        matchScore: 75, // Base score for category match
        reason: 'Similar to categories you\'ve enjoyed'
      }));
    } catch (error) {
      console.error('Content-based recommendations error:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on user interests
   */
  static async getRecommendationsByInterests(userId, interests = []) {
    try {
      // If no interests, get popular events
      if (!interests || interests.length === 0) {
        return await this.getPopularEvents(userId);
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

  /**
   * Get popular events as fallback
   */
  static async getPopularEvents(userId) {
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
}

module.exports = RecommendationService;