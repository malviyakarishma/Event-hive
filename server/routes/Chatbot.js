const express = require("express");
const router = express.Router();

// Updated comprehensive response patterns
const responsePatterns = [
  {
    patterns: ["hello", "hi", "hey", "greetings"],
    response: "👋 Hello! How can I help you with the Event App today? I can assist with finding events, managing reviews, or using our analytics dashboard."
  },
  {
    patterns: ["event", "find events", "search", "search events"],
    response: "You can search for events by using the search bar at the top of the home page. You can filter by date, location, or category. Recent events are also featured on your dashboard."
  },
  {
    patterns: ["review", "leave review", "rate", "rating"],
    response: "To leave a review, navigate to the event page and scroll down to the reviews section. You'll need to be logged in to leave a review. Your review will include a star rating and written feedback."
  },
  {
    patterns: ["calendar", "schedule", "my events"],
    response: "You can view your events in calendar view by clicking on 'Calendar' in the main navigation menu. Events you're attending will be highlighted. You can also export your schedule as a CSV file."
  },
  {
    patterns: ["account", "profile", "settings"],
    response: "You can manage your account settings by clicking on your profile picture in the top right corner and selecting 'Settings'. From there, you can update your profile information and notification preferences."
  },
  {
    patterns: ["create event", "host event", "new event"],
    response: "To create a new event, you need admin permissions. If you're an admin, you can access the event creation form from the admin dashboard. Once created, the event will be available in the analytics dashboard."
  },
  {
    patterns: ["notify", "notification", "alert", "reminder"],
    response: "You'll receive notifications about events you're interested in, updates to events, and responses to your reviews. Check your notification settings in your profile to customize what alerts you receive."
  },
  {
    patterns: ["help", "support", "contact"],
    response: "For additional help, you can contact our support team by clicking on 'Support' in the footer of the app. Our team typically responds within 24 hours."
  },
  // New analytics-related patterns
  {
    patterns: ["analytics", "dashboard", "stats", "statistics", "metrics"],
    response: "The Analytics Dashboard lets you view comprehensive event statistics. Access it from the admin panel to see sentiment analysis, review volumes, and overall ratings for each event. You can filter data by different time ranges: week, month, or quarter."
  },
  {
    patterns: ["report", "export", "download", "csv", "data export"],
    response: "You can generate and download reports from the Analytics Dashboard. Select the report type (Complete, Sentiment, Ratings, or Comments), choose your preferred format (CSV or JSON), set a date range, and click 'Generate Report'. The file will automatically download to your device."
  },
  {
    patterns: ["sentiment", "sentiment analysis", "sentiment score", "positive reviews"],
    response: "Our system analyzes review sentiment automatically. In the Analytics Dashboard, you'll see sentiment scores displayed as percentages of positive, neutral, and negative reviews. The sentiment trend chart tracks how opinion about your event changes over time."
  },
  {
    patterns: ["ai", "auto respond", "automatic response", "ai response"],
    response: "As an admin, you can use our AI auto-response feature to quickly reply to user reviews. On the Reviews tab, click 'AI Response' next to any review or use 'Auto-respond to All' to handle multiple reviews at once. Each response is tailored to the content of the review."
  },
  {
    patterns: ["chart", "graph", "visualization", "trend", "volume"],
    response: "The Analytics Dashboard includes several visualizations: sentiment trend lines, review volume bar charts, sentiment distribution pie charts, and rating distribution graphs. These help you understand user feedback patterns at a glance."
  },
  {
    patterns: ["schedule report", "weekly report", "automatic report", "recurring report"],
    response: "We're currently developing a feature to schedule automatic weekly reports. Soon, you'll be able to have analytics reports delivered directly to your email on a regular basis. Stay tuned for this upcoming feature!"
  },
  {
    patterns: ["filter data", "date range", "time period", "filter reviews"],
    response: "You can filter analytics data by different time periods: week, month, or quarter. For reports, you can set specific start and end dates to analyze exactly the time period you're interested in."
  },
  {
    patterns: ["event selection", "choose event", "switch event", "select event"],
    response: "In the Analytics Dashboard, you'll see a list of events on the left side. Click on any event to load its specific data. The system will display analytics for the selected event across all dashboard tabs."
  },
  {
    patterns: ["generate report", "create report", "make report", "report generation"],
    response: "To generate a report, go to the Reports tab in the Analytics Dashboard. Select your desired report type, format (CSV or JSON), specify a date range, and click 'Generate Report'. The file will be downloaded automatically to your computer."
  },
  {
    patterns: ["overall rating", "average rating", "star rating", "event rating"],
    response: "Each event has an overall rating displayed at the top of the Analytics Dashboard. This is calculated as the average of all individual review ratings and is shown with a star visualization for quick reference."
  },
  {
    patterns: ["total reviews", "review count", "number of reviews"],
    response: "You can see the total number of reviews for each event in the metrics cards at the top of the Analytics Dashboard. This helps you understand how much feedback you've received for your event."
  }
];

// Updated fallback response
const fallbackResponse = "I'm not sure I understand. Could you please rephrase your question about the Event App? I can help with finding events, reviewing events, using the calendar, accessing the analytics dashboard, or generating reports.";

// Function to find the best matching response
function findResponse(userMessage) {
  const userMessageLower = userMessage.toLowerCase();
  
  for (const item of responsePatterns) {
    for (const pattern of item.patterns) {
      if (userMessageLower.includes(pattern)) {
        return item.response;
      }
    }
  }
  
  return fallbackResponse;
}

// Enhanced response function with more natural language understanding
function findBestResponse(userMessage) {
  const userMessageLower = userMessage.toLowerCase();
  let bestMatch = null;
  let bestMatchScore = 0;
  
  // Try to find direct matches first
  for (const item of responsePatterns) {
    for (const pattern of item.patterns) {
      if (userMessageLower.includes(pattern)) {
        // Calculate match quality based on pattern length relative to message
        const matchScore = pattern.length / userMessageLower.length;
        if (matchScore > bestMatchScore) {
          bestMatch = item.response;
          bestMatchScore = matchScore;
        }
      }
    }
  }
  
  // If we have a good match, return it
  if (bestMatchScore > 0.2) {
    return bestMatch;
  }
  
  // If no good match, try word-by-word matching
  const userWords = userMessageLower.split(/\s+/);
  const patternMatches = {};
  
  for (const item of responsePatterns) {
    patternMatches[item.response] = 0;
    
    for (const pattern of item.patterns) {
      const patternWords = pattern.split(/\s+/);
      
      for (const userWord of userWords) {
        if (userWord.length > 3 && patternWords.includes(userWord)) {
          patternMatches[item.response]++;
        }
      }
    }
  }
  
  // Find response with most word matches
  let maxMatches = 0;
  let bestResponse = null;
  
  for (const [response, matches] of Object.entries(patternMatches)) {
    if (matches > maxMatches) {
      maxMatches = matches;
      bestResponse = response;
    }
  }
  
  // Return best match or fallback
  return (maxMatches > 0) ? bestResponse : fallbackResponse;
}

// Chat endpoint with improved SSE handling
router.get("/", (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'  // Add CORS support
  });
  
  try {
    // Check if messages query parameter exists
    if (!req.query.messages) {
      return res.status(400).send(`data: ${JSON.stringify({ 
        content: "Error: No messages provided", 
        role: "assistant" 
      })}\n\n`);
    }
    
    let messages;
    try {
      messages = JSON.parse(req.query.messages);
    } catch (e) {
      console.error("Error parsing messages:", e);
      return res.status(400).send(`data: ${JSON.stringify({ 
        content: "Error: Invalid messages format", 
        role: "assistant" 
      })}\n\n`);
    }
    
    // Get the latest user message
    const userMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!userMessage) {
      return res.status(400).send(`data: ${JSON.stringify({ 
        content: "Error: No user message found", 
        role: "assistant" 
      })}\n\n`);
    }
    
    // Find appropriate response using enhanced algorithm
    const responseText = findBestResponse(userMessage.content);
    
    // Send response in chunks to simulate typing
    const chunks = responseText.split(' ');
    
    // Send the response word by word with a small delay
    let index = 0;
    
    function sendNextChunk() {
      if (index < chunks.length) {
        res.write(`data: ${JSON.stringify({ 
          content: chunks[index] + ' ',
          role: "assistant" 
        })}\n\n`);
        
        index++;
        setTimeout(sendNextChunk, 50); // 50ms delay between words
      } else {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
    
    sendNextChunk();
    
  } catch (error) {
    console.error("General error in chat endpoint:", error);
    res.write(`data: ${JSON.stringify({ 
      content: "An unexpected error occurred. Please try again later.",
      role: "assistant" 
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// POST endpoint for compatibility
router.post("/", (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'  // Add CORS support
  });
  
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid or missing messages" });
    }
    
    // Get the latest user message
    const userMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!userMessage) {
      return res.status(400).send(`data: ${JSON.stringify({ 
        content: "Error: No user message found", 
        role: "assistant" 
      })}\n\n`);
    }
    
    // Find appropriate response using enhanced algorithm
    const responseText = findBestResponse(userMessage.content);
    
    // Send response in chunks to simulate typing
    const chunks = responseText.split(' ');
    
    // Send the response word by word with a small delay
    let index = 0;
    
    function sendNextChunk() {
      if (index < chunks.length) {
        res.write(`data: ${JSON.stringify({ 
          content: chunks[index] + ' ',
          role: "assistant" 
        })}\n\n`);
        
        index++;
        setTimeout(sendNextChunk, 50); // 50ms delay between words
      } else {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
    
    sendNextChunk();
    
  } catch (error) {
    console.error("General error in chat endpoint:", error);
    res.write(`data: ${JSON.stringify({ 
      content: "An unexpected error occurred. Please try again later.",
      role: "assistant" 
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

module.exports = router;