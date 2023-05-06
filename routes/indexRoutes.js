const express = require('express')
const router = express.Router()
const IndexController = require('../controllers/IndexController')
const asyncHandler = fn => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'index',''), asyncHandler(IndexController.index))
router.get('/editar-usuario', checkAuth.bind(undefined, 'index',''), asyncHandler(IndexController.editUser))
router.post('/editar-usuario', checkAuth.bind(undefined, 'index',''), asyncHandler(IndexController.editUserPost))

module.exports = router