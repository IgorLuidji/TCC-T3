const express = require('express')
const router = express.Router()
const EventController = require('../controllers/EventController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/', checkAuth.bind(undefined, 'event','read'), asyncHandler(EventController.index))
router.get('/congresso/:congress/novo', checkAuth.bind(undefined, 'event','create'), asyncHandler(EventController.create))
router.post('/congresso/:congress/novo', checkAuth.bind(undefined, 'event','create'), asyncHandler(EventController.createPost))
router.get('/editar/:id', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.edit))
router.post('/editar', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.editPost))
router.get('/excluir/:id', checkAuth.bind(undefined, 'event','delete'), asyncHandler(EventController.delete))
router.post('/excluir', checkAuth.bind(undefined, 'event','delete'), asyncHandler(EventController.deletePost))
router.get('/inscricoes/:id', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.subscription))
router.post('/inscricoes', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.subscriptionPost))
router.get('/participacao/:id', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.participation))
router.post('/participacao', checkAuth.bind(undefined, 'event','update'), asyncHandler(EventController.participationPost))
router.get('/congresso/:congress/exportar-csv', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportCsv))
router.get('/congresso/:congress/exportar-pdf', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportPdf))
router.get('/inscricoes/:id/exportar-csv', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportSubscriptionCsv))
router.get('/inscricoes/:id/exportar-pdf', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportSubscriptionPdf))
router.get('/participacao/:id/exportar-csv', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportParticipationCsv))
router.get('/participacao/:id/exportar-pdf', checkAuth.bind(undefined, 'event','export'), asyncHandler(EventController.exportParticipationPdf))
router.get('/:id', checkAuth.bind(undefined, 'event','read'), asyncHandler(EventController.view))

module.exports = router