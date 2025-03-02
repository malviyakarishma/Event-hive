const express = require("express");
const router = express.Router();
const { Reviews } = require("../models"); // Adjust model import based on your setup

router.put("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;

    console.log("Checking if Review model is loaded:", Review); // Corrected Debugging line

    const review = await Reviews.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    review.admin_response = adminResponse; // Update the response field
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
