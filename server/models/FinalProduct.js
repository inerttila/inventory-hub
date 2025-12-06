const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FinalProduct = sequelize.define(
    "FinalProduct",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currencyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "currencies",
          key: "id",
        },
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "clients",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("pending", "done"),
        allowNull: false,
        defaultValue: "pending",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      applyTVSH: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "final_products",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["code", "userId"],
        },
      ],
    }
  );

  return FinalProduct;
};
