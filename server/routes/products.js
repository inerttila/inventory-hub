const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    // Map 'category' to 'categoryId' if provided
    const productData = { ...req.body };
    if (productData.category && !productData.categoryId) {
      productData.categoryId = productData.category;
      delete productData.category;
    }
    
    const product = await Product.create(productData);
    const productWithCategory = await Product.findByPk(product.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });
    res.status(201).json(productWithCategory);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Product code or barcode already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Map 'category' to 'categoryId' if provided
    const updateData = { ...req.body };
    if (updateData.category && !updateData.categoryId) {
      updateData.categoryId = updateData.category;
      delete updateData.category;
    }
    
    await product.update(updateData);
    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });
    res.json(updatedProduct);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Product code or barcode already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

