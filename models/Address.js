const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Congress = require('./Congress')

const Address = db.define("Address", {
  cep: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  street: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  complement: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Address.belongsTo(Congress, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' })

module.exports = Address;