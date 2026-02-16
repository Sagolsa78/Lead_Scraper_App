const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    rating: {
      type: DataTypes.FLOAT,
    },
    website: {
      type: DataTypes.STRING,
    },
    googleMapsUrl: {
      type: DataTypes.TEXT,
    },
    businessType: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    searchKeyword: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["phone"],
      },
    ],
  },
);

module.exports = Lead;
