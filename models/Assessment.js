const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Event = require('./Event');
const User = require('./User');


const Assessment = db.define("Assessment", {
  grade: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Event.belongsToMany(User,{through: Assessment});
User.belongsToMany(Event,{through: Assessment});


module.exports = Assessment;