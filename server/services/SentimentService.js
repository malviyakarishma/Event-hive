// services/SentimentService.js
const Sentiment = require('sentiment');
const natural = require('natural');
const { Reviews, Events } = require('../models');

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();
const tokenizer = new natural.WordTokenizer();

class SentimentService {
  /**
   * Analyzes text sentiment with enhanced accuracy
   * @param {string} text - The text to analyze
   * @returns {Object} Sentiment analysis result
   */
  static analyzeText(text) {
    // Basic sentiment analysis
    const result = sentimentAnalyzer.analyze(text);
    
    // Classify sentiment category
    let sentimentCategory = 'neutral';
    if (result.score > 1) {
      sentimentCategory = 'positive';
    } else if (result.score < -1) {
      sentimentCategory = 'negative';
    }
    
    // Extract key terms (non-stopwords)
    const tokens = tokenizer.tokenize(text.toLowerCase());
    const stopwords = ['the', 'a', 'an', 'and', 'but', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'was', 'were', 'is', 'are'];
    const keyTerms = tokens.filter(token => 
      token.length > 3 && !stopwords.includes(token)
    );
    
    // Count term frequency
    const termFrequency = {};
    keyTerms.forEach(term => {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    });
    
    // Get top terms
    const topTerms = Object.entries(termFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
    
    return {
      score: result.score,
      comparative: result.comparative,
      sentiment: sentimentCategory,
      topTerms,
      positive: result.positive,
      negative: result.negative
    };
  }
  
  /**
   * Analyze all reviews for an event and generate insights
   * @param {number} eventId - The event ID
   * @returns {Object} Sentiment analysis and insights for the event
   */
  static async analyzeEventReviews(eventId) {
    try {
      // Get event details
      const event = await Events.findByPk(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get all reviews for this event
      const reviews = await Reviews.findAll({
        where: { EventId: eventId }
      });
      
      if (reviews.length === 0) {
        return {
          event: event.title,
          insights: ["Not enough reviews to generate meaningful insights."],
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          averageRating: 0,
          reviewCount: 0
        };
      }
      
      // Analyze each review
      const analyzedReviews = reviews.map(review => {
        const analysis = this.analyzeText(review.review_text);
        return {
          id: review.id,
          text: review.review_text,
          rating: review.rating,
          sentiment: analysis.sentiment,
          score: analysis.score,
          topTerms: analysis.topTerms
        };
      });
      
      // Calculate sentiment breakdown
      const sentimentCounts = analyzedReviews.reduce((counts, review) => {
        counts[review.sentiment] = (counts[review.sentiment] || 0) + 1;
        return counts;
      }, { positive: 0, neutral: 0, negative: 0 });
      
      // Calculate percentages
      const totalReviews = analyzedReviews.length;
      const sentimentBreakdown = {
        positive: Math.round((sentimentCounts.positive / totalReviews) * 100),
        neutral: Math.round((sentimentCounts.neutral / totalReviews) * 100),
        negative: Math.round((sentimentCounts.negative / totalReviews) * 100)
      };
      
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;
      
      // Extract all terms from all reviews for topic modeling
      const allTerms = analyzedReviews.flatMap(review => review.topTerms);
      const termFrequency = {};
      allTerms.forEach(term => {
        termFrequency[term] = (termFrequency[term] || 0) + 1;
      });
      
      // Get top topics
      const topTopics = Object.entries(termFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term, count]) => ({ term, count }));
      
      // Generate insights
      const insights = this.generateInsights(
        event.title,
        averageRating,
        sentimentBreakdown,
        topTopics,
        analyzedReviews
      );
      
      return {
        event: event.title,
        insights,
        sentimentBreakdown,
        averageRating,
        reviewCount: totalReviews,
        topTopics
      };
    } catch (error) {
      console.error('Error analyzing event reviews:', error);
      throw error;
    }
  }
  
  /**
   * Generate human-readable insights from analysis data
   */
  static generateInsights(eventTitle, averageRating, sentimentBreakdown, topTopics, analyzedReviews) {
    const insights = [];
    
    // Rating insight
    insights.push(`Average rating for ${eventTitle} is ${averageRating.toFixed(1)} out of 5 stars.`);
    
    // Sentiment insight
    insights.push(`${sentimentBreakdown.positive}% of reviews express positive sentiment, while ${sentimentBreakdown.negative}% express negative sentiment.`);
    
    // Top topics insight
    if (topTopics.length > 0) {
      insights.push(`Most frequently mentioned aspects: ${topTopics.slice(0, 5).map(t => t.term).join(', ')}.`);
    }
    
    // High/low rated aspects
    const positiveReviews = analyzedReviews.filter(r => r.sentiment === 'positive');
    const negativeReviews = analyzedReviews.filter(r => r.sentiment === 'negative');
    
    if (positiveReviews.length > 0) {
      const positiveTerms = positiveReviews.flatMap(r => r.topTerms).slice(0, 3);
      if (positiveTerms.length > 0) {
        insights.push(`Attendees particularly enjoyed aspects related to: ${positiveTerms.join(', ')}.`);
      }
    }
    
    if (negativeReviews.length > 0) {
      const negativeTerms = negativeReviews.flatMap(r => r.topTerms).slice(0, 3);
      if (negativeTerms.length > 0) {
        insights.push(`Areas for improvement include: ${negativeTerms.join(', ')}.`);
      }
    }
    
    // Recommendation based on sentiment
    if (sentimentBreakdown.positive > 70) {
      insights.push(`This event is performing exceptionally well. Consider organizing similar events in the future.`);
    } else if (sentimentBreakdown.negative > 30) {
      insights.push(`This event may need significant improvements before repeating it.`);
    } else {
      insights.push(`This event is performing adequately. Consider addressing common concerns in future iterations.`);
    }
    
    return insights;
  }
}

module.exports = SentimentService;