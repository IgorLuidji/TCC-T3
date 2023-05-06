const express = require('express')
const router = express.Router()
const ProfileController = require('../controllers/ProfileController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'profile','read'), asyncHandler(ProfileController.index))
router.get('/novo', checkAuth.bind(undefined, 'profile','create'), asyncHandler(ProfileController.create))
router.post('/novo', checkAuth.bind(undefined, 'profile','create'), asyncHandler(ProfileController.createPost))
router.get('/editar/:id', checkAuth.bind(undefined, 'profile','update'), asyncHandler(ProfileController.edit))
router.get('/editar/', checkAuth.bind(undefined, 'profile','update'), asyncHandler(ProfileController.edit))
router.post('/editar', checkAuth.bind(undefined, 'profile','update'), asyncHandler(ProfileController.editPost))
router.get('/excluir/:id', checkAuth.bind(undefined, 'profile','delete'), asyncHandler(ProfileController.delete))
router.post('/excluir', checkAuth.bind(undefined, 'profile','delete'), asyncHandler(ProfileController.deletePost))
router.get('/exportar-pdf', checkAuth.bind(undefined, 'profile','export'), asyncHandler(ProfileController.exportPdf))
router.get('/exportar-csv', checkAuth.bind(undefined, 'profile','export'), asyncHandler(ProfileController.exportCsv))
router.get('/:id', checkAuth.bind(undefined, 'profile','read'), asyncHandler(ProfileController.view))

module.exports = router