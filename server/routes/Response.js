const express = require("express");
const router = express.Router();
const { Reviews } = require("../models"); // Import models
const { validateToken } = require("../middlewares/AuthMiddleware");

// Add admin response to a review
router.put("/respond/:reviewId", validateToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin privileges required" });
    }

    const { reviewId } = req.params;
    const { adminResponse } = req.body;

    // Validate input
    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({ error: "Response text is required" });
    }

    const review = await Reviews.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Update the response field
    review.admin_response = adminResponse;
    await review.save();

    return res.json({
      message: "Admin response added successfully.",
      response: review.admin_response,
    });
  } catch (error) {
    console.error("Error updating review response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;