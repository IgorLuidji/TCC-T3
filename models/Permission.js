const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Permission = db.define("Permission", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descritption: {
    type: DataTypes.TEXT
  },
});


module.exports = Permission;