const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Currency = sequelize.define(
    "Currency",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 3],
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      symbol: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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
      tableName: "currencies",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["code", "userId"],
        },
      ],
    }
  );

  return Currency;
};
