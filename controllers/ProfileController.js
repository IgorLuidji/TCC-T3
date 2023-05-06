const sequelize = require("sequelize");
const Profile = require('../models/Profile')
const Permission = require('../models/Permission')
const Permission_Profile = require('../models/Permission_Profile')
const BaseController = require('./BaseController')
const helpers = require("../helpers/helpers");
const filename = "perfil"
const fields = ['Cod', 'Nome', 'Descrição'];

module.exports = class ProfileController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res, 'profile');
    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    controller['dataColumns'] = ['Cod', 'Nome'];
    const { data, listInfo } =  await list({}, pag, lim);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    res.render("profile/list", controller)
  }

  static async create(req, res) {
    let controller =  await super.dataController(req, res, 'profile');
    let data =  await Permission.findAll({ raw: true, attributes: ['id' , 'name', 'descritption']}).then((data) => helpers.formatData(data));
    if(data[0]){
      data[0]['first'] = true
    }
    controller['listPermission']= data;
    res.render("profile/create", controller)
  }

  static async createPost(req, res) {
    const { name, descritption, permission} = req.body

    if(!(name && descritption)){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/perfil/novo')
      })
      return
    }

    const checkIfProfileExists = await Profile.findOne({ where: { name: name } })

    if (checkIfProfileExists) {
      req.flash('message', 'O nome ' + name + ' já está em uso!')
      req.session.save(() => {
        res.redirect('/perfil/novo')
      })
      return
    }
    
    const profile = {
      name, 
      descritption
    }

    Profile.create(profile)
      .then(async (profile) => {
        if(permission){
          for (const [key, value] of Object.entries(permission)) {
            const congress = await Permission.findOne({ where: { name: key }});
            if(congress){
              let numPermission =0;
              if(value.create == 'true'){
                numPermission += 1
              }
              if(value.read == 'true'){
                numPermission += 2
              }
              if(value.update == 'true'){
                numPermission += 4
              }
              if(value.delete == 'true'){
                numPermission += 8
              }
              if(value.export == 'true'){
                numPermission += 16
              }
              await profile.addPermission(congress, { through: {numPermission : numPermission } });
            }
          }
        }
        req.flash('message_sucess', 'Perfil criado com sucesso')
        req.session.save(() => {
          res.redirect('/perfil')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async view(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'profile');

    const profile = await Profile.findOne({raw: true, where: { id }});
    if(!(profile)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    controller['profile'] = profile;

    let data =  await Permission.findAll({ raw: true, attributes: ['id' , 'name', 'descritption']}).then((data) => helpers.formatData(data));
    
    if(data[0]){
      data[0]['first'] = true
    }
    for (const [key, value] of Object.entries(data)) {
      
      data[key]['checked'] = await checkPermission (id,value.name)
    }

    controller['listPermission']= data;
    res.render("profile/view", controller)
  }

  static async edit(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'profile');

    const profile = await Profile.findOne({raw: true, where: { id }});
    if(!(profile)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    controller['profile'] = profile;

    let data =  await Permission.findAll({ raw: true, attributes: ['id' , 'name', 'descritption']}).then((data) => helpers.formatData(data));
    
    if(data[0]){
      data[0]['first'] = true
    }
    for (const [key, value] of Object.entries(data)) {
      
      data[key]['checked'] = await checkPermission (id,value.name)
    }

    controller['listPermission']= data;
    res.render("profile/edit", controller)
  }

  static async editPost(req, res) {
    const { id, name, descritption, permission} = req.body

    if(!(id)){
      req.flash('message', 'Esse perfil não pode ser editado.')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }

    if(!(name && descritption)){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/perfil/editar/'+id)
      })
      return
    }

    const checkIfProfileExists = await Profile.findOne({ where: { name: name , id: {[sequelize.Op.not]: id}} })

    if (checkIfProfileExists) {
      req.flash('message', 'O nome ' + name + ' já está em uso!')
      req.session.save(() => {
        res.redirect('/perfil/editar/'+id)
      })
      return
    }

    if(name == 'user' || name == 'admin' || name == 'manager'){
      req.flash('message', 'Esse perfil não pode ser editado, por ser um perfil padrão do sistema.')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    
    const profile = {
      name, 
      descritption
    }

    Profile.update(profile, { where: { id: id } })
      .then(async (profile) => {
         
        await Permission_Profile.destroy({
            where: {
              ProfileId:id
            }
        })
        if(permission){
          for (const [key, value] of Object.entries(permission)) {
            const perm = await Permission.findOne({ where: { name: key }});
            if(perm){
              let numPermission =0;
              if(value.create == 'true'){
                numPermission += 1
              }
              if(value.read == 'true'){
                numPermission += 2
              }
              if(value.update == 'true'){
                numPermission += 4
              }
              if(value.delete == 'true'){
                numPermission += 8
              }
              if(value.export == 'true'){
                numPermission += 16
              }
              await Permission_Profile.create({ProfileId:id , PermissionId: perm.id , numPermission});
            }
          }
        }
        req.flash('message_sucess', 'Perfil atualizado com sucesso')
        req.session.save(() => {
          res.redirect('/perfil')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async delete(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'profile');

    const profile = await Profile.findOne({raw: true, where: { id }});
    if(!(profile)){
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    controller['profile'] = profile;

    res.render("profile/delete", controller)
  }

  static async deletePost(req, res) {
    const { id } = req.body

    if(!(id)){
      req.flash('message', 'Esse perfil não pode ser editado.')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }

    const checkIfProfileExists = await Profile.findOne({ where: { id: id} })

    if (!(checkIfProfileExists)) {
      req.flash('message', 'Perfil não encontrado!')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }

    if(checkIfProfileExists.name == 'user' || checkIfProfileExists.name == 'admin' || checkIfProfileExists.name == 'manager'){
      req.flash('message', 'Esse perfil não pode ser excluído, por ser um perfil padrão do sistema.')
      req.session.save(() => {
        res.redirect('/perfil')
      })
      return
    }
    

    Profile.destroy( { where: { id: id } })
      .then(async (profile) => {
        req.flash('message_sucess', 'Perfil excluído com sucesso')
        req.session.save(() => {
          res.redirect('/perfil')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Perfil não pode ser excluído, verifique se ele possuí usuários associados!')
        req.session.save(() => {
          res.redirect('/perfil')
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
  const data =  await Profile.findAll({ raw: true, where: where, order: [['id', 'DESC']], offset: ((page-1)*limit), limit , attributes: [['id', 'cod'],['name','nome']]}).then((data) => helpers.formatData(data))
  const count = await Profile.count();
  const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
  const next = (total > page) ? page+1 : false
  const beforte = (page > 1) ? page-1 : false
  const group ={}
  group[limit] = true
  const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
  return {data, listInfo};
}

async function listExp(where = {} ){
  const data =  await Profile.findAll({ raw: true, where: where, order: [['id', 'DESC']], attributes: [['id', 'cod'],['name','nome'],'descritption']}).then((data) => helpers.formatData(data))
  let exportData = [];
  data.map((dat) => {
    exportData.push({
      'Cod': dat['cod'],
      'Nome': dat['nome'],
      'Descrição': dat['descritption']
    });
  })
  return exportData;
}

function formatPermission(numPermission) {
  let perm = {};
  if(numPermission >= 16){
    perm['export'] = true
    numPermission = numPermission - 16;
  }
  else{
    perm['export'] = false
  }
  if(numPermission >= 8){
    perm['delete'] = true
    numPermission = numPermission - 8;
  }
  else{
    perm['delete'] = false
  }
  if(numPermission >= 4){
    perm['update'] = true
    numPermission = numPermission - 4;
  }
  else{
    perm['update'] = false
  }
  if(numPermission >= 2){
    perm['read'] = true
    numPermission = numPermission - 2;
  }
  else{
    perm['read'] = false
  }
  if(numPermission >= 1){
    perm['create'] = true
    numPermission = numPermission - 1;
  }
  else{
    perm['create'] = false
  }
  return perm;
}

async function getPermission (profileId) {
  const permission = await Profile.findAll({ raw: true, include: [{model: Permission, required:false, attributes: [['name' ,'namePermission']]}], where: { id: profileId }, attributes: [['name' ,'nameProfile']]}).then((data) => helpers.formatData(data));
  const permissions ={};
  permission.map((perm) => {
    let numPermission = perm['numPermission'];
    permissions[perm['namePermission']] = formatPermission(numPermission);
  })
  return permissions;
}


async function checkPermission (profileId,permission){
  const permissionProfile = await getPermission(profileId);
  if(permissionProfile[permission] && permissionProfile[permission]){
    return permissionProfile[permission]
  }
  return {export: false,delete: false,update: false,read: false,create: false}
}