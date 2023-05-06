const express = require('express')
const router = express.Router()
const CongressController = require('../controllers/CongressController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'congress','read'), asyncHandler(CongressController.index))
router.get('/novo', checkAuth.bind(undefined, 'congress','create'), asyncHandler(CongressController.create))
router.post('/novo', checkAuth.bind(undefined, 'congress','create'), asyncHandler(CongressController.createPost))
router.get('/editar/:id', checkAuth.bind(undefined, 'congress','update'), asyncHandler(CongressController.edit))
router.post('/editar', checkAuth.bind(undefined, 'congress','update'), asyncHandler(CongressController.editPost))
router.get('/excluir/:id', checkAuth.bind(undefined, 'congress','delete'), asyncHandler(CongressController.delete))
router.post('/excluir', checkAuth.bind(undefined, 'congress','delete'), asyncHandler(CongressController.deletePost))
router.get('/exportar-pdf', checkAuth.bind(undefined, 'congress','export'), asyncHandler(CongressController.exportPdf))
router.get('/exportar-csv', checkAuth.bind(undefined, 'congress','export'), asyncHandler(CongressController.exportCsv))
router.get('/:id', checkAuth.bind(undefined, 'congress','read'), asyncHandler(CongressController.view))

module.exports = router