const express = require('express')
const router = express.Router()
const EventPublicController = require('../controllers/EventPublicController')
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const checkAuth = require("../helpers/auth").checkAuth;

router.get('/congresso/:id_congress', asyncHandler(EventPublicController.congress))
router.get('/congresso/:id_congress/pagina/:id_event', asyncHandler(EventPublicController.page))
router.get('/inscricao/:id_event', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.subscription))
router.post('/inscricao/:id_event', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.subscriptionPost))
router.get('/certificado/:id_event', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.certificate))
router.get('/avaliar/:id_event', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.assessment))
router.post('/avaliar', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.assessmentPost))
router.get('/cancelar/:id_event', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.cancel))
router.post('/cancelar', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.cancelPost))
router.get('/', checkAuth.bind(undefined, 'index',''), asyncHandler(EventPublicController.index))

module.exports = router