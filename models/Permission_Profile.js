const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Permission = require('./Permission');
const Profile = require('./Profile');

const Permission_Profile = db.define("Permission_Profile", {
  numPermission: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});

Profile.belongsToMany(Permission,{through: Permission_Profile});
Permission.belongsToMany(Profile,{through: Permission_Profile});


module.exports = Permission_Profile;