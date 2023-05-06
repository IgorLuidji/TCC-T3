module.exports.checkNoAuth = function (req, res, next) {
  const userId = req.session ? req.session.userid : false;
  console.log('noAuth user: ' + userId)

  if (userId) {
    res.redirect('/')
    return;
  }

  next()
}