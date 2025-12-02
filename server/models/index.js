const sequelize = require('../config/database');
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const FinalProduct = require('./FinalProduct')(sequelize);
const Component = require('./Component')(sequelize);

// Define associations
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

FinalProduct.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(FinalProduct, { foreignKey: 'categoryId', as: 'finalProducts' });

Component.belongsTo(FinalProduct, { foreignKey: 'finalProductId', as: 'finalProduct' });
Component.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
FinalProduct.hasMany(Component, { foreignKey: 'finalProductId', as: 'components' });
Product.hasMany(Component, { foreignKey: 'productId', as: 'components' });

module.exports = {
  sequelize,
  Category,
  Product,
  FinalProduct,
  Component
};

