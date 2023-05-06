require('dotenv').config();
const service = process.env.EMAIL_SERVICE;
const user = process.env.EMAIL_MAIL
const pass = process.env.EMAIL_PASS
const config = {
  service: service,
  auth: {
    user: user,
    pass: pass
  }
}

module.exports = { config , user }
