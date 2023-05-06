const sequelize = require("sequelize");
const User = require('../models/User')
const Profile = require('../models/Profile')
const BaseController = require('./BaseController')
const helpers = require("../helpers/helpers");
const bcrypt = require('bcryptjs')
const filename = "usuario"
const fields = ['Cod', 'Nome', 'E-mail', 'Perfil'];

module.exports = class UserController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res, 'user');
    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    controller['dataColumns'] = ['Cod', 'Nome', 'E-mail', 'Perfil'];
    const { data, listInfo } =  await list({}, pag, lim);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    res.render("user/list", controller)
  }

  static async create(req, res) {
    let controller =  await super.dataController(req, res, 'user');
    let data =  await Profile.findAll({ raw: true, attributes: ['id' , 'name']}).then((data) => helpers.formatData(data));
    controller['listProfile']= data;
    res.render("user/create", controller)
  }

  static async createPost(req, res) {
    const { firstName, lastName, email, password, birthDate, profile_cod  } = req.body


    if(!(firstName && lastName && email && password && birthDate && profile_cod )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/usuario/novo')
      })
      return
    }

    const checkIfUserExists = await User.findOne({ where: { email: email } })

    if (checkIfUserExists) {
      req.flash('message', 'O e-mail já está em uso!')
      req.session.save(() => {
        res.redirect('/usuario/novo')
      })
      return
    }

    const profile = await Profile.findOne({ where: { id: profile_cod }});

    if (!profile) {
      req.flash('message', 'O perfil selecionado não foi encontrado')
      req.session.save(() => {
        res.redirect('/usuario/novo')
      })
      return
    }

    if (password.length < 8) {
      req.flash('message', 'A senha deve ter no mínimo 8 caracteres, tente novamente!')
      req.session.save(() => {
        res.redirect('/usuario/novo')
      })
      return
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

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
        req.flash('message_sucess', 'Usuário criado com sucesso')
        req.session.save(() => {
          res.redirect('/usuario')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async view(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }

    let controller =  await super.dataController(req, res, 'user');

    const user = await User.findOne({raw: true, where: { id }});
    if(!(user)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }
    controller['userData'] = user;
    
    let data =  await Profile.findAll({ raw: true, attributes: ['id' , 'name']}).then((data) => helpers.formatData(data));
    
    for (const [key, value] of Object.entries(data)) {
      if(data[key]['id'] == user['ProfileId'])
        data[key]['checked'] = true
    }

    controller['listProfile']= data;

    res.render("user/view", controller)
  }

  static async edit(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'user');

    const user = await User.findOne({raw: true, where: { id }});
    if(!(user)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }
    controller['userData'] = user;

    let data =  await Profile.findAll({ raw: true, attributes: ['id' , 'name']}).then((data) => helpers.formatData(data));
    
    for (const [key, value] of Object.entries(data)) {
      if(data[key]['id'] == user['ProfileId'])
        data[key]['checked'] = true
    }

    controller['listProfile']= data;
    
    res.render("user/edit", controller)
  }

  static async editPost(req, res) {
    const { id, firstName, lastName, email, password, birthDate, profile_cod  } = req.body

    if(!(id)){
      req.flash('message', 'Esse usuário não pode ser editado.')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }

    if(!(firstName && lastName && email && birthDate && profile_cod )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/usuario/editar/'+id)
      })
      return
    }

    const checkIfUserExists = await User.findOne({ where: { email: email , id: {[sequelize.Op.not]: id}} })

    if (checkIfUserExists) {
      req.flash('message', 'O e-mail já está em uso!')
      req.session.save(() => {
        res.redirect('/usuario/editar/'+id)
      })
      return
    }

    const profile = await Profile.findOne({ where: { id: profile_cod }});

    if (!profile) {
      req.flash('message', 'O perfil selecionado não foi encontrado')
      req.session.save(() => {
        res.redirect('/usuario/editar/'+id)
      })
      return
    }

    let user = {
      firstName,
      lastName,
      email,
      birthDate,
      ProfileId: profile.id
    }

    if(password){
      if (password.length < 8) {
        req.flash('message', 'A senha deve ter no mínimo 8 caracteres, tente novamente!')
        req.session.save(() => {
          res.redirect('/usuario/editar/'+id)
        })
        return
      }
      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(password, salt)
      user['password'] = hashedPassword;
    }

    

    User.update(user, { where: { id: id } })
      .then(async (user) => {
        req.flash('message_sucess', 'Usuário atualizado com sucesso')
        req.session.save(() => {
          res.redirect('/usuario')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async delete(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'user');

    const user = await User.findOne({raw: true, where: { id }});
    if(!(user)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }
    controller['userData'] = user;

    res.render("user/delete", controller)
  }

  static async deletePost(req, res) {
    const { id } = req.body

    if(!(id)){
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }

    const checkIfUserExists = await User.findOne({ where: { id: id} })

    if (!(checkIfUserExists)) {
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }

    if (checkIfUserExists.id == 1) {
      req.flash('message', 'Usuário não pode ser deletado!')
      req.session.save(() => {
        res.redirect('/usuario')
      })
      return
    }

    User.destroy( { where: { id: id } })
      .then(async (user) => {
        req.flash('message_sucess', 'Usuário excluído com sucesso')
        req.session.save(() => {
          res.redirect('/usuario')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Usuário não pode ser excluído, verifique se ele possuí registros associados!')
        req.session.save(() => {
          res.redirect('/usuario')
          return
        })
      })
  }

  static async exportPdf(req, res) {
    await super.exportPdf(filename, fields, await listExp(), req, res )
    return
  }

  static async exportCsv(req, res) {
    await super.exportCsv(filename, fields, await listExp(), req, res )
    return
  }

}



async function list(where = {}, page = 1, limit = 5 ){
  const data =  await User.findAll({ raw: true, include: [{model: Profile, required: true, attributes: [['name','profileName']]}], where: where, offset: ((page-1)*limit), order: [['id', 'DESC']] , limit , attributes: [['id', 'cod'],['firstName','fname'],['lastName','lname'],'email']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
  const count = await User.count();
  const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
  const next = (total > page) ? page+1 : false
  const beforte = (page > 1) ? page-1 : false
  const group ={}
  group[limit] = true
  const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
  return {data, listInfo};
}

async function listExp(where = {} ){
  const data =  await User.findAll({ raw: true, include: [{model: Profile, required: true, attributes: [['name','profileName']]}], where: where,  order: [['id', 'DESC']] , attributes: [['id', 'cod'],['firstName','fname'],['lastName','lname'],'email']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
  let exportData = [];
  data.map((dat) => {
    exportData.push({
      'Cod': dat['cod'],
      'Nome': (dat['fname'] + ' ' + dat['lname']),
      'E-mail': dat['email'],
      'Perfil':dat['profileName']
    });
  })
  return exportData;
}