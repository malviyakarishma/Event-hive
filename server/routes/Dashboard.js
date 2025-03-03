const express = require("express")
const { Users, Events, Reviews, Notifications } = require("../models")
const { validateToken } = require("../middlewares/AuthMiddleware")

const router = express.Router()

router.get("/dashboard", validateToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admins only." })
  }

  try {
    const [users, events, reviews, notifications] = await Promise.all([
      Users.findAll(),
      Events.findAll(),
      Reviews.findAll(),
      Notifications.findAll({ where: { isAdminNotification: true } }),
    ])

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length

    res.json({
      users,
      events,
      reviews,
      unreadNotificationsCount,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({ error: "Failed to fetch dashboard data" })
  }
})

module.exports = router

