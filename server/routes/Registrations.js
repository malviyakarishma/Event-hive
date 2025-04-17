const express = require("express");
const router = express.Router();
const { Registrations, Events, Users, Notifications } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const uuid = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
});

// Helper function to send confirmation emails
const sendConfirmationEmail = async (registration, event) => {
  try {
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: registration.email,
      subject: `Registration Confirmation for ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1A2A56; color: white; padding: 20px; text-align: center;">
            <h1>Registration Confirmed!</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <p>Dear ${registration.fullName},</p>
            <p>Thank you for registering for <strong>${event.title}</strong>.</p>
            <p><strong>Event Details:</strong></p>
            <ul>
              <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${event.time}</li>
              <li><strong>Location:</strong> ${event.location}</li>
              <li><strong>Tickets:</strong> ${registration.ticketQuantity}</li>
              ${registration.totalAmount > 0 ? `<li><strong>Total Paid:</strong> $${registration.totalAmount}</li>` : ''}
            </ul>
            <p><strong>Confirmation Code:</strong> ${registration.confirmationCode}</p>
            <p>Please keep this email for your records. You may be asked to show this confirmation when checking in at the event.</p>
            <p>If you have any questions, please contact us at support@EventHive.com.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="font-size: 12px; color: #666;">
                © ${new Date().getFullYear()} EventHive. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${registration.email}`);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};

// Create a new registration
router.post("/", async (req, res) => {
  try {
    const {eventId,userId,fullName,email,phone,address,city,state,zipCode,specialRequirements,ticketQuantity,paymentStatus,totalAmount,
    } = req.body;

    // Validate required fields
    if (!eventId || !fullName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the event exists
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const zipCodeRegex = /^[1-9][0-9]{5}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "That's not a valid phone number, unless your phone dials into another dimension." });
    }

    if (!zipCodeRegex.test(zipCode)) {
      return res.status(400).json({ error: "That's not a valid PIN code — unless India added a secret zone." });
    }

    // Generate a unique confirmation code
    const confirmationCode = uuid.v4().substring(0, 8).toUpperCase();

    // Create the registration
    const registration = await Registrations.create({
      EventId: eventId,
      UserId: userId || null,
      fullName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      specialRequirements,
      ticketQuantity: ticketQuantity || 1,
      paymentStatus: paymentStatus || "pending",
      totalAmount: totalAmount || 0.00,
      confirmationCode,
    });

    // If it's a free event, send confirmation email immediately
    if (paymentStatus === "free") {
      sendConfirmationEmail(registration, event);
    }

    // Notify event organizer of new registration
    try {
      // Create a notification for the event organizer
      if (event.username) {
        const organizer = await Users.findOne({ where: { username: event.username } });
        if (organizer) {
          await Notifications.create({
            message: `New registration from ${fullName} for your event "${event.title}"`,
            type: "registration",
            relatedId: registration.id,
            userId: organizer.id,
            isRead: false,
          });

          // Send real-time notification if socket.io is configured
          if (req.app.io) {
            req.app.io.to(`user-${organizer.id}`).emit("notification", {
              message: `New registration from ${fullName} for your event "${event.title}"`,
              type: "registration",
              relatedId: registration.id,
            });
          }
        }
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      message: "Registration successful",
      id: registration.id,
      confirmationCode: registration.confirmationCode,
    });
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// Update payment status
router.put("/:registrationId/payment", async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentStatus, paymentMethod, transactionId } = req.body;

    const registration = await Registrations.findByPk(registrationId, {
      include: [{ model: Events }],
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Update payment information
    await registration.update({
      paymentStatus,
      paymentMethod,
      transactionId,
      paymentDate: new Date(),
    });

    // Send confirmation email if payment is completed
    if (paymentStatus === "completed") {
      sendConfirmationEmail(registration, registration.Event);
    }

    res.json({
      message: "Payment status updated",
      registration: {
        id: registration.id,
        paymentStatus: registration.paymentStatus,
        confirmationCode: registration.confirmationCode,
      },
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

// Get all registrations for an event (admin/organizer only)
router.get("/event/:eventId", validateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the event
    const event = await Events.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is authorized (admin or event organizer)
    if (!req.user.isAdmin && req.user.username !== event.username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get all registrations for this event
    const registrations = await Registrations.findAll({
      where: { EventId: eventId },
      order: [["registrationDate", "DESC"]],
    });

    res.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Get a specific registration by ID
router.get("/:registrationId", validateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registrations.findByPk(registrationId, {
      include: [{ model: Events }],
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Check if user is authorized (admin, event organizer, or the registered user)
    const event = registration.Event;
    if (
      !req.user.isAdmin &&
      req.user.username !== event.username &&
      req.user.id !== registration.UserId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(registration);
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({ error: "Failed to fetch registration" });
  }
});

// Get all registrations for a user
router.get("/user/me", validateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const registrations = await Registrations.findAll({
      where: { UserId: userId },
      include: [{ model: Events }],
      order: [["registrationDate", "DESC"]],
    });

    res.json(registrations);
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Add to server/routes/Registrations.js if not already there

// Get all registrations (admin only)
router.get("/all", validateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized. Admin access required." });
    }

    // Get all registrations with event info
    const registrations = await Registrations.findAll({
      include: [{ model: Events, attributes: ['id', 'title', 'date'] }],
      order: [["registrationDate", "DESC"]],
    });

    res.json(registrations);
  } catch (error) {
    console.error("Error fetching all registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Resend confirmation email
router.post("/:registrationId/resend-email", validateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized. Admin access required." });
    }
    
    const registration = await Registrations.findByPk(registrationId, {
      include: [{ model: Events }],
    });
    
    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }
    
    // Send confirmation email
    const emailSent = await sendConfirmationEmail(registration, registration.Event);
    
    if (emailSent) {
      res.json({ message: "Confirmation email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  } catch (error) {
    console.error("Error resending confirmation email:", error);
    res.status(500).json({ error: "Failed to resend confirmation email" });
  }
});

// Update check-in status route in server/routes/Registrations.js
router.put("/:registrationId/check-in", validateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { checkInStatus } = req.body; // Get the new status from the request
    
    const registration = await Registrations.findByPk(registrationId, {
      include: [{ model: Events }],
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Check if user is authorized (admin or event organizer)
    const event = registration.Event;
    if (!req.user.isAdmin && req.user.username !== event.username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Update check-in status
    const newCheckInStatus = checkInStatus === undefined ? true : checkInStatus;
    
    await registration.update({
      checkInStatus: newCheckInStatus,
      checkInTime: newCheckInStatus ? new Date() : null, // Set or clear time based on status
    });

    res.json({
      message: newCheckInStatus ? "Check-in successful" : "Check-out successful",
      registration: {
        id: registration.id,
        checkInStatus: registration.checkInStatus,
        checkInTime: registration.checkInTime,
      },
    });
  } catch (error) {
    console.error("Error updating check-in status:", error);
    res.status(500).json({ error: "Failed to update check-in status" });
  }
});

// Cancel a registration
router.delete("/:registrationId", validateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registrations.findByPk(registrationId, {
      include: [{ model: Events }],
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Check if user is authorized (admin, event organizer, or the registered user)
    const event = registration.Event;
    if (
      !req.user.isAdmin &&
      req.user.username !== event.username &&
      req.user.id !== registration.UserId
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete the registration
    await registration.destroy();

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res.status(500).json({ error: "Failed to cancel registration" });
  }
});

module.exports = router;