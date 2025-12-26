const express = require("express");
const router = express.Router();
const {
  FinalProduct,
  Component,
  Product,
  Currency,
  Client,
  sequelize,
} = require("../models");
const { authenticateUser } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get all final products
router.get("/", async (req, res) => {
  try {
    const finalProducts = await FinalProduct.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(finalProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single final product
router.get("/:id", async (req, res) => {
  try {
    const finalProduct = await FinalProduct.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
    });
    if (!finalProduct) {
      return res.status(404).json({ message: "Final product not found" });
    }
    res.json(finalProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create final product
router.post("/", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { components, ...finalProductData } = req.body;

    const finalProduct = await FinalProduct.create(
      {
        ...finalProductData,
        userId: req.userId,
      },
      {
        transaction,
      }
    );

    // Create components with calculations
    if (components && components.length > 0) {
      const componentData = [];

      for (const comp of components) {
        // Get product to access price_per_square_meter and available square_meters
        const product = await Product.findByPk(comp.product, { transaction });
        if (!product) {
          throw new Error(`Product with id ${comp.product} not found`);
        }

        const length = parseFloat(comp.length);
        const width = parseFloat(comp.width);
        const quantity = parseFloat(comp.quantity) || 1;
        const squareMeters = length * width; // Square meters per unit
        const totalMeters = quantity * squareMeters; // Total square meters

        // Validate that total_meters doesn't exceed available square_meters
        if (totalMeters > parseFloat(product.square_meters)) {
          throw new Error(
            `Total square meters (${totalMeters.toFixed(
              2
            )}) exceeds available square meters (${
              product.square_meters
            }) for product ${product.name}`
          );
        }

        const pricePerSquareMeter = parseFloat(product.price_per_square_meter);
        const totalPrice = totalMeters * pricePerSquareMeter;

        componentData.push({
          finalProductId: finalProduct.id,
          productId: comp.product,
          length: length,
          width: width,
          quantity: quantity,
          square_meters: squareMeters,
          total_meters: totalMeters,
          total_price: totalPrice,
          image: comp.image || null,
          userId: req.userId,
        });
      }

      await Component.bulkCreate(componentData, { transaction });
    }

    await transaction.commit();

    // Fetch with relations
    const productWithRelations = await FinalProduct.findByPk(finalProduct.id, {
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
    });

    res.status(201).json(productWithRelations);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

// Set final product to done (MUST come before /:id route)
router.put("/:id/done", async (req, res) => {
  try {
    const finalProduct = await FinalProduct.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!finalProduct) {
      return res.status(404).json({ message: "Final product not found" });
    }

    await finalProduct.update({ status: "done" });

    const updatedProduct = await FinalProduct.findByPk(finalProduct.id, {
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset final product to pending (MUST come before /:id route)
router.put("/:id/reset", async (req, res) => {
  try {
    const finalProduct = await FinalProduct.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!finalProduct) {
      return res.status(404).json({ message: "Final product not found" });
    }

    await finalProduct.update({ status: "pending" });

    const updatedProduct = await FinalProduct.findByPk(finalProduct.id, {
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update final product
router.put("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const finalProduct = await FinalProduct.findOne({
      where: { id: req.params.id, userId: req.userId },
      transaction,
    });
    if (!finalProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Final product not found" });
    }

    const { components, ...finalProductData } = req.body;

    // Update components if provided
    if (components && components.length > 0) {
      // Delete existing components
      await Component.destroy({
        where: { finalProductId: finalProduct.id, userId: req.userId },
        transaction,
      });

      // Create new components with calculations
      const componentData = [];

      for (const comp of components) {
        // Get product to access price_per_square_meter and available square_meters
        const product = await Product.findOne({
          where: { id: comp.product, userId: req.userId },
          transaction,
        });
        if (!product) {
          throw new Error(`Product with id ${comp.product} not found`);
        }

        const length = parseFloat(comp.length);
        const width = parseFloat(comp.width);
        const quantity = parseFloat(comp.quantity) || 1;
        const squareMeters = length * width; // Square meters per unit
        const totalMeters = quantity * squareMeters; // Total square meters

        // Validate that total_meters doesn't exceed available square_meters
        if (totalMeters > parseFloat(product.square_meters)) {
          throw new Error(
            `Total square meters (${totalMeters.toFixed(
              2
            )}) exceeds available square meters (${
              product.square_meters
            }) for product ${product.name}`
          );
        }

        const pricePerSquareMeter = parseFloat(product.price_per_square_meter);
        const totalPrice = totalMeters * pricePerSquareMeter;

        componentData.push({
          finalProductId: finalProduct.id,
          productId: comp.product,
          length: length,
          width: width,
          quantity: quantity,
          square_meters: squareMeters,
          total_meters: totalMeters,
          total_price: totalPrice,
          image: comp.image || null,
          userId: req.userId,
        });
      }

      await Component.bulkCreate(componentData, { transaction });
    }

    await finalProduct.update(finalProductData, { transaction });
    await transaction.commit();

    // Fetch with relations
    const updatedProduct = await FinalProduct.findByPk(finalProduct.id, {
      where: { userId: req.userId },
      include: [
        {
          model: Currency,
          as: "currency",
          attributes: ["id", "code", "name", "symbol"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "fullName", "number", "email", "address"],
          where: { userId: req.userId },
          required: false,
        },
        {
          model: Component,
          as: "components",
          where: { userId: req.userId },
          required: false,
          include: [
            {
              model: Product,
              as: "product",
              where: { userId: req.userId },
              required: false,
              include: [
                {
                  model: Currency,
                  as: "currency",
                  attributes: ["id", "code", "name", "symbol"],
                  where: { userId: req.userId },
                  required: false,
                },
              ],
              attributes: [
                "id",
                "name",
                "barcode",
                "price_per_square_meter",
                "square_meters",
                "description",
              ],
            },
          ],
        },
      ],
    });

    res.json(updatedProduct);
  } catch (error) {
    await transaction.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Code already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete final product
router.delete("/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const finalProduct = await FinalProduct.findOne({
      where: { id: req.params.id, userId: req.userId },
      transaction,
    });
    if (!finalProduct) {
      await transaction.rollback();
      return res.status(404).json({ message: "Final product not found" });
    }
    await Component.destroy({
      where: { finalProductId: finalProduct.id, userId: req.userId },
      transaction,
    });
    await finalProduct.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Final product deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
