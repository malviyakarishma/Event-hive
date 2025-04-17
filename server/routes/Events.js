const express = require("express");
const router = express.Router();
const { Events, Reviews } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { error } = require("console");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/events";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `event-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Fetch all events
router.get("/", async (req, res) => {
  try {
    const events = await Events.findAll();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create a new event (Requires Authentication)
router.post("/", validateToken, upload.single("image"), async (req, res) => {
  try {
    console.log("Received Event Data:", req.body);

    const {title,location,description,date,time,category,isPaid,price,ticketsAvailable,registrationDeadline,maxRegistrations,minRegistrations,status,} = req.body;

    // Basic required fields check
    if (!title || !location || !description || !date || !time || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 👇 Convert types upfront for validation logic
    const eventDate = new Date(date);
    const isPaidBool = isPaid === "true" || isPaid === true;
    const priceNum = parseFloat(price);
    const maxRegNum = parseInt(maxRegistrations);
    const ticketsNum = parseInt(ticketsAvailable);
    const regDeadlineDate = registrationDeadline
      ? new Date(registrationDeadline)
      : null;
    // ✨ Custom Validations
    const today = new Date();
    //   today.setHours(0, 0, 0, 0); // remove time part for comparison

    if (eventDate <= today) {
      return res
        .status(400)
        .json({
          error:
            "Oh sure, let's register people in the past. Time machines are in beta, right?",
        });
    }

    if (isPaidBool && (!price || priceNum <= 0)) {
      return res
        .status(400)
        .json({ error: "Paid events must have a price greater than 0" });
    }

    if (maxRegNum > ticketsNum) {
      return res
        .status(400)
        .json({
          error: "Maximum registrations cannot exceed available tickets",
        });
    }

    if (
      regDeadlineDate instanceof Date &&
      !isNaN(regDeadlineDate) &&
      eventDate instanceof Date &&
      !isNaN(eventDate)
    ) {
      // Strip time for accurate day comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      regDeadlineDate.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      // 1. Deadline must be in the future (not today or past)
      if (regDeadlineDate <= today) {
        return res
          .status(400)
          .json({ error: "Do you even understand the meaning of deadline? " });
      }

      // 2. Deadline must be before the event date
      if (regDeadlineDate >= eventDate) {
        return res
          .status(400)
          .json({ error: "Registration deadline must be before event date" });
      }
    }

    // 🧠 Construct event data
    const newEventData = {
      title,
      location,
      description,
      date,
      time,
      category,
      username: req.user.username,
      isPaid: isPaidBool,
      price: isPaidBool ? priceNum : 0,
      ticketsAvailable: ticketsNum || 100,
      registrationDeadline: registrationDeadline || null,
      maxRegistrations: maxRegNum || null,
      minRegistrations: parseInt(minRegistrations || 1),
      status: status || "active",
    };

    if (req.file) {
      newEventData.image = `/uploads/events/${req.file.filename}`;
    }

    const newEvent = await Events.create(newEventData);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Fetch specific event details and its reviews
router.get("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // if (!eventId || isNaN(eventId)) {
    //     return res.status(400).json({ error: "Invalid event ID" });
    // }

    const event = await Events.findByPk(eventId, {
      attributes: [
        "id",
        "title",
        "location",
        "description",
        "date",
        "time",
        "category",
        "image",
        "username",
        "isPaid",
        "price",
        "ticketsAvailable",
        "registrationDeadline",
        "maxRegistrations",
        "minRegistrations",
        "status",
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const reviews = await Reviews.findAll({
      where: { EventId: eventId },
      attributes: [
        "id",
        "review_text",
        "rating",
        "username",
        "createdAt",
        "sentiment",
        "admin_response",
      ],
    });

    res.json({ event, reviews });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Update an event (Requires Authentication & Ownership)
router.put(
  "/:eventId",
  validateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const event = await Events.findByPk(eventId);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Ensure that only the event creator can update it
      if (event.username !== req.user.username) {
        return res
          .status(403)
          .json({ error: "You are not authorized to update this event" });
      }

      const {
        title,
        location,
        description,
        date,
        time,
        category,
        isPaid,
        price,
        ticketsAvailable,
        registrationDeadline,
        maxRegistrations,
        minRegistrations,
        status,
      } = req.body;

      // 👇 Convert types upfront for validation logic
      const eventDate = new Date(date);
      const isPaidBool = isPaid === "true" || isPaid === true;
      const priceNum = parseFloat(price);
      const maxRegNum = parseInt(maxRegistrations);
      const ticketsNum = parseInt(ticketsAvailable);
      const regDeadlineDate = registrationDeadline
        ? new Date(registrationDeadline)
        : null;
      // ✨ Custom Validations
      const today = new Date();
      //   today.setHours(0, 0, 0, 0); // remove time part for comparison

      // if (eventDate <= today) {
      //   return res.status(400).json({ error: "Oh sure, let's register people in the past. Time machines are in beta, right?" });
      // }

      if (isPaidBool && (!price || priceNum <= 0)) {
        return res
          .status(400)
          .json({ error: "Paid events must have a price greater than 0" });
      }

      if (maxRegNum > ticketsNum) {
        return res
          .status(400)
          .json({
            error: "Maximum registrations cannot exceed available tickets",
          });
      }

      if (
        regDeadlineDate instanceof Date &&
        !isNaN(regDeadlineDate) &&
        eventDate instanceof Date &&
        !isNaN(eventDate)
      ) {
        // Strip time for accurate day comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        regDeadlineDate.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        // 1. Deadline must be in the future (not today or past)
        if (regDeadlineDate <= today) {
          return res
            .status(400)
            .json({
              error: "Do you even understand the meaning of deadline? ",
            });
        }

        // 2. Deadline must be before the event date
        if (regDeadlineDate >= eventDate) {
          return res
            .status(400)
            .json({ error: "Registration deadline must be before event date" });
        }
      }

      // Update event data
      const updateData = {
        title: title || event.title,
        location: location || event.location,
        description: description || event.description,
        date: date || event.date,
        time: time || event.time,
        category: category || event.category,
        // Update paid event fields
        isPaid: isPaid === "true" || isPaid === true,
        price: isPaid === "true" || isPaid === true ? parseFloat(price) : 0,
        ticketsAvailable: ticketsAvailable
          ? parseInt(ticketsAvailable)
          : event.ticketsAvailable,
        registrationDeadline:
          registrationDeadline || event.registrationDeadline,
        maxRegistrations: maxRegistrations
          ? parseInt(maxRegistrations)
          : event.maxRegistrations,
        minRegistrations: minRegistrations
          ? parseInt(minRegistrations)
          : event.minRegistrations,
        status: status || event.status,
      };

      // Update image if a new one was uploaded
      if (req.file) {
        // Delete old image if exists
        if (event.image) {
          const oldImagePath = path.join(__dirname, "..", event.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.image = `/uploads/events/${req.file.filename}`;
      }

      await Events.update(updateData, { where: { id: eventId } });

      const updatedEvent = await Events.findByPk(eventId);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  }
);

// Delete an event (Requires Authentication & Ownership)
router.delete("/:eventId", validateToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Events.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Ensure that only the event creator can delete it
    if (event.username !== req.user.username) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this event" });
    }

    // Delete associated image if it exists
    if (event.image) {
      const imagePath = path.join(__dirname, "..", event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Events.destroy({ where: { id: eventId } });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Serve static event images
router.get("/images/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "../uploads/events", filename);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

module.exports = router;
