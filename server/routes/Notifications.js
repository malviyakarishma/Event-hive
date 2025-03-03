const express = require("express")
const router = express.Router()
const { Notifications, Users } = require("../models")
const { validateToken } = require("../middlewares/AuthMiddleware")
const { Op } = require("sequelize")

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

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    res.status(500).json({ message: "Error updating notifications", error: error.message })
  }
})

// Admin routes
router.get("/admin", validateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" })
  }

  try {
    const notifications = await Notifications.findAll({
      where: { isAdminNotification: true },
      order: [["createdAt", "DESC"]],
      limit: 50,
    })

    res.json(notifications)
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    res.status(500).json({ message: "Error fetching admin notifications", error: error.message })
  }
})

router.put("/admin/:id/read", validateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" })
  }

  try {
    const [updatedRows] = await Notifications.update(
      { isRead: true },
      { where: { id: req.params.id, isAdminNotification: true } },
    )

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Notification not found" })
    }

    const updatedNotification = await Notifications.findByPk(req.params.id)
    res.json(updatedNotification)
  } catch (error) {
    console.error("Error updating notification:", error)
    res.status(500).json({ message: "Error updating notification", error: error.message })
  }
})

router.put("/admin/read-all", validateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" })
  }

  try {
    await Notifications.update({ isRead: true }, { where: { isAdminNotification: true, isRead: false } })

    res.json({ success: true })
  } catch (error) {
    console.error("Error updating notifications:", error)
    res.status(500).json({ message: "Error updating notifications", error: error.message })
  }
})

module.exports = router

