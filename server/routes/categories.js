const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.userId },
      order: [["name", "ASC"]],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single category
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create category
router.post("/", async (req, res) => {
  try {
    const category = await Category.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Category name already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update category
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.update(req.body);
    res.json(category);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Category name already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
