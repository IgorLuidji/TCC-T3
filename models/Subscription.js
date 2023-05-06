const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Event = require('./Event');
const User = require('./User');

/*
 subscriptionStatus
 0 - Aguardando
 1 - Aprovado
 2 - Negado

 participationStatus
 0 - Aguardando
 1 - Aprovado
 2 - Negado
*/

const Subscription = db.define("Subscription", {
  subscriptionStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  participationStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
});

Event.belongsToMany(User,{through: Subscription});
User.belongsToMany(Event,{through: Subscription});


module.exports = Subscription;