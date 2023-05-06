const express = require('express')
const router = express.Router()
const ReportsController = require('../controllers/ReportsController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'reports','read'), asyncHandler(ReportsController.index))

module.exports = router