const express = require("express");
const router = express.Router();
const { Notifications, Users } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");

// Get user notifications
router.get("/", validateToken, async (req, res) => {
  try {
    const notifications = await Notifications.findAll({
      where: {
        userId: req.user.id,
        isAdminNotification: false
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
});

// Get admin notifications
router.get("/admin", validateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const notifications = await Notifications.findAll({
      where: { 
        userId: req.user.id,
        isAdminNotification: true 
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    // Parse metadata if it exists
    const processedNotifications = notifications.map(notification => {
      try {
        const notif = notification.toJSON();
        if (notif.metadata && typeof notif.metadata === 'string') {
          notif.metadata = JSON.parse(notif.metadata);
        }
        return notif;
      } catch (e) {
        return notification;
      }
    });

    res.json(processedNotifications);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ error: "Failed to fetch admin notifications" });
  }
});

// Create a new notification
router.post("/", validateToken, async (req, res) => {
  try {
    const { message, type, relatedId, isAdminNotification = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Create notification for the current user
    const notification = await Notifications.create({
      message,
      type: type || "general",
      relatedId: relatedId || null,
      isAdminNotification,
      userId: req.user.id,
      isRead: false,
    });

    // Emit to the current user
    if (req.app.io) {
      if (isAdminNotification) {
        req.app.io.to("admin-channel").emit("admin-notification", notification);
      } else {
        req.app.io.to(`user-${req.user.id}`).emit("user-notification", notification);
      }
    }

    // If the user is an admin, create notifications for all users
    if (req.user.isAdmin) {
      const users = await Users.findAll({ where: { isAdmin: false } });
      const createdNotifications = [];

      for (const user of users) {
        const userNotification = await Notifications.create({
          message,
          type: type || "general",
          relatedId: relatedId || null,
          isAdminNotification: false,
          userId: user.id,
          isRead: false,
        });

        createdNotifications.push(userNotification);

        if (req.app.io) {
          req.app.io.to(`user-${user.id}`).emit("user-notification", userNotification);
        }
      }

      return res.status(201).json({
        originalNotification: notification,
        userNotifications: createdNotifications,
      });
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Mark notification as read
router.put("/:id/read", validateToken, async (req, res) => {
  try {
    const [updatedRows] = await Notifications.update(
      { isRead: true },
      {
        where: {
          id: req.params.id,
          userId: req.user.id
        },
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updatedNotification = await Notifications.findByPk(req.params.id);

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("notification-read", { id: req.params.id });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
});

// Mark admin notification as read
router.put("/admin/:id/read", validateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [updatedRows] = await Notifications.update(
      { isRead: true },
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
          isAdminNotification: true
        },
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Admin notification not found" });
    }

    const updatedNotification = await Notifications.findByPk(req.params.id);

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("admin-notification-read", { id: req.params.id });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error("Error updating admin notification:", error);
    res.status(500).json({ message: "Error updating admin notification", error: error.message });
  }
});

// Mark all notifications as read
router.put("/read-all", validateToken, async (req, res) => {
  try {
    await Notifications.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false,
          isAdminNotification: false,
        },
      }
    );

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("notifications-read-all");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
});

// Mark all admin notifications as read
router.put("/admin/read-all", validateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    await Notifications.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isAdminNotification: true,
          isRead: false,
        },
      }
    );

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("admin-notifications-read-all");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all admin notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all admin notifications as read" });
  }
});

module.exports = router;