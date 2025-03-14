const express = require("express");
const router = express.Router();

// Mock database of predefined responses
const responsePatterns = [
  {
    patterns: ["hello", "hi", "hey", "greetings"],
    response: "👋 Hello! How can I help you with the Event App today?"
  },
  {
    patterns: ["event", "find events", "search", "search events"],
    response: "You can search for events by using the search bar at the top of the home page. You can filter by date, location, or category."
  },
  {
    patterns: ["review", "leave review", "rate", "rating"],
    response: "To leave a review, navigate to the event page and scroll down to the reviews section. You'll need to be logged in to leave a review."
  },
  {
    patterns: ["calendar", "schedule", "my events"],
    response: "You can view your events in calendar view by clicking on 'Calendar' in the main navigation menu. Events you're attending will be highlighted."
  },
  {
    patterns: ["account", "profile", "settings"],
    response: "You can manage your account settings by clicking on your profile picture in the top right corner and selecting 'Settings'."
  },
  {
    patterns: ["create event", "host event", "new event"],
    response: "To create a new event, you need admin permissions. If you're an admin, you can access the event creation form from the admin dashboard."
  },
  {
    patterns: ["notify", "notification", "alert", "reminder"],
    response: "You'll receive notifications about events you're interested in, updates to events, and responses to your reviews. Check your notification settings in your profile."
  },
  {
    patterns: ["help", "support", "contact"],
    response: "For additional help, you can contact our support team by clicking on 'Support' in the footer of the app."
  }
];

// Fallback response
const fallbackResponse = "I'm not sure I understand. Could you please rephrase your question about the Event App? I can help with finding events, reviewing events, using the calendar, and general app navigation.";

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

// Chat endpoint
router.get("/", (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
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
    
    // Find appropriate response
    const responseText = findResponse(userMessage.content);
    
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
    'Connection': 'keep-alive'
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
    
    // Find appropriate response
    const responseText = findResponse(userMessage.content);
    
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