const sequelize = require("sequelize");
const Congress = require('../models/Congress')
const Address = require('../models/Address')
const Event = require('../models/Event')
const BaseController = require('./BaseController')
const helpers = require("../helpers/helpers");
const bcrypt = require('bcryptjs')
const moment = require('moment');
const filename = "congresso"
const fields = ['Cod', 'Nome', 'Data de Início', 'Data de Termino'];

module.exports = class CongressController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res, 'congress');
    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    controller['dataColumns'] = ['Cod', 'Nome' , 'Data de Início', 'Data de Termino'];
    const { data, listInfo } =  await list({}, pag, lim);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    res.render("congress/list", controller)
  }

  static async create(req, res) {
    let controller =  await super.dataController(req, res, 'congress');
    
    res.render("congress/create", controller)
  }

  static async createPost(req, res) {
    const { name, date, dateEnd, description } = req.body
    let {bol_address , address} = req.body 
    bol_address = bol_address ? true : false

    if(!(name && date && dateEnd && description )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/congresso/novo')
      })
      return
    }

    if(!((new Date(Date.now())).getTime() < (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que a data atual')
      req.session.save(() => {
        res.redirect('/congresso/novo')
      })
      return
    }

    if(!((new Date(date)).getTime() < (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de inicio não pode ser maior do que a data de termino')
      req.session.save(() => {
        res.redirect('/congresso/novo')
      })
      return
    }

    if(bol_address){
      if(!(address.cep != '' && address.state != '' && address.city != '' && address.district != '' && address.street != '' && address.number != '')){
        req.flash('message', 'Por favor preencha os dados')
        req.session.save(() => {
          res.redirect('/congresso/novo')
        })
        return
      }
    }

    const congress = {
      name, date, dateEnd, bol_address, description
    }
    

    Congress.create(congress)
      .then(async (congress) => {
        if(bol_address){
          address.CongressId = congress.id
          await Address.create(address);
        }
        req.flash('message_sucess', 'Congresso criado com sucesso')
        req.session.save(() => {
          res.redirect('/congresso')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async view(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }

    let controller =  await super.dataController(req, res, 'congress');

    let congress = await Congress.findOne({raw: true, where: { id }});
    if(!(congress)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    congress.date = (moment(new Date(congress.date)).format('YYYY-MM-DDTHH:mm'))
    congress.dateEnd = (moment(new Date(congress.dateEnd)).format('YYYY-MM-DDTHH:mm'))
    controller['congressData'] = congress;
    controller['addressData'] = [];

    if(congress.bol_address){
      controller['addressData'] = await Address.findOne({raw: true, where: { CongressId:id }});
    }
    

    res.render("congress/view", controller)
  }

  static async edit(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'congress');

    let congress = await Congress.findOne({raw: true, where: { id }});
    if(!(congress)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    if(((new Date(congress['dateEnd'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Congresso encerrado, ele não pode ser editado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    congress.date = (moment(new Date(congress.date)).format('YYYY-MM-DDTHH:mm'))
    congress.dateEnd = (moment(new Date(congress.dateEnd)).format('YYYY-MM-DDTHH:mm'))
    controller['congressData'] = congress;
    controller['addressData'] = [];

    if(congress.bol_address){
      controller['addressData'] = await Address.findOne({raw: true, where: { CongressId:id }});
    }
    
    res.render("congress/edit", controller)
  }

  static async editPost(req, res) {
    const { id, name, date, dateEnd, description  } = req.body
    let {bol_address , address} = req.body 
    bol_address = bol_address ? true : false

    if(!(id)){
      req.flash('message', 'Esse Congresso não pode ser editado.')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }

    if(!(name && date && dateEnd && description )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/congresso/editar/'+id)
      })
      return
    }


    if(!((new Date(Date.now())).getTime() < (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que a data atual')
      req.session.save(() => {
        res.redirect('/congresso/editar/'+id)
      })
      return
    }

    if(!((new Date(date)).getTime() < (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de inicio não pode ser maior do que a data de termino')
      req.session.save(() => {
        res.redirect('/congresso/editar/'+id)
      })
      return
    }

    if(bol_address){
      if(!(address.cep != '' && address.state != '' && address.city != '' && address.district != '' && address.street != '' && address.number != '')){
        req.flash('message', 'Por favor preencha os dados')
        req.session.save(() => {
          res.redirect('/congresso/editar/'+id)
        })
        return
      }
    }

    let checkIfEventExists = await Event.findOne({raw: true, where: { CongressId: id, date: { [sequelize.Op.lt]: date }} })

    if ((checkIfEventExists)) {
      req.flash('message', 'Evento não pode ser editado. Existem eventos vinculados com data de inicio inferior a selecionada.')
      req.session.save(() => {
        res.redirect('/congresso/editar/'+id)
      })
      return
    }

    checkIfEventExists = await Event.findOne({raw: true, where: { CongressId: id, dateEnd: { [sequelize.Op.gt]: dateEnd }} })

    if ((checkIfEventExists)) {
      req.flash('message', 'Evento não pode ser editado. Existem eventos vinculados com data de termino superior a selecionada.')
      req.session.save(() => {
        res.redirect('/congresso/editar/'+id)
      })
      return
    }

    const congress = {
      name, date, dateEnd, bol_address, description
    }


    Congress.update(congress, { where: { id: id } })
      .then(async (congress) => {
        await Address.destroy({
          where: {
            CongressId:id
          }
        })
        if(bol_address){
          address.CongressId = id
          await Address.create(address);
        }
        req.flash('message_sucess', 'Congresso atualizado com sucesso')
        req.session.save(() => {
          res.redirect('/congresso')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async delete(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'congress');

    const congress = await Congress.findOne({raw: true, where: { id }});
    if(!(congress)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }
    controller['congressData'] = congress;

    res.render("congress/delete", controller)
  }

  static async deletePost(req, res) {
    const { id } = req.body

    if(!(id)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }

    const checkIfCongressExists = await Congress.findOne({ where: { id: id} })

    if (!(checkIfCongressExists)) {
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/congresso')
      })
      return
    }

    Congress.destroy( { where: { id: id } })
      .then(async (congress) => {
        req.flash('message_sucess', 'Congresso excluído com sucesso')
        req.session.save(() => {
          res.redirect('/congresso')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Congresso não pode ser excluído, verifique se ele possuí registros associados!')
        req.session.save(() => {
          res.redirect('/congresso')
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
  const data =  await Congress.findAll({ raw: true, where: where, offset: ((page-1)*limit), limit, order: [['id', 'DESC']] , attributes: [['id', 'cod'],'name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
  const count = await Congress.count();
  const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
  const next = (total > page) ? page+1 : false
  const beforte = (page > 1) ? page-1 : false
  const group ={}
  group[limit] = true
  const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
  return {data, listInfo};
}

async function listExp(where = {} ){
  const data =  await Congress.findAll({ raw: true, where: where, order: [['id', 'DESC']], attributes: [['id', 'cod'],'name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
  let exportData = [];
  data.map((dat) => {
    console.log(dat['date'])
    exportData.push({
      'Cod': dat['cod'],
      'Nome': dat['name'],
      'Data de Início': dat['date'],
      'Data de Termino': dat['dateEnd']
    });
  })
  return exportData;
}