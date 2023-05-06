const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/AuthController')
const passport = require('passport');
require('../config/oauth2/googleConfig');
require('../config/oauth2/facebookConfig');
const checkNoAuth = require("../helpers/noAuth").checkNoAuth;
const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

router.get('/check', (req, res) => {res.send('OK!')})
router.get('/login', checkNoAuth, asyncHandler(AuthController.login))
router.post('/login', checkNoAuth , asyncHandler(AuthController.loginPost))
router.get('/cadastro', checkNoAuth , asyncHandler(AuthController.register))
router.post('/cadastro', checkNoAuth , asyncHandler(AuthController.registerPost))
router.get('/recuperar', checkNoAuth , asyncHandler(AuthController.recovery))
router.post('/recuperar', checkNoAuth , asyncHandler(AuthController.recoveryPost))
router.get('/nova-senha/:id/:code', checkNoAuth , asyncHandler(AuthController.newPassword))
router.post('/nova-senha', checkNoAuth , asyncHandler(AuthController.newPasswordPost))
router.get('/logout', AuthController.logout)
router.get('/login-google', checkNoAuth, asyncHandler(passport.authenticate('google',{scope:['email','profile'], state: 'lg'})))
router.get('/create-google', checkNoAuth, asyncHandler(passport.authenticate('google',{scope:['email','profile'], state: 'cg'})))
router.get('/google/callback', checkNoAuth, asyncHandler(passport.authenticate('google',{
  successRedirect: '/login-google-callback',
  failureRedirect: '/login'
})))
router.get('/login-google-callback', checkNoAuth, asyncHandler(AuthController.loginGoogle))
router.get('/login-facebook', checkNoAuth, asyncHandler(passport.authenticate('facebook',{scope:['email'], state: 'lg'})))
router.get('/create-facebook', checkNoAuth, asyncHandler(passport.authenticate('facebook',{scope:['email'], state: 'cg'})))
router.get('/facebook/callback', checkNoAuth, asyncHandler(passport.authenticate('facebook',{
  successRedirect: '/login-facebook-callback',
  failureRedirect: '/login'
})))
router.get('/login-facebook-callback', checkNoAuth, asyncHandler(AuthController.loginFacebook))

module.exports = router