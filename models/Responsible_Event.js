const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Event = require('./Event');
const User = require('./User');

const Responsible_Event = db.define("Responsible_Event", {

});

Event.belongsToMany(User,{through: Responsible_Event, as: 'User'});
User.belongsToMany(Event,{through: Responsible_Event, as: 'Event'});


module.exports = Responsible_Event;