const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Middleware
const app = express();
app.use(express.json());
app.use(cors());

// Import the database models
const db = require("./models");

// Import routers
const eventRouter = require("./routes/Events");
const userRoutes = require("./routes/userRoutes");
const reviewRouter = require("./routes/Reviews");
const usersRouter = require("./routes/Users");
const responseRouter = require("./routes/Response");

// Create HTTP server and initialize socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Setup socket.io (simplified, no notifications)
io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});

// Sentiment Analysis Route
app.post("/sentiment", (req, res) => {
    const { review } = req.body;

    if (!review) {
        return res.status(400).json({ error: "Review text is required." });
    }

    // Analyze sentiment (replace with a proper library)
    const sentimentResult = analyzeSentiment(review);

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
app.use("/events", eventRouter);
app.use("/reviews", reviewRouter);
app.use("/auth", usersRouter);
app.use("/respond", responseRouter);
app.use("/api/user", userRoutes);

// Sync database and start the server
db.sequelize.sync().then(() => {
    server.listen(3001, () => {
        console.log("Server running on port 3001");
    });
});