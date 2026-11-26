const express = require("express");
const router = express.Router();
const { Product, Currency, Brand, Component, FinalProduct } = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name", "description"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name", "description"],
        },
      ],
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      userId: req.userId,
    });
    const productWithCurrency = await Product.findByPk(product.id, {
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name", "description"],
        },
      ],
    });
    res.status(201).json(productWithCurrency);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Barcode already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove userId from update data if present (should not be updated)
    const { userId, ...updateData } = req.body;
    
    await product.update(updateData);
    const updatedProduct = await Product.findOne({
      where: { id: product.id, userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
        },
        {
          model: Brand,
          as: "brand",
          attributes: ["id", "name", "description"],
        },
      ],
    });
    res.json(updatedProduct);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Barcode already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is being used in any components
    const components = await Component.findAll({
      where: { productId: req.params.id, userId: req.userId },
      include: [
        {
          model: FinalProduct,
          as: 'finalProduct',
          attributes: ['id', 'name'],
          where: { userId: req.userId },
          required: true,
        },
      ],
    });

    if (components.length > 0) {
      // Get unique final product names
      const finalProductNames = [...new Set(components.map(comp => comp.finalProduct.name))];
      const finalProductNamesList = finalProductNames.join(', ');
      
      return res.status(400).json({ 
        message: `Cannot delete this product because it is being used in the final product: ${finalProductNamesList}`,
        finalProducts: finalProductNames,
      });
    }

    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    // Check if it's a foreign key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Cannot delete this product because it is being used in one or more final products" 
      });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
