const express = require("express");
const router = express.Router();
const { Brand } = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all brands
router.get("/", async (req, res) => {
  try {
    const brands = await Brand.findAll({
      where: { userId: req.userId },
      order: [["name", "ASC"]],
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single brand
router.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create brand
router.post("/", async (req, res) => {
  try {
    const brand = await Brand.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(brand);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Brand name already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update brand
router.put("/:id", async (req, res) => {
  try {
    const brand = await Brand.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    await brand.update(req.body);
    res.json(brand);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Brand name already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete brand
router.delete("/:id", async (req, res) => {
  try {
    const brand = await Brand.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    await brand.destroy();
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

