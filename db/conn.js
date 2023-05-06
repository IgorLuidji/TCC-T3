const { Sequelize } = require('sequelize')
const fs = require('fs');
const configJson = require('../config/config')
const env = process.env.NODE_ENV || 'development';
const config = configJson[env];
let sequelize;

if (config.environment === 'production') {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port:process.env.DB_PORT,
    dialect: 'mysql',
    logging: true
  })
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}


try {
  sequelize.authenticate()
  console.log('Conectamos com o Sequelize!')
} catch (error) {
  console.error('Não foi possível conectar:', error)
}

module.exports = sequelize