const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

// Middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Enable CORS for all routes

// Import the database models (assuming you have a 'models' folder with Sequelize)
const db = require("./models");

// Import routers
const eventRouter = require("./routes/Events");
app.use(express.json());
const reviewRouter = require("./routes/Reviews");
const usersRouter = require("./routes/Users");
const responseRouter = require("./routes/Response"); // Ensure this exists and is properly set up

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

// Sync database and start the server
db.sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
});
