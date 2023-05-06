const express = require('express')
const router = express.Router()
const UserController = require('../controllers/UserController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'user','read'), asyncHandler(UserController.index))
router.get('/novo', checkAuth.bind(undefined, 'user','create'), asyncHandler(UserController.create))
router.post('/novo', checkAuth.bind(undefined, 'user','create'), asyncHandler(UserController.createPost))
router.get('/editar/:id', checkAuth.bind(undefined, 'user','update'), asyncHandler(UserController.edit))
router.post('/editar', checkAuth.bind(undefined, 'user','update'), asyncHandler(UserController.editPost))
router.get('/excluir/:id', checkAuth.bind(undefined, 'user','delete'), asyncHandler(UserController.delete))
router.post('/excluir', checkAuth.bind(undefined, 'user','delete'), asyncHandler(UserController.deletePost))
router.get('/exportar-pdf', checkAuth.bind(undefined, 'user','export'), asyncHandler(UserController.exportPdf))
router.get('/exportar-csv', checkAuth.bind(undefined, 'user','export'), asyncHandler(UserController.exportCsv))
router.get('/:id', checkAuth.bind(undefined, 'user','read'), asyncHandler(UserController.view))

module.exports = router