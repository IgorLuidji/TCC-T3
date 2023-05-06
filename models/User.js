const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Profile = require('./Profile')

const User = db.define("User", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  infoExtras:{
    type:DataTypes.BLOB
  }
});

Profile.hasMany(User, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' })
User.belongsTo(Profile, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' })

module.exports = User;