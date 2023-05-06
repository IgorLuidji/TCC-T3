const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Profile = db.define("Profile", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descritption: {
    type: DataTypes.TEXT
  },
});


module.exports = Profile;