const express = require('express');
const router = express.Router();
const { FinalProduct, Category, Component, Product, sequelize } = require('../models');

// Get all final products
router.get('/', async (req, res) => {
  try {
    const finalProducts = await FinalProduct.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Component,
          as: 'components',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'product_code', 'price']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(finalProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single final product
router.get('/:id', async (req, res) => {
  try {
    const finalProduct = await FinalProduct.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Component,
          as: 'components',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'product_code', 'price', 'unit']
          }]
        }
      ]
    });
    
    if (!finalProduct) {
      return res.status(404).json({ message: 'Final product not found' });
    }
    res.json(finalProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create final product
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { components, ...finalProductData } = req.body;
    
    // Map 'category' to 'categoryId' if provided
    if (finalProductData.category && !finalProductData.categoryId) {
      finalProductData.categoryId = finalProductData.category;
      delete finalProductData.category;
    }
    
    // Calculate total price from components
    const totalPrice = components.reduce((sum, comp) => {
      return sum + (parseFloat(comp.quantity) * parseFloat(comp.unit_price));
    }, 0);
    
    finalProductData.total_price = totalPrice;
    
    // Calculate final selling price if profit margin is set
    if (finalProductData.profit_margin > 0) {
      finalProductData.final_selling_price = totalPrice * (1 + parseFloat(finalProductData.profit_margin) / 100);
    }
    
    const finalProduct = await FinalProduct.create(finalProductData, { transaction });
    
    // Create components
    if (components && components.length > 0) {
      const componentData = components.map(comp => ({
        finalProductId: finalProduct.id,
        productId: comp.product,
        quantity: comp.quantity,
        unit_price: comp.unit_price
      }));
      
      await Component.bulkCreate(componentData, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch with relations
    const productWithRelations = await FinalProduct.findByPk(finalProduct.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Component,
          as: 'components',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'product_code', 'price']
          }]
        }
      ]
    });
    
    res.status(201).json(productWithRelations);
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Product code or barcode already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Update final product
router.put('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const finalProduct = await FinalProduct.findByPk(req.params.id);
    if (!finalProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Final product not found' });
    }
    
    const { components, ...finalProductData } = req.body;
    
    // Map 'category' to 'categoryId' if provided
    if (finalProductData.category && !finalProductData.categoryId) {
      finalProductData.categoryId = finalProductData.category;
      delete finalProductData.category;
    }
    
    // Calculate total price from components if provided
    if (components && components.length > 0) {
      const totalPrice = components.reduce((sum, comp) => {
        return sum + (parseFloat(comp.quantity) * parseFloat(comp.unit_price));
      }, 0);
      
      finalProductData.total_price = totalPrice;
      
      // Calculate final selling price if profit margin is set
      if (finalProductData.profit_margin > 0) {
        finalProductData.final_selling_price = totalPrice * (1 + parseFloat(finalProductData.profit_margin) / 100);
      }
      
      // Delete existing components
      await Component.destroy({
        where: { finalProductId: finalProduct.id },
        transaction
      });
      
      // Create new components
      const componentData = components.map(comp => ({
        finalProductId: finalProduct.id,
        productId: comp.product,
        quantity: comp.quantity,
        unit_price: comp.unit_price
      }));
      
      await Component.bulkCreate(componentData, { transaction });
    }
    
    await finalProduct.update(finalProductData, { transaction });
    await transaction.commit();
    
    // Fetch with relations
    const updatedProduct = await FinalProduct.findByPk(finalProduct.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Component,
          as: 'components',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'product_code', 'price']
          }]
        }
      ]
    });
    
    res.json(updatedProduct);
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Product code or barcode already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete final product
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const finalProduct = await FinalProduct.findByPk(req.params.id);
    if (!finalProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Final product not found' });
    }
    
    // Delete associated components first
    await Component.destroy({
      where: { finalProductId: finalProduct.id },
      transaction
    });
    
    await finalProduct.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Final product deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

