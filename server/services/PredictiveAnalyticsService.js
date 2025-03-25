// services/PredictiveAnalyticsService.js - Enhanced version

class PredictiveAnalyticsService {
  /**
   * Predict expected attendance for an upcoming event with enhanced ML-based forecasting
   * @param {number} eventId - Event ID
   * @returns {Object} Predicted attendance and confidence
   */
  static async predictAttendance(eventId) {
    try {
      // Get event details
      const event = await Events.findByPk(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Find similar past events (by category, location, etc.)
      const similarEvents = await Events.findAll({
        where: {
          id: { [Op.ne]: eventId },
          category: event.category,
          date: { [Op.lt]: new Date() } // Past events only
        },
        include: [{ model: EventAnalytics }, { model: Reviews }]
      });
      
      if (similarEvents.length === 0) {
        // No similar events to base prediction on
        // Return a default prediction based on category averages
        return this.getDefaultAttendancePrediction(event.category);
      }
      
      // Calculate attendance metrics from similar events
      const attendanceData = similarEvents
        .filter(se => se.EventAnalytic && se.EventAnalytic.total_attendance > 0)
        .map(se => ({
          attendance: se.EventAnalytic.total_attendance,
          rating: se.Reviews.length > 0 
            ? se.Reviews.reduce((sum, r) => sum + r.rating, 0) / se.Reviews.length 
            : 0,
          reviewCount: se.Reviews.length,
          isWeekend: new Date(se.date).getDay() === 0 || new Date(se.date).getDay() === 6,
          isEvening: se.time && new Date(`2000-01-01T${se.time}`).getHours() >= 17,
          month: new Date(se.date).getMonth(),
          sentiment: this.calculateEventSentiment(se.Reviews)
        }));
      
      if (attendanceData.length === 0) {
        return this.getDefaultAttendancePrediction(event.category);
      }
      
      // Apply enhanced prediction algorithm that considers multiple factors
      const predictedAttendance = this.runAttendancePredictionModel(
        attendanceData, 
        {
          isWeekend: new Date(event.date).getDay() === 0 || new Date(event.date).getDay() === 6,
          isEvening: event.time && new Date(`2000-01-01T${event.time}`).getHours() >= 17,
          month: new Date(event.date).getMonth(),
          location: event.location
        }
      );
      
      // Calculate confidence level based on sample size and variance
      let confidenceLevel = 'medium';
      if (attendanceData.length >= 5) {
        confidenceLevel = 'high';
      } else if (attendanceData.length < 2) {
        confidenceLevel = 'low';
      }
      
      // Calculate potential attendance range for better planning
      const attendanceVariance = this.calculateVariance(attendanceData.map(d => d.attendance));
      const stdDev = Math.sqrt(attendanceVariance);
      const minAttendance = Math.max(0, Math.round(predictedAttendance - stdDev));
      const maxAttendance = Math.round(predictedAttendance + stdDev);
      
      return {
        predictedAttendance: Math.round(predictedAttendance),
        minAttendance,
        maxAttendance,
        confidenceLevel,
        similarEventsCount: attendanceData.length,
        influencingFactors: this.getAttendanceInfluencingFactors(attendanceData, event)
      };
    } catch (error) {
      console.error('Error predicting attendance:', error);
      throw error;
    }
  }
  
  /**
   * Calculate variance for attendance values
   */
  static calculateVariance(values) {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * Run the enhanced attendance prediction model
   */
  static runAttendancePredictionModel(attendanceData, eventFeatures) {
    // Base prediction on average attendance
    const baseAttendance = attendanceData.reduce((sum, data) => sum + data.attendance, 0) / attendanceData.length;
    
    // Apply adjustments based on various factors
    let adjustedAttendance = baseAttendance;
    
    // Weekend adjustment (weekends typically have different attendance patterns)
    const weekendEvents = attendanceData.filter(d => d.isWeekend);
    const weekdayEvents = attendanceData.filter(d => !d.isWeekend);
    
    if (weekendEvents.length > 0 && weekdayEvents.length > 0) {
      const weekendAvg = weekendEvents.reduce((sum, d) => sum + d.attendance, 0) / weekendEvents.length;
      const weekdayAvg = weekdayEvents.reduce((sum, d) => sum + d.attendance, 0) / weekdayEvents.length;
      
      if (eventFeatures.isWeekend) {
        adjustedAttendance = weekendAvg;
      } else {
        adjustedAttendance = weekdayAvg;
      }
    }
    
    // Time of day adjustment
    const eveningEvents = attendanceData.filter(d => d.isEvening);
    const dayEvents = attendanceData.filter(d => !d.isEvening);
    
    if (eveningEvents.length > 0 && dayEvents.length > 0) {
      const eveningFactor = (eveningEvents.reduce((sum, d) => sum + d.attendance, 0) / eveningEvents.length) / 
                           (dayEvents.reduce((sum, d) => sum + d.attendance, 0) / dayEvents.length);
      
      if (eventFeatures.isEvening) {
        adjustedAttendance *= eveningFactor;
      }
    }
    
    // Seasonal adjustment
    const monthlyAttendance = {};
    attendanceData.forEach(d => {
      if (!monthlyAttendance[d.month]) {
        monthlyAttendance[d.month] = [];
      }
      monthlyAttendance[d.month].push(d.attendance);
    });
    
    const monthAverages = {};
    Object.keys(monthlyAttendance).forEach(month => {
      monthAverages[month] = monthlyAttendance[month].reduce((sum, val) => sum + val, 0) / monthlyAttendance[month].length;
    });
    
    if (Object.keys(monthAverages).length > 1 && monthAverages[eventFeatures.month]) {
      const overallAvg = Object.values(monthAverages).reduce((sum, val) => sum + val, 0) / Object.values(monthAverages).length;
      const monthFactor = monthAverages[eventFeatures.month] / overallAvg;
      
      adjustedAttendance *= monthFactor;
    }
    
    // Location adjustment (if applicable)
    const locationFactor = this.getLocationFactor(eventFeatures.location);
    adjustedAttendance *= locationFactor;
    
    return adjustedAttendance;
  }
  
  /**
   * Identify factors that influence attendance for more explainable predictions
   */
  static getAttendanceInfluencingFactors(attendanceData, event) {
    const factors = [];
    
    // Check if weekend/weekday makes a difference
    const weekendEvents = attendanceData.filter(d => d.isWeekend);
    const weekdayEvents = attendanceData.filter(d => !d.isWeekend);
    
    if (weekendEvents.length > 0 && weekdayEvents.length > 0) {
      const weekendAvg = weekendEvents.reduce((sum, d) => sum + d.attendance, 0) / weekendEvents.length;
      const weekdayAvg = weekdayEvents.reduce((sum, d) => sum + d.attendance, 0) / weekdayEvents.length;
      
      const difference = ((Math.max(weekendAvg, weekdayAvg) / Math.min(weekendAvg, weekdayAvg)) - 1) * 100;
      
      if (difference > 10) {
        if (weekendAvg > weekdayAvg) {
          factors.push({
            factor: 'Weekend events',
            impact: 'positive',
            description: `Weekend events in this category have ${difference.toFixed(0)}% higher attendance than weekday events`
          });
        } else {
          factors.push({
            factor: 'Weekday events',
            impact: 'positive',
            description: `Weekday events in this category have ${difference.toFixed(0)}% higher attendance than weekend events`
          });
        }
      }
    }
    
    // Check if evening/day makes a difference
    const eveningEvents = attendanceData.filter(d => d.isEvening);
    const dayEvents = attendanceData.filter(d => !d.isEvening);
    
    if (eveningEvents.length > 0 && dayEvents.length > 0) {
      const eveningAvg = eveningEvents.reduce((sum, d) => sum + d.attendance, 0) / eveningEvents.length;
      const dayAvg = dayEvents.reduce((sum, d) => sum + d.attendance, 0) / dayEvents.length;
      
      const difference = ((Math.max(eveningAvg, dayAvg) / Math.min(eveningAvg, dayAvg)) - 1) * 100;
      
      if (difference > 10) {
        if (eveningAvg > dayAvg) {
          factors.push({
            factor: 'Evening timing',
            impact: 'positive',
            description: `Evening events in this category have ${difference.toFixed(0)}% higher attendance than daytime events`
          });
        } else {
          factors.push({
            factor: 'Daytime timing',
            impact: 'positive',
            description: `Daytime events in this category have ${difference.toFixed(0)}% higher attendance than evening events`
          });
        }
      }
    }
    
    // Check if rating has a correlation with attendance
    const highRatedEvents = attendanceData.filter(d => d.rating >= 4);
    const lowRatedEvents = attendanceData.filter(d => d.rating < 4 && d.rating > 0);
    
    if (highRatedEvents.length > 0 && lowRatedEvents.length > 0) {
      const highRatedAvg = highRatedEvents.reduce((sum, d) => sum + d.attendance, 0) / highRatedEvents.length;
      const lowRatedAvg = lowRatedEvents.reduce((sum, d) => sum + d.attendance, 0) / lowRatedEvents.length;
      
      if (highRatedAvg > lowRatedAvg * 1.2) {
        factors.push({
          factor: 'Event rating',
          impact: 'strong positive',
          description: 'Higher-rated events consistently show better attendance in future editions'
        });
      }
    }
    
    // Check if location is influential
    if (this.getLocationFactor(event.location) > 1.1) {
      factors.push({
        factor: 'Location popularity',
        impact: 'positive',
        description: `${event.location} is a popular location that tends to increase attendance`
      });
    } else if (this.getLocationFactor(event.location) < 0.9) {
      factors.push({
        factor: 'Location accessibility',
        impact: 'negative',
        description: 'This location has historically shown lower attendance numbers'
      });
    }
    
    // Check seasonality impact
    const monthFactor = this.getSeasonalFactor(new Date(event.date));
    if (monthFactor > 1.1) {
      factors.push({
        factor: 'Seasonal timing',
        impact: 'positive',
        description: `${this.getMonthName(new Date(event.date).getMonth())} is a favorable month for this type of event`
      });
    } else if (monthFactor < 0.9) {
      factors.push({
        factor: 'Seasonal timing',
        impact: 'negative',
        description: `${this.getMonthName(new Date(event.date).getMonth())} historically shows lower attendance for similar events`
      });
    }
    
    return factors;
  }
  
  /**
   * Helper method to get month name
   */
  static getMonthName(monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  }
  
  /**
   * Calculate overall sentiment for an event based on its reviews
   */
  static calculateEventSentiment(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    const positive = reviews.filter(r => r.sentiment === 'positive').length;
    const neutral = reviews.filter(r => r.sentiment === 'neutral').length;
    const negative = reviews.filter(r => r.sentiment === 'negative').length;
    
    // Calculate weighted score: 100 for positive, 50 for neutral, 0 for negative
    return (positive * 100 + neutral * 50) / (positive + neutral + negative);
  }
  
  /**
   * Predict expected sentiment for a future event
   * @param {number} eventId - Event ID
   * @returns {Object} Predicted sentiment distribution and insights
   */
  static async predictSentiment(eventId) {
    try {
      // Get event details
      const event = await Events.findByPk(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Find similar past events
      const similarEvents = await Events.findAll({
        where: {
          id: { [Op.ne]: eventId },
          category: event.category,
          date: { [Op.lt]: new Date() } // Past events only
        },
        include: [{ model: Reviews }]
      });
      
      if (similarEvents.length === 0) {
        // No similar events to base prediction on
        return this.getDefaultSentimentPrediction();
      }
      
      // Calculate average sentiment distribution
      let totalPositive = 0;
      let totalNeutral = 0;
      let totalNegative = 0;
      let totalReviews = 0;
      let eventsWithReviews = 0;
      
      similarEvents.forEach(se => {
        if (se.Reviews && se.Reviews.length > 0) {
          const positive = se.Reviews.filter(r => r.sentiment === 'positive').length;
          const neutral = se.Reviews.filter(r => r.sentiment === 'neutral').length;
          const negative = se.Reviews.filter(r => r.sentiment === 'negative').length;
          
          totalPositive += positive;
          totalNeutral += neutral;
          totalNegative += negative;
          totalReviews += se.Reviews.length;
          eventsWithReviews++;
        }
      });
      
      if (eventsWithReviews === 0) {
        return this.getDefaultSentimentPrediction();
      }
      
      // Calculate percentages
      const totalSentiments = totalPositive + totalNeutral + totalNegative;
      
      if (totalSentiments === 0) {
        return this.getDefaultSentimentPrediction();
      }
      
      // Base prediction on historical data
      const positivePct = Math.round((totalPositive / totalSentiments) * 100);
      const neutralPct = Math.round((totalNeutral / totalSentiments) * 100);
      const negativePct = 100 - positivePct - neutralPct;
      
      // Apply risk adjustment based on venue and time
      const adjustedPrediction = this.adjustSentimentPrediction(
        { positive: positivePct, neutral: neutralPct, negative: negativePct },
        event
      );
      
      // Calculate confidence level
      let confidenceLevel = 'medium';
      if (eventsWithReviews >= 5 && totalSentiments >= 50) {
        confidenceLevel = 'high';
      } else if (eventsWithReviews < 2 || totalSentiments < 10) {
        confidenceLevel = 'low';
      }
      
      // Generate specific insights
      const insights = this.getSentimentInsights(
        adjustedPrediction.positive, 
        adjustedPrediction.neutral, 
        adjustedPrediction.negative, 
        event.category
      );
      
      // Identify potential risks and recommendations
      const risksAndRecommendations = this.analyzeSentimentRisks(
        adjustedPrediction,
        event,
        similarEvents
      );
      
      return {
        sentimentPrediction: adjustedPrediction,
        confidenceLevel,
        similarEventsCount: eventsWithReviews,
        totalReviewsAnalyzed: totalSentiments,
        insights,
        risksAndRecommendations
      };
    } catch (error) {
      console.error('Error predicting sentiment:', error);
      throw error;
    }
  }
  
  /**
   * Adjust sentiment prediction based on event-specific factors
   */
  static adjustSentimentPrediction(basePrediction, event) {
    const { positive, neutral, negative } = basePrediction;
    let adjustedPositive = positive;
    let adjustedNeutral = neutral;
    let adjustedNegative = negative;
    
    // Adjust based on location
    const locationFactor = this.getLocationFactor(event.location);
    if (locationFactor > 1.1) {
      // Popular location, shift sentiment more positive
      const shift = Math.min(5, negative);
      adjustedPositive += shift;
      adjustedNegative -= shift;
    } else if (locationFactor < 0.9) {
      // Less popular location, shift slightly negative
      const shift = Math.min(3, positive);
      adjustedPositive -= shift;
      adjustedNegative += shift;
    }
    
    // Adjust based on time of day
    if (event.time) {
      const hour = new Date(`2000-01-01T${event.time}`).getHours();
      if (hour < 10 || hour > 20) {
        // Very early or late times can affect sentiment
        const shift = Math.min(2, positive);
        adjustedPositive -= shift;
        adjustedNeutral += shift;
      }
    }
    
    // Adjust based on seasonality
    const seasonalFactor = this.getSeasonalFactor(new Date(event.date));
    if (seasonalFactor > 1.1) {
      // Good season, shift sentiment more positive
      const shift = Math.min(3, negative + neutral);
      adjustedPositive += shift;
      adjustedNegative -= shift / 2;
      adjustedNeutral -= shift / 2;
    } else if (seasonalFactor < 0.9) {
      // Off-season, shift slightly negative
      const shift = Math.min(3, positive);
      adjustedPositive -= shift;
      adjustedNeutral += shift / 2;
      adjustedNegative += shift / 2;
    }
    
    // Ensure percentages add up to 100
    const total = adjustedPositive + adjustedNeutral + adjustedNegative;
    return {
      positive: Math.round((adjustedPositive / total) * 100),
      neutral: Math.round((adjustedNeutral / total) * 100),
      negative: Math.round((adjustedNegative / total) * 100)
    };
  }
  
  /**
   * Analyze sentiment risks and generate recommendations
   */
  static analyzeSentimentRisks(prediction, event, similarEvents) {
    const risks = [];
    const recommendations = [];
    
    // Check for sentiment risk factors
    if (prediction.negative > 15) {
      risks.push({
        factor: 'Negative sentiment risk',
        level: prediction.negative > 25 ? 'high' : 'medium',
        description: `Predicted negative sentiment (${prediction.negative}%) is above the acceptable threshold of 15%`
      });
      
      // Generate specific recommendations based on similar events with negative reviews
      const negativeReviews = [];
      similarEvents.forEach(se => {
        if (se.Reviews) {
          const negative = se.Reviews.filter(r => r.sentiment === 'negative');
          negative.forEach(r => negativeReviews.push(r));
        }
      });
      
      // Look for common words in negative reviews
      if (negativeReviews.length > 0) {
        const commonIssues = this.findCommonWords(negativeReviews.map(r => r.review_text));
        
        if (commonIssues.includes('time') || commonIssues.includes('schedule') || commonIssues.includes('late')) {
          recommendations.push('Consider improving event scheduling and time management');
        }
        
        if (commonIssues.includes('staff') || commonIssues.includes('service') || commonIssues.includes('rude')) {
          recommendations.push('Train staff to improve service quality and responsiveness');
        }
        
        if (commonIssues.includes('expensive') || commonIssues.includes('cost') || commonIssues.includes('price')) {
          recommendations.push('Review pricing structure to better align with perceived value');
        }
        
        if (commonIssues.includes('venue') || commonIssues.includes('location') || commonIssues.includes('facility')) {
          recommendations.push('Ensure venue facilities meet attendee expectations');
        }
      }
    }
    
    // Add generic recommendations if specific ones couldn't be generated
    if (recommendations.length === 0) {
      recommendations.push('Collect detailed feedback during the event to address issues promptly');
      recommendations.push('Focus on aspects that received positive feedback in similar events');
    }
    
    return { risks, recommendations };
  }
  
  /**
   * Find common words in a set of texts
   */
  static findCommonWords(texts) {
    const stopwords = ['the', 'and', 'a', 'to', 'of', 'in', 'is', 'was', 'for', 'on', 'that', 'with', 'this'];
    const wordCounts = {};
    
    texts.forEach(text => {
      const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
      words.forEach(word => {
        if (word.length > 3 && !stopwords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Get default attendance prediction based on category
   */
  static getDefaultAttendancePrediction(category) {
    // Default attendance numbers by category
    const categoryDefaults = {
      'Conference': 200,
      'Workshop': 40,
      'Seminar': 75,
      'Social': 100,
      'Concert': 300,
      'Exhibition': 150,
      'Sports': 250,
      'Webinar': 120,
      'default': 80
    };
    
    return {
      predictedAttendance: categoryDefaults[category] || categoryDefaults.default,
      confidenceLevel: 'low',
      similarEventsCount: 0,
      note: 'Prediction based on category average as no similar past events were found',
      minAttendance: Math.round((categoryDefaults[category] || categoryDefaults.default) * 0.7),
      maxAttendance: Math.round((categoryDefaults[category] || categoryDefaults.default) * 1.3),
      influencingFactors: []
    };
  }
  
  /**
   * Get default sentiment prediction
   */
  static getDefaultSentimentPrediction() {
    return {
      sentimentPrediction: {
        positive: 65,
        neutral: 25,
        negative: 10
      },
      confidenceLevel: 'low',
      similarEventsCount: 0,
      totalReviewsAnalyzed: 0,
      note: 'Default prediction as no similar past events were found',
      insights: ["Expected to receive mostly positive feedback based on average category performance"],
      risksAndRecommendations: {
        risks: [],
        recommendations: [
          "Focus on clear communication of event details",
          "Ensure adequate staffing and resources",
          "Set realistic expectations for attendees"
        ]
      }
    };
  }
  
  /**
   * Get location adjustment factor
   */
  static getLocationFactor(location) {
    // This is simplified for demonstration
    // In a real implementation, you would use historical data
    // to determine location-specific attendance factors
    const locationFactors = {
      'Virtual Event': 1.2,
      'Online': 1.2,
      'San Francisco': 1.15,
      'New York': 1.1,
      'Chicago': 1.05,
      'Los Angeles': 1.1,
      'default': 1.0
    };
    
    // Check if any key is a substring of the location
    for (const key in locationFactors) {
      if (key !== 'default' && location.includes(key)) {
        return locationFactors[key];
      }
    }
    
    return locationFactors.default;
  }
  
  /**
   * Get seasonal adjustment factor based on date
   */
  static getSeasonalFactor(date) {
    const month = date.getMonth();
    
    // Seasonal adjustments by month (0 = January, 11 = December)
    const seasonalFactors = [
      0.9,  // January
      0.95, // February
      1.0,  // March
      1.05, // April
      1.1,  // May
      1.15, // June
      1.05, // July
      1.0,  // August
      1.1,  // September
      1.15, // October
      1.05, // November
      0.9   // December
    ];
    
    return seasonalFactors[month];
  }
  
  /**
   * Generate insights based on predicted sentiment
   */
  static getSentimentInsights(positive, neutral, negative, category) {
    const insights = [];
    
    if (positive >= 70) {
      insights.push('Expected to be very well-received by attendees');
      
      if (category === 'Conference' || category === 'Workshop' || category === 'Seminar') {
        insights.push('Attendees will likely appreciate the educational content and networking opportunities');
      } else if (category === 'Concert' || category === 'Exhibition' || category === 'Social') {
        insights.push('Attendees will likely value the entertainment and social aspects of the event');
      }
    } else if (positive >= 50) {
      insights.push('Likely to receive generally positive feedback with some areas for improvement');
      
      if (neutral > 30) {
        insights.push('A significant portion of attendees may have mixed feelings about certain aspects');
      }
    } else if (negative >= 30) {
      insights.push('May face challenges with attendee satisfaction');
      insights.push('Consider addressing potential issues with venue, scheduling, or content');
    }
    
    // Add more specific insights based on category and sentiment distribution
    if (category === 'Conference' && positive < 60) {
      insights.push('Consider providing more networking opportunities and improving session content');
    } else if (category === 'Workshop' && positive < 60) {
      insights.push('Focus on hands-on activities and practical takeaways to improve sentiment');
    } else if (category === 'Social' && negative > 20) {
      insights.push('Pay special attention to venue selection and attendee comfort');
    }
    
    return insights;
  }
  
  /**
   * Predict the expected rating for an event
   */
  static async predictRating(eventId) {
    try {
      // Get event details
      const event = await Events.findByPk(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Find similar past events
      const similarEvents = await Events.findAll({
        where: {
          id: { [Op.ne]: eventId },
          category: event.category,
          date: { [Op.lt]: new Date() } // Past events only
        },
        include: [{
          model: Reviews,
          attributes: []
        }],
        attributes: [
          'id',
          [Sequelize.fn('AVG', Sequelize.col('Reviews.rating')), 'avgRating'],
          [Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), 'reviewCount']
        ],
        group: ['Events.id'],
        having: Sequelize.literal('COUNT(Reviews.id) > 0')
      });
      
      if (similarEvents.length === 0) {
        return {
          predictedRating: 4.0,
          confidenceLevel: 'low',
          similarEventsCount: 0,
          note: 'Default prediction as no similar past events were found',
          factors: []
        };
      }
      
      // Calculate weighted average rating
      let totalWeightedRating = 0;
      let totalWeight = 0;
      
      similarEvents.forEach(se => {
        const avgRating = parseFloat(se.getDataValue('avgRating') || 0);
        const reviewCount = parseInt(se.getDataValue('reviewCount') || 0);
        
        if (avgRating > 0 && reviewCount > 0) {
          // Weight by number of reviews (more reviews = more reliable)
          const weight = Math.min(reviewCount, 50); // Cap at 50 to prevent one event from dominating
          totalWeightedRating += avgRating * weight;
          totalWeight += weight;
        }
      });
      
      if (totalWeight === 0) {
        return {
          predictedRating: 4.0,
          confidenceLevel: 'low',
          similarEventsCount: 0,
          note: 'Default prediction as no valid ratings were found',
          factors: []
        };
      }
      
      const basePrediction = parseFloat((totalWeightedRating / totalWeight).toFixed(1));
      
      // Apply adjustments based on event characteristics
      const adjustedRating = this.adjustRatingPrediction(basePrediction, event);
      
      // Calculate confidence level
      let confidenceLevel = 'medium';
      if (similarEvents.length >= 5 && totalWeight >= 50) {
        confidenceLevel = 'high';
      } else if (similarEvents.length < 2 || totalWeight < 10) {
        confidenceLevel = 'low';
      }
      
      // Identify factors that impact the rating
      const factors = this.identifyRatingFactors(adjustedRating, event, similarEvents);
      
      return {
        predictedRating: adjustedRating,
        confidenceLevel,
        similarEventsCount: similarEvents.length,
        totalReviewsAnalyzed: totalWeight,
        ratingDistribution: this.predictRatingDistribution(adjustedRating),
        factors
      };
    } catch (error) {
      console.error('Error predicting rating:', error);
      throw error;
    }
  }
  
  /**
   * Adjust rating prediction based on event characteristics
   */
  static adjustRatingPrediction(baseRating, event) {
    let adjustedRating = baseRating;
    
    // Apply location adjustment
    const locationFactor = this.getLocationFactor(event.location);
    if (locationFactor > 1.1) {
      adjustedRating += 0.2;
    } else if (locationFactor < 0.9) {
      adjustedRating -= 0.2;
    }
    
    // Apply seasonal adjustment
    const seasonalFactor = this.getSeasonalFactor(new Date(event.date));
    if (seasonalFactor > 1.1) {
      adjustedRating += 0.1;
    } else if (seasonalFactor < 0.9) {
      adjustedRating -= 0.1;
    }
    
    // Ensure rating is within 1-5 range
    adjustedRating = Math.min(5, Math.max(1, adjustedRating));
    
    // Round to nearest 0.1
    return Math.round(adjustedRating * 10) / 10;
  }
  
  /**
   * Identify factors that impact the rating
   */
  static identifyRatingFactors(predictedRating, event, similarEvents) {
    const factors = [];
    
    // Location factor
    const locationFactor = this.getLocationFactor(event.location);
    if (locationFactor > 1.1) {
      factors.push({
        factor: 'Location',
        impact: 'positive',
        description: `${event.location} is associated with higher ratings`
      });
    } else if (locationFactor < 0.9) {
      factors.push({
        factor: 'Location',
        impact: 'negative',
        description: `${event.location} has historically received lower ratings`
      });
    }
    
    // Season factor
    const seasonalFactor = this.getSeasonalFactor(new Date(event.date));
    if (seasonalFactor > 1.1) {
      factors.push({
        factor: 'Seasonal timing',
        impact: 'positive',
        description: `Events in ${this.getMonthName(new Date(event.date).getMonth())} tend to receive better ratings`
      });
    } else if (seasonalFactor < 0.9) {
      factors.push({
        factor: 'Seasonal timing',
        impact: 'negative',
        description: `Events in ${this.getMonthName(new Date(event.date).getMonth())} often receive lower ratings`
      });
    }
    
    // Add category-specific factors
    switch (event.category) {
      case 'Conference':
        if (predictedRating >= 4.3) {
          factors.push({
            factor: 'Content quality',
            impact: 'positive',
            description: 'Conferences in this category with high-quality content receive excellent ratings'
          });
        }
        break;
      case 'Workshop':
        factors.push({
          factor: 'Hands-on experience',
          impact: 'variable',
          description: 'Workshop ratings are heavily influenced by the quality of hands-on activities'
        });
        break;
      case 'Social':
        factors.push({
          factor: 'Networking opportunities',
          impact: 'variable',
          description: 'Social events are often rated based on networking quality and social atmosphere'
        });
        break;
    }
    
    return factors;
  }
  
  /**
   * Predict the distribution of ratings
   */
  static predictRatingDistribution(avgRating) {
    // This is a model based on common rating distributions
    // In a real implementation, you would use historical data patterns
    
    let distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    if (avgRating >= 4.5) {
      distribution = { 5: 60, 4: 30, 3: 7, 2: 2, 1: 1 };
    } else if (avgRating >= 4.0) {
      distribution = { 5: 40, 4: 40, 3: 15, 2: 3, 1: 2 };
    } else if (avgRating >= 3.5) {
      distribution = { 5: 20, 4: 35, 3: 30, 2: 10, 1: 5 };
    } else if (avgRating >= 3.0) {
      distribution = { 5: 10, 4: 25, 3: 40, 2: 15, 1: 10 };
    } else if (avgRating >= 2.5) {
      distribution = { 5: 5, 4: 20, 3: 30, 2: 35, 1: 10 };
    } else {
      distribution = { 5: 5, 4: 10, 3: 20, 2: 25, 1: 40 };
    }
    
    return distribution;
  }
}

module.exports = PredictiveAnalyticsService;