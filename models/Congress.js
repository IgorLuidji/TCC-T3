const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Congress = db.define("Congress", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  dateEnd: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  bol_address: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  description:{
    type:DataTypes.TEXT,
    allowNull: false,
  }
});

module.exports = Congress;