const express = require("express")
const router = express.Router()
const { Notifications, Users } = require("../models")
const { validateToken } = require("../middlewares/AuthMiddleware")

// Create a new notification
router.post("/", validateToken, async (req, res) => {
  try {
    const { message, type, relatedId, isAdminNotification = false } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    // Create notification for the current user
    const notification = await Notifications.create({
      message,
      type: type || "general",
      relatedId: relatedId || null,
      isAdminNotification,
      userId: req.user.id,
      isRead: false,
    })

    // Emit to the current user
    if (req.app.io) {
      if (isAdminNotification) {
        req.app.io.to("admin-notifications").emit("admin-notification", notification)
      } else {
        req.app.io.to(`user-${req.user.id}`).emit("user-notification", notification)
      }
    }

    // If the user is an admin, create notifications for all users
    if (req.user.isAdmin) {
      const users = await Users.findAll({ where: { isAdmin: false } })
      const createdNotifications = []

      for (const user of users) {
        const userNotification = await Notifications.create({
          message,
          type: type || "general",
          relatedId: relatedId || null,
          isAdminNotification: false,
          userId: user.id,
          isRead: false,
        })

        createdNotifications.push(userNotification)

        if (req.app.io) {
          req.app.io.to(`user-${user.id}`).emit("user-notification", userNotification)
        }
      }

      return res.status(201).json({
        originalNotification: notification,
        userNotifications: createdNotifications,
      })
    }

    res.status(201).json(notification)
  } catch (error) {
    console.error("Error creating notification:", error)
    res.status(500).json({ error: "Failed to create notification" })
  }
})

// Get user notifications
router.get("/", validateToken, async (req, res) => {
  try {
    const notifications = await Notifications.findAll({
      where: {
        userId: req.user.id,
        isAdminNotification: req.user.isAdmin,
      },
      order: [["createdAt", "DESC"]],
      limit: 50,
    })

    res.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ message: "Error fetching notifications", error: error.message })
  }
})

// Mark notification as read
router.put("/:id/read", validateToken, async (req, res) => {
  try {
    const [updatedRows] = await Notifications.update(
      { isRead: true },
      {
        where: {
          id: req.params.id,
          userId: req.user.id,
          isAdminNotification: req.user.isAdmin,
        },
      },
    )

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Notification not found" })
    }

    const updatedNotification = await Notifications.findByPk(req.params.id)

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("notification-read", { id: req.params.id })
    }

    res.json(updatedNotification)
  } catch (error) {
    console.error("Error updating notification:", error)
    res.status(500).json({ message: "Error updating notification", error: error.message })
  }
})

// Mark all notifications as read
router.put("/read-all", validateToken, async (req, res) => {
  try {
    await Notifications.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false,
          isAdminNotification: req.user.isAdmin,
        },
      },
    )

    if (req.app.io) {
      req.app.io.to(`user-${req.user.id}`).emit("notifications-read-all")
    }

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    res.status(500).json({ message: "Error updating notifications", error: error.message })
  }
})

module.exports = router

