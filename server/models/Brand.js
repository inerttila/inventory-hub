const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Brand = sequelize.define(
    "Brand",
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "brands",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["name", "userId"],
        },
      ],
    }
  );

  return Brand;
};

