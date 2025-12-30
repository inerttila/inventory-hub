const sequelize = require('../config/database');
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const FinalProduct = require('./FinalProduct')(sequelize);
const Component = require('./Component')(sequelize);
const Currency = require('./Currency')(sequelize);
const Client = require('./Client')(sequelize);
const Brand = require('./Brand')(sequelize);

// Define associations

Component.belongsTo(FinalProduct, { foreignKey: 'finalProductId', as: 'finalProduct' });
Component.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
FinalProduct.hasMany(Component, { foreignKey: 'finalProductId', as: 'components' });
Product.hasMany(Component, { foreignKey: 'productId', as: 'components' });

Product.belongsTo(Currency, { foreignKey: 'currencyId', as: 'currency' });
Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });
FinalProduct.belongsTo(Currency, { foreignKey: 'currencyId', as: 'currency' });
Currency.hasMany(Product, { foreignKey: 'currencyId', as: 'products' });
Currency.hasMany(FinalProduct, { foreignKey: 'currencyId', as: 'finalProducts' });
Brand.hasMany(Product, { foreignKey: 'brandId', as: 'products' });

FinalProduct.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Client.hasMany(FinalProduct, { foreignKey: 'clientId', as: 'finalProducts' });

module.exports = {
  sequelize,
  Category,
  Product,
  FinalProduct,
  Component,
  Currency,
  Client,
  Brand
};

