const { DataTypes } = require("sequelize");

const db = require("../db/conn");

const Congress = require('./Congress')

const Event = db.define("Event", {
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
  bol_local: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  local: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description:{
    type:DataTypes.TEXT,
    allowNull: false,
  },
  bol_limit: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  limit: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
});


Congress.hasMany(Event, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' })
Event.belongsTo(Congress, { foreignKey: { allowNull: false }, onDelete: 'RESTRICT' })

module.exports = Event;