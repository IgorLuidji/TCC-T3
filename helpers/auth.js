const helpers = require("../helpers/helpers");
const moment = require('moment');

module.exports.checkAuth = async function (permission, type , req, res, next) {
  const userId = req.session ? req.session.userid : false;
  console.log('Auth user: ' + userId + ' ' + moment(new Date()).format('HH:mm:ss DD-MM-YYYY'))

  if (!(userId && await helpers.getUser(userId))) {
    let url = req.originalUrl
    req.session.destroy()
    const { encrypt, decrypt } = require('./crypto');
    let encryptUrl = encrypt(url);
    res.redirect('/login?i='+encryptUrl.iv+'&t='+encryptUrl.content)
    return;
  }


  const check = await helpers.checkPermission(userId, permission, type)
  if(!check){
    req.flash('message', 'Seu usuário não tem a  permissão necessária para essa ação')
    res.render('communs/error',{login:true})
    return
  }

  next()
}