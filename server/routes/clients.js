const express = require("express");
const router = express.Router();
const { Client } = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all clients
router.get("/", async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single client
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create client
router.post("/", async (req, res) => {
  try {
    const client = await Client.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update client
router.put("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    await client.update(req.body);
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete client
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    await client.destroy();
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
