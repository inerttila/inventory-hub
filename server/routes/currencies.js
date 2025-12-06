const express = require("express");
const router = express.Router();
const { Currency } = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all currencies
router.get("/", async (req, res) => {
  try {
    const currencies = await Currency.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single currency
router.get("/:id", async (req, res) => {
  try {
    const currency = await Currency.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" });
    }
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create currency
router.post("/", async (req, res) => {
  try {
    const currency = await Currency.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(currency);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Currency code already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update currency
router.put("/:id", async (req, res) => {
  try {
    const currency = await Currency.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" });
    }

    await currency.update(req.body);
    res.json(currency);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Currency code already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete currency
router.delete("/:id", async (req, res) => {
  try {
    const currency = await Currency.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!currency) {
      return res.status(404).json({ message: "Currency not found" });
    }
    await currency.destroy();
    res.json({ message: "Currency deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
