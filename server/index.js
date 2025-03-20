const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware
const app = express();
app.use(express.json());
app.use(cors());

// Import the database models
const db = require("./models");

// Import routers
const chatRouter = require("./routes/Chatbot");
const eventRouter = require("./routes/Events");
const userRoutes = require("./routes/userRoutes");
const reviewRouter = require("./routes/Reviews");
const usersRouter = require("./routes/Users");
const responseRouter = require("./routes/Response");
const notificationRouter = require("./routes/Notifications");

// Create HTTP server and initialize socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes
app.io = io;

// Setup socket.io with authentication
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on('authenticate', (token) => {
        console.log("Authenticating socket with token:", token);
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.join(`user-${decoded.id}`);

            if (decoded.isAdmin) {
                socket.join('admin-channel');
                console.log(`Admin user ${decoded.id} joined admin-channel`);
            }
        } catch (error) {
            console.error('Socket authentication error:', error);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
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
app.use("/api/chat", chatRouter);
app.use("/respond", responseRouter);
app.use("/api/user", userRoutes);
app.use("/notifications", notificationRouter);
app.use('/uploads', express.static('uploads'));

// Sync database and start the server
db.sequelize.sync().then(() => {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});