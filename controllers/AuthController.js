const User = require('../models/User')
const Profile = require('../models/Profile')
const helpers = require("../helpers/helpers");
const { encrypt, decrypt } = require('../helpers/crypto');
const bcrypt = require('bcryptjs')

module.exports = class UserController {
  static login(req, res) {
    if(req.query.i && req.query.t){
      req.session.url = {'iv': req.query.i, 'content': req.query.t};
    }
    res.render("auth/login",{login:true})
    return
  }

  static async loginPost(req, res) {
    const { email, password } = req.body

    // find user
    const user = await User.findOne({ where: { email: email } })

    if (!user) {
      res.render('auth/login', {
        message: 'Usuário não encontrado!',
        login:true
      })

      return
    }

    // compare password
    const passwordMatch = bcrypt.compareSync(password, user.password)

    if (!passwordMatch) {
      res.render('auth/login', {
        message: 'Senha inválida!',
        login:true
      })

      return
    }

    // auth user
     req.session.userid = user.id

    console.log('Auth Controller: ' +req.session.userid + ' - ' + user.id )

    req.session.save(() => {
      if(req.session.url){
        let url = decrypt(req.session.url);
        delete req.session.url;
        res.redirect(url)
      }else{
        res.redirect('/')
      }
      
    })
  }

  static register(req, res) {
    res.render("auth/register",{login:true})
  }

  static async registerPost(req, res) {
    const { firstName, lastName, email, password, confirmPassword,  birthDate } = req.body

    if(!(firstName && lastName && email && password && confirmPassword &&  birthDate )){
      req.flash('message', 'Por favor preencha os dados')
      res.render('auth/register',{login:true})
      return
    }
    

    // passwords match validation
    if (password != confirmPassword) {
      req.flash('message', 'As senhas não conferem, tente novamente!')
      res.render('auth/register',{login:true})
      return
    }

    // email validation
    const checkIfUserExists = await User.findOne({ where: { email: email } })

    if (checkIfUserExists) {
      req.flash('message', 'O e-mail já está em uso!')
      res.render('auth/register',{login:true})

      return
    }

    if(password.length < 8){
      req.flash('message', 'Sua senha deve ter no mínimo 8 caracteres, tente novamente!')
      res.render('auth/register',{login:true})
      return
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    const profile = await Profile.findOne({ where: { name: 'user' }});

    const user = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      birthDate,
      ProfileId: profile.id
    }

    User.create(user)
      .then((user) => {
        req.session.userid = user.id

        req.session.save(() => {
          res.redirect('/')
        })
      })
      .catch((err) => console.log(err))
  }

  static recovery(req, res) {
    res.render("auth/recovery",{login:true})
  }

  static async recoveryPost(req, res) {
    const { email } = req.body

    if(!(email)){
      req.flash('message', 'Por favor preencha os dados')
      res.render('auth/recovery',{login:true})
      return
    }

    // find user
    const user = await User.findOne({ where: { email: email } })

    if (!user) {
      res.render('auth/recovery', {
        message: 'Usuário não encontrado!',
        login:true
      })
      return
    }

    let infoExtras = {};
    if (user.infoExtras){
      infoExtras = JSON.parse(user.infoExtras);
    }

    if( !(infoExtras['recovery'] && infoExtras['recovery']['date'] && helpers.diffMinutes(new Date(Date.now()), new Date(infoExtras['recovery']['date'])) < 10)){
      let recoveryData = {};
      recoveryData['code'] = helpers.generateCode(6);
      recoveryData['date'] = Date.now();
      infoExtras['recovery'] = recoveryData;
      User.update({infoExtras: JSON.stringify(infoExtras)},{ where: { id: user.id } });

      helpers.sendMail(user.email, 'Recuperação de senha', (req.protocol + 's://' + req.get('host') + '/'+ 'nova-senha' + '/'+ user.id + '/' + recoveryData['code']), 1)
    }
    res.render('auth/recovery', {
      message: 'E-mail de recuperação enviado!',
      login:true,
      message_sucess: true
    })
  }

  static async newPassword(req, res) {
    const id = req.params.id
    let code = req.params.code

    if(!(id && code)){
      req.flash('message', 'Esse link não é válido!')
      res.render('communs/error',{login:true})
      return
    }

    code = code.toUpperCase();

    // find user
    const user = await User.findOne({ where: { id: id } })

    if (!user) {
      req.flash('message', 'Esse link não é válido!')
      res.render('communs/error',{login:true})
      return
    }

    let infoExtras = {};
    if (user.infoExtras){
      infoExtras = JSON.parse(user.infoExtras);
    }

    if( !(infoExtras['recovery'] && infoExtras['recovery']['date'] && helpers.diffMinutes(new Date(Date.now()), new Date(infoExtras['recovery']['date'])) < 10)){
      req.flash('message', 'Link expirado, por favor, tente novamente!')
      res.render('communs/error', {
        login:true
      })
      return
    }
    else{
      if( code == infoExtras['recovery']['code']){
        res.render("auth/new_password",{login:true, id: user.id, code:code})
        return
      }
      else{
        req.flash('message', 'Link expirado, por favor, tente novamente!')
        res.render('communs/error',{login:true})
        return
      }
    }
  }

  static async newPasswordPost(req, res) {
    const { id, password, confirmPassword } = req.body
    let { code } = req.body

    if(!(id && code)){
      res.render('communs/error', {
        message: 'Houve um problema no processo! Por favor, tente novamente mais tarde!',
        login:true,
      })
      return
    }

    code = code.toUpperCase();

    if(!(password && confirmPassword)){
      res.render('auth/new_password', {
        message: 'Por favor preencha os campos!',
        login:true,
        id: id
      })
      return
    }
    // passwords match validation
    if (password != confirmPassword) {
      req.flash('message', 'As senhas não conferem, tente novamente!')
      res.render('auth/new_password',{login:true,id: id, code:code})
      return
    }

    if(password.length < 8){
      req.flash('message', 'Sua senha deve ter no mínimo 8 caracteres, tente novamente!')
      res.render('auth/new_password',{login:true,id: id, code:code})
      return
    }

    // user validation
    const user = await User.findOne({ where: { id: id } })

    if (!user) {
      res.render('communs/error', {
        message: 'Houve um problema no processo! Por favor, tente novamente mais tarde!',
        login:true,
      })
      return
    }

    let infoExtras = {};
    if (user.infoExtras){
      infoExtras = JSON.parse(user.infoExtras);
    }

    if( !(infoExtras['recovery'] && infoExtras['recovery']['date'] && helpers.diffMinutes(new Date(Date.now()), new Date(infoExtras['recovery']['date'])) < 10)){
      req.flash('message', 'Link expirado, por favor, tente novamente!')
      res.render('communs/error', {
        login:true
      })
      return
    }
    else{
      if( code == infoExtras['recovery']['code']){
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password, salt)
        delete infoExtras['recovery']
        User.update({password: hashedPassword, infoExtras: JSON.stringify(infoExtras)},{ where: { id: user.id } });
        res.render('auth/new_password_completed',{login:true})
        return
      }
      else{
        req.flash('message', 'Link expirado, por favor, tente novamente!')
        res.render('communs/error',{login:true})
        return
      }
    }
  }

  static logout(req, res) {
    req.session.destroy()
    res.redirect('/login')
  }

  static async loginGoogle(req, res) {

    const { email } = req.user
    // find user
    const user = await User.findOne({ where: { email: email } })

    if(req.user.state == 'cg'){
      if (user) {
        req.flash('message', 'O e-mail já está em uso!')
        req.session.save(() => {
          res.redirect('/login')
        })
        return
      }

      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(helpers.generatePassword(20), salt)

      const profile = await Profile.findOne({ where: { name: 'user' }});

      const userCrt = {
        firstName: req.user.given_name,
        lastName: req.user.family_name,
        email,
        password: hashedPassword,
        birthDate: (new Date(Date.now())),
        ProfileId: profile.id
      }
      User.create(userCrt)
      .then((user) => {
        req.session.userid = user.id
        req.flash('message', 'Por favor ajuste sua data de aniversário!')
        req.session.save(() => {
          res.redirect('/editar-usuario')
        })
      })
      .catch((err) => console.log(err))
    }
    else{
      if (!user) {
        req.flash('message', 'Usuário não encontrado!')
        req.session.save(() => {
          res.redirect('/login')
        })
        return
      }

      // auth user
      req.session.userid = user.id

      console.log('Auth Controller: ' +req.session.userid + ' - ' + user.id )

      req.session.save(() => {
        if(req.session.url){
          let url = decrypt(req.session.url);
          delete req.session.url;
          res.redirect(url)
        }else{
          res.redirect('/')
        }
        
      })
    }
  }

  static async loginFacebook(req, res) {
    const { email } = req.user._json
    // find user
    const user = await User.findOne({ where: { email: email } })

    if(req.user.state == 'cg'){
      if (user) {
        req.flash('message', 'O e-mail já está em uso!')
        req.session.save(() => {
          res.redirect('/login')
        })
        return
      }

      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(helpers.generatePassword(20), salt)

      const profile = await Profile.findOne({ where: { name: 'user' }});

      const userCrt = {
        firstName: req.user._json.first_name,
        lastName: req.user._json.last_name,
        email,
        password: hashedPassword,
        birthDate: (new Date(req.user._json.birthday)),
        ProfileId: profile.id
      }
      User.create(userCrt)
      .then((user) => {
        req.session.userid = user.id
        req.session.save(() => {
          res.redirect('/')
        })
      })
      .catch((err) => console.log(err))
    }
    else{
      if (!user) {
        req.flash('message', 'Usuário não encontrado!')
        req.session.save(() => {
          res.redirect('/login')
        })
        return
      }

      // auth user
      req.session.userid = user.id

      console.log('Auth Controller: ' +req.session.userid + ' - ' + user.id )

      req.session.save(() => {
        if(req.session.url){
          let url = decrypt(req.session.url);
          delete req.session.url;
          res.redirect(url)
        }else{
          res.redirect('/')
        }
        
      })
    }
  }
}