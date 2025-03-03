const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Middleware
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// Import the database models (assuming you have a 'models' folder with Sequelize)
const db = require("./models");

// Import routers
const eventRouter = require("./routes/Events");
const reviewRouter = require("./routes/Reviews");
const usersRouter = require("./routes/Users");
const responseRouter = require("./routes/Response"); // Ensure this exists and is properly set up

// Create HTTP server and initialize socket.io
const server = http.createServer(app);
const io = socketIo(server); // Initialize socket.io with the server

// Setup socket.io
io.on("connection", (socket) => {
  console.log("New client connected");

  // Authenticate user and join their personal room
  socket.on("authenticate", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} authenticated`);
  });

  // Admin authentication
  socket.on("join-admin-channel", (token) => {
    // Verify admin token here (simplified)
    socket.join("admin-channel");
    console.log("Admin joined admin channel");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Sentiment Analysis Route
app.post("/sentiment", (req, res) => {
  const { review } = req.body;

  // Ensure review exists in the body
  if (!review) {
    return res.status(400).json({ error: "Review text is required." });
  }

  // Analyze sentiment
  const sentimentResult = analyzeSentiment(review);

  // Return sentiment result
  res.json({ sentiment: sentimentResult });
});

// Simple sentiment analysis function
function analyzeSentiment(review) {
  if (review.includes("good") || review.includes("amazing")) {
    return "positive";
  }
  return "negative";
}

// Use routers
app.use("/events", eventRouter); // Routes for events
app.use("/reviews", reviewRouter); // Routes for reviews
app.use("/auth", usersRouter); // Routes for authentication
app.use("/respond", responseRouter); // Routes for responding to reviews

// Example of sending a notification to a user
const sendNotificationToUser = async (userId, message, type = "update", relatedId = null) => {
  try {
    // Example: create a new notification (you would save this in your DB)
    const notification = {
      userId: userId,  // Assuming your notification model has a userId field
      message: message,
      type: type,
      relatedId: relatedId,
      createdAt: new Date(),
    };

    // Emit the notification to the user via their room
    io.to(`user-${userId}`).emit("new-notification", notification);
    console.log(`Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error("Error sending notification:", error.message);
  }
};

// Trigger a notification example
const triggerEventNotification = (userId, eventId, eventTitle) => {
  const message = `A new event "${eventTitle}" has been created.`;
  sendNotificationToUser(userId, message, "event", eventId);
};

// Sync database and start the server
db.sequelize.sync().then(() => {
  server.listen(3001, () => {
    console.log("Server running on port 3001");
  });
});
