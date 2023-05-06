const sequelize = require("sequelize");
const Congress = require('../models/Congress')
const Event = require('../models/Event')
const Responsible_Event = require('../models/Responsible_Event')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Subscription = require('../models/Subscription')
const Permission_Profile= require('../models/Permission_Profile')
const BaseController = require('./BaseController')
const helpers = require("../helpers/helpers");
const bcrypt = require('bcryptjs')
const moment = require('moment');
const filename = "evento"
const fields = ['Cod', 'Nome', 'Data de Início', 'Data de Termino'];
const fieldsSub = ['Nome', 'E-mail', 'Data da inscrição', 'Status'];
const status = {
  0:'Aguardando',
  1:'Confirmado',
  2:'Negado'
}

module.exports = class EventController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    controller['dataColumns'] = ['Cod', 'Nome' , 'Data de Início', 'Data de Termino'];
    if(controller.user.bolManager){
      const { data, listInfo } =  await list({}, pag, lim, controller.user.id);
      controller['data'] =  data;
      controller['listInfo'] =  listInfo;
      res.render("event/list", controller)
    }
    else{
      const { data, listInfo } =  await list({}, pag, lim);
      controller['data'] =  data;
      controller['listInfo'] =  listInfo;
      res.render("event/list", controller)
    }
  }

  static async create(req, res) {
    const congress = req.params.congress
    let controller =  await super.dataController(req, res, 'event');
    let congressData =  await Congress.findOne({ raw: true, where: { id:congress }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    congressData.dateOrigin = congressData.date
    congressData.date = (moment(new Date(congressData.date)).format('DD-MM-YYYY HH:mm'))
    congressData.dateEndOrigin = congressData.dateEnd
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('DD-MM-YYYY HH:mm'))
    controller['dataCongress']= congressData;
    let responsibleData =  await listResponsible();
    controller['dataResponsible'] = responsibleData;
    res.render("event/create", controller)
  }

  static async createPost(req, res) {
    const congr = req.params.congress
    const { CongressId, name, date, dateEnd, description, reponsible} = req.body
    let {bol_local, local , bol_limit, limit} = req.body 
    bol_local = bol_local ? true : false
    local = bol_local ? local : undefined
    bol_limit = bol_limit ? true : false
    limit = bol_limit ? limit : 0


    let congressData =  await Congress.findOne({ raw: true, where: { id:CongressId }, attributes: ['id', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    if(!(name && date && dateEnd && description )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/meus-eventos/congresso/'+ congr +'/novo')
      })
      return
    }

    if(!((new Date(Date.now())).getTime() < (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que a data atual')
      req.session.save(() => {
        res.redirect('/meus-eventos/congresso/'+ congr +'/novo')
      })
      return
    }

    if(!((new Date(date)).getTime() < (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de inicio não pode ser maior do que a data de termino')
      req.session.save(() => {
        res.redirect('/meus-eventos/congresso/'+ congr +'/novo')
      })
      return
    }
    
    if(!((new Date(congressData['date'])).getTime() <= (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que o início do Congresso')
      req.session.save(() => {
        res.redirect('/meus-eventos/congresso/'+ congr +'/novo')
      })
      return
    }

    if(!((new Date(congressData['dateEnd'])).getTime() >= (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de termino não pode ser maior do que o termino do Congresso')
      req.session.save(() => {
        res.redirect('/meus-eventos/congresso/'+ congr +'/novo')
      })
      return
    }

    const event = {
      name, date, dateEnd, bol_local, local, description, bol_limit, limit, CongressId,
    }
    

    Event.create(event)
      .then(async (event) => {
        if(reponsible){
          for(let resp of reponsible){
            await Responsible_Event.create({EventId: event.id, UserId: resp}).catch((e) => console.log('Erro ao add Resposible: ' + e));
          }
        }
        req.flash('message_sucess', 'Evento criado com sucesso')
        req.session.save(() => {
          res.redirect('/meus-eventos')
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
        res.redirect('/meus-eventos')
      })
      return
    }

    let controller =  await super.dataController(req, res, 'event');

    let event = await Event.findOne({raw: true, where: { id }});

    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    let congressData =  await Congress.findOne({ raw: true, where: { id:event.CongressId }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    event.date = (moment(new Date(event.date)).format('YYYY-MM-DDTHH:mm'))
    event.dateEnd = (moment(new Date(event.dateEnd)).format('YYYY-MM-DDTHH:mm'))
    controller['eventData'] = event;

    congressData.date = (moment(new Date(congressData.date)).format('DD-MM-YYYY HH:mm'))
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('DD-MM-YYYY HH:mm'))
    controller['dataCongress']= congressData;

    

    if(controller.user.bolManager){
      let resp = await Responsible_Event.findOne({raw: true, where: { EventId:id , UserId:  controller.user.id}});
      if(!resp){
        req.flash('message', 'Seu usuário não está vinculado a esse evento!')
        req.session.save(() => {
          res.redirect('/meus-eventos')
        })
        return
      }
    }else{
      controller['responsibleData'] = await Responsible_Event.findAll({raw: true, where: { EventId:id }});
      await Promise.all(controller['responsibleData'].map(async (element) => {
        let user =  await User.findOne({ raw: true, where: {id:element['UserId']} , attributes: ['firstName','lastName']}).then().catch(e => console.log(e))
        element['firstName'] = user['firstName'];
        element['lastName'] = user['lastName'];
      }));

    }

    res.render("event/view", controller)
  }

  static async edit(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    let controller =  await super.dataController(req, res, 'event');

    let event = await Event.findOne({raw: true, where: { id }});

    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    let congressData =  await Congress.findOne({ raw: true, where: { id:event.CongressId }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    if(((new Date(event['date'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Evento encerrado, ele não pode ser editado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    event.date = (moment(new Date(event.date)).format('YYYY-MM-DDTHH:mm'))
    event.dateEnd = (moment(new Date(event.dateEnd)).format('YYYY-MM-DDTHH:mm'))
    controller['eventData'] = event;

    congressData.dateOrigin = congressData.date
    congressData.date = (moment(new Date(congressData.date)).format('DD-MM-YYYY HH:mm'))
    congressData.dateEndOrigin = congressData.dateEnd
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('DD-MM-YYYY HH:mm'))
    controller['dataCongress']= congressData;

    

    if(controller.user.bolManager){
      let resp = await Responsible_Event.findOne({raw: true, where: { EventId:id , UserId:  controller.user.id}});
      if(!resp){
        req.flash('message', 'Seu usuário não está vinculado a esse evento!')
        req.session.save(() => {
          res.redirect('/meus-eventos')
        })
        return
      }
    }else{
      controller['responsibleData'] = await Responsible_Event.findAll({raw: true, where: { EventId:id }});
      await Promise.all(controller['responsibleData'].map(async (element) => {
        let user =  await User.findOne({ raw: true, where: {id:element['UserId']} , attributes: ['firstName','lastName']}).then().catch(e => console.log(e))
        element['firstName'] = user['firstName'];
        element['lastName'] = user['lastName'];
      }));

      let responsibleData =  await listResponsible();
      responsibleData.map(element => {
        if (controller['responsibleData'].some(e => e.UserId == element['id'])) {
          element['select'] = true;
        }
      })

      controller['dataResponsible'] = responsibleData;

    }
    
    res.render("event/edit", controller)
  }

  static async editPost(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    const { CongressId, id, name, date, dateEnd, description, reponsible} = req.body
    let {bol_local, local , bol_limit, limit} = req.body 
    bol_local = bol_local ? true : false
    local = bol_local ? local : undefined
    bol_limit = bol_limit ? true : false
    limit = bol_limit ? limit : 0

    if(!(id)){
      req.flash('message', 'Esse Evento não pode ser editado.')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    let congressData =  await Congress.findOne({ raw: true, where: { id:CongressId }, attributes: ['id', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    if(!(name && date && dateEnd && description )){
      req.flash('message', 'Por favor preencha os dados')
      req.session.save(() => {
        res.redirect('/meus-eventos/editar/'+ id)
      })
      return
    }
    
    if(!((new Date(Date.now())).getTime() < (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que a data atual')
      req.session.save(() => {
        res.redirect('/meus-eventos/editar/'+ id)
      })
      return
    }

    if(!((new Date(date)).getTime() < (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de inicio não pode ser maior do que a data de termino')
      req.session.save(() => {
        res.redirect('/meus-eventos/editar/'+ id)
      })
      return
    }

    if(!((new Date(congressData['date'])).getTime() <= (new Date(date)).getTime())){
      req.flash('message', 'A data de inicio não pode ser menor do que a data de inicio do congresso')
      req.session.save(() => {
        res.redirect('/meus-eventos/editar/'+ id)
      })
      return
    }

    if(!((new Date(congressData['dateEnd'])).getTime() >= (new Date(dateEnd)).getTime())){
      req.flash('message', 'A data de termino não pode ser maior do que a data de termino do congresso')
      req.session.save(() => {
        res.redirect('/meus-eventos/editar/'+ id)
      })
      return
    }


    const event = {
      name, date, dateEnd, bol_local, local, description, bol_limit, limit, CongressId,
    }


    Event.update(event, { where: { id: id } })
      .then(async (event) => {
        if(!controller.user.bolManager){
          await Responsible_Event.destroy({
            where: {
              EventId:id
            }
          })
          if(reponsible){
            for(let resp of reponsible){
              await Responsible_Event.create({EventId: id, UserId: resp}).catch((e) => console.log('Erro ao add Resposible: ' + e));
            }
          }
        }
        req.flash('message_sucess', 'Evento atualizado com sucesso')
        req.session.save(() => {
          res.redirect('/meus-eventos')
          return
        })
      })
      .catch((err) => console.log(err))
  }

  static async delete(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'event');

    const event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    controller['eventData'] = event;

    res.render("event/delete", controller)
  }

  static async deletePost(req, res) {
    const { id } = req.body

    if(!(id)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfEventExists = await Event.findOne({raw: true, where: { id: id} })

    if (!(checkIfEventExists)) {
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    if(((new Date(checkIfEventExists['dateEnd'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Não é possível excluir um Evento já encerrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    if(((new Date(checkIfEventExists['date'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Não é possível excluir um Evento já iniciado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    const checkIfSubscritionExists = await Subscription.findOne({raw: true, where: { EventId: id, subscriptionStatus: 1} })

    if ((checkIfSubscritionExists)) {
      req.flash('message', 'Existem inscrições confirmadas para esse evento. Evento não pode ser excluído')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    Event.destroy( { where: { id: id } })
      .then(async (event) => {
        req.flash('message_sucess', 'Evento excluído com sucesso')
        req.session.save(() => {
          res.redirect('/meus-eventos')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Evento não pode ser excluído, verifique se ele possuí registros associados!')
        req.session.save(() => {
          res.redirect('/meus-eventos')
          return
        })
      })
  }

  static async subscription(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'event');

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    
    if(((new Date(event.dateEnd)).getTime() > (new Date()).getTime())){
      event['dateNotClose'] = true;
    }

    if(event['bol_limit']){
      let where = {EventId:event.id,subscriptionStatus:1};
      const count = await Subscription.count({where: where});
      event['countSubscription'] = count;
      if(count >= event.limit)
        event['inLimit'] = true;
    }

    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    controller['dataCongress']= congressData;

    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    let wh = {EventId:id};

    const { data, listInfo } =  await listSub(wh, pag, lim);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    controller['dataColumns'] = ['Participante' , 'E-mail', 'Data da Inscrição','Status','Ações'];
    res.render("event/subscription", controller)

    
  }

  static async subscriptionPost(req, res) {
    const { UserId, EventId, status, page, limit } = req.body

    if(!( UserId && EventId && status && page && limit) || (status > 2 | status < 0)){
      req.flash('message', 'Houve um problema ao realizar avaliação, tente novamente!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfEventExists = await Event.findOne({raw: true, where: { id: EventId} })

    if (!(checkIfEventExists)) {
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfUserExists = await User.findOne({raw: true, where: { id: UserId} })

    if (!(checkIfUserExists)) {
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos/inscricoes/'+EventId+'/?pag='+page+'&lim='+limit)
      })
      return
    }

    if(((new Date(checkIfEventExists['dateEnd'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Não é possível avaliar inscrição de um Evento já encerrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfSubscritionExists = await Subscription.findOne({raw: true, where: { EventId, UserId} })

    if (!(checkIfSubscritionExists)) {
      req.flash('message', 'Inscrição não localizada!')
      req.session.save(() => {
        res.redirect('/meus-eventos/inscricoes/'+EventId+'/?pag='+page+'&lim='+limit)
      })
      return
    }

    const upt = {
      subscriptionStatus: status
    }

    Subscription.update( upt, { where: { EventId, UserId } })
      .then(async (event) => {
        req.flash('message_sucess', 'Inscrição atualizada com sucesso!')
        req.session.save(() => {
          res.redirect('/meus-eventos/inscricoes/'+EventId+'/?pag='+page+'&lim='+limit)
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Houve um problema ao atualizar inscrição!')
        req.session.save(() => {
          res.redirect('/meus-eventos/inscricoes/'+EventId+'/?pag='+page+'&lim='+limit)
          return
        })
      })
  }

  static async participation(req, res) {
    const id = req.params.id
    if(!(id)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    let controller =  await super.dataController(req, res, 'event');

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    
    if(((new Date(event.dateEnd)).getTime() > (new Date()).getTime())){
      event['dateNotClose'] = true;
    }
    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    controller['dataCongress']= congressData;

    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    let wh = {EventId:id,subscriptionStatus:1};

    const { data, listInfo } =  await listSub(wh, pag, lim);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    controller['dataColumns'] = ['Participante' , 'E-mail', 'Data da Inscrição','Status','Ações'];
    res.render("event/participation", controller)
  }

  static async participationPost(req, res) {
    const { UserId, EventId, status, page, limit } = req.body;

    if(!( UserId && EventId && status && page && limit) || (status > 2 | status < 0)){
      req.flash('message', 'Houve um problema ao realizar avaliação, tente novamente!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfEventExists = await Event.findOne({raw: true, where: { id: EventId} })

    if (!(checkIfEventExists)) {
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfUserExists = await User.findOne({raw: true, where: { id: UserId} })

    if (!(checkIfUserExists)) {
      req.flash('message', 'Usuário não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos/participacao/'+EventId+'/?pag='+page+'&lim='+limit)
      })
      return
    }

    if(((new Date(checkIfEventExists['dateEnd'])).getTime() > (new Date()).getTime())){
      req.flash('message', 'Não é possível avaliar participação de um Evento não encerrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }

    const checkIfSubscritionExists = await Subscription.findOne({raw: true, where: { EventId, UserId, subscriptionStatus:1} })

    if (!(checkIfSubscritionExists)) {
      req.flash('message', 'Participação não localizada!')
      req.session.save(() => {
        res.redirect('/meus-eventos/participacao/'+EventId+'/?pag='+page+'&lim='+limit)
      })
      return
    }

    if (checkIfSubscritionExists['participationStatus'] == 1) {
      req.flash('message', 'Participação não localizada!')
      req.session.save(() => {
        res.redirect('/meus-eventos/participacao/'+EventId+'/?pag='+page+'&lim='+limit)
      })
      return
    }

    const upt = {
      participationStatus: status
    }

    Subscription.update( upt, { where: { EventId, UserId } })
      .then(async (event) => {
        req.flash('message_sucess', 'Participação atualizada com sucesso!')
        req.session.save(() => {
          res.redirect('/meus-eventos/participacao/'+EventId+'/?pag='+page+'&lim='+limit)
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Houve um problema ao atualizar participação!')
        req.session.save(() => {
          res.redirect('/meus-eventos/participacao/'+EventId+'/?pag='+page+'&lim='+limit)
          return
        })
      })
  }

  static async exportPdf(req, res) {
    const congress = req.params.congress
    let controller =  await super.dataController(req, res, 'event');
    let congressData =  await Congress.findOne({ raw: true, where: { id:congress }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    let where = {CongressId:congressData['id']};
    if(controller.user.bolManager){
      await super.exportPdf(filename, fields, await listExp(where, controller.user.id), req, res )
    }else{
      await super.exportPdf(filename, fields, await listExp(where), req, res )
    }
    return
  }

  static async exportCsv(req, res) {
    const congress = req.params.congress
    let controller =  await super.dataController(req, res, 'event');
    let congressData =  await Congress.findOne({ raw: true, where: { id:congress }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      req.flash('message', 'Congresso não encontrado!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return
    }
    let where = {CongressId:congressData['id']};
    if(controller.user.bolManager){
      await super.exportCsv(filename, fields, await listExp(where, controller.user.id), req, res )
    }else{
      await super.exportCsv(filename, fields, await listExp(where), req, res )
    }
    return
  }

  static async exportSubscriptionCsv(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    if(!(await validationResponsible(req, res, controller))){
      return
    }
    const id = req.params.id
    let where = {EventId:id};
    await super.exportCsv("inscricao_evento_"+id, fieldsSub, await listSubExp(where), req, res )
    return
  }

  static async exportSubscriptionPdf(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    if(!(await validationResponsible(req, res, controller))){
      return
    }
    const id = req.params.id
    let where = {EventId:id};
    await super.exportPdf("inscricao_evento_"+id, fieldsSub, await listSubExp(where), req, res )
    return
  }

  static async exportParticipationCsv(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    if(!(await validationResponsible(req, res, controller))){
      return
    }
    const id = req.params.id
    let where = {EventId:id,subscriptionStatus:1};
    await super.exportCsv("participacao_evento_"+id, fieldsSub, await listSubExp(where,true), req, res )
    return
  }

  static async exportParticipationPdf(req, res) {
    let controller =  await super.dataController(req, res, 'event');
    if(!(await validationResponsible(req, res, controller))){
      return
    }
    const id = req.params.id
    let where = {EventId:id,subscriptionStatus:1};
    await super.exportPdf("participacao_evento_"+id, fieldsSub, await listSubExp(where,true), req, res )
    return
  }

}



async function list(where = {}, page = 1, limit = 5,  user = false){
  if(user){
    let events = await Responsible_Event.findAll({ raw: true, where:  { UserId: user }, attributes: [sequelize.fn('DISTINCT', sequelize.col('EventId')) ,'EventId']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
    let even = []
    for(let elem of events ){
      even.push(elem['EventId'])
    }
    let congr =  await Event.findAll({ raw: true, where: {id: {[sequelize.Op.in]: even} } , attributes: ['CongressId']})
    let congrss = []
    for(let elem of congr ){
      if( congrss.indexOf(elem['CongressId']) == -1 )
      congrss.push(elem['CongressId'])
    }
    const data =  await Congress.findAll({ raw: true, where: {id: {[sequelize.Op.in]: congrss}}, offset: ((page-1)*limit), order: [['id', 'DESC']],limit , attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
    await Promise.all(data.map(async (element) => {
      element['events'] = await Event.findAll({ raw: true, where: {CongressId:element['id'], id:{[sequelize.Op.in]:even}} , attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
    }));
    const count = await Congress.count({ where: {id: {[sequelize.Op.in]: congrss}}});
    const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
    const next = (total > page) ? page+1 : false
    const beforte = (page > 1) ? page-1 : false
    const group ={}
    group[limit] = true
    const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
    return {data, listInfo};
  }
  else{
    const data =  await Congress.findAll({ raw: true, where, offset: ((page-1)*limit), limit, order: [['id', 'DESC']] , attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
    await Promise.all(data.map(async (element) => {
      element['events'] = await Event.findAll({ raw: true, where: {CongressId:element['id']} , attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
    }));
    const count = await Congress.count();
    const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
    const next = (total > page) ? page+1 : false
    const beforte = (page > 1) ? page-1 : false
    const group ={}
    group[limit] = true
    const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
    return {data, listInfo};
  }
}

async function listExp(where = {} , user = false){
  if(user){
    where['$and'] = sequelize.literal(`exists (
      select 1 from responsible_events where id = EventId and UserId = ${user}
    )`)
  }
  let data =  await Event.findAll({ raw: true, where, attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'],['date','dateEnd'])).catch(e => console.log(e))
  let exportData = [];
  data.map((dat) => {
    exportData.push({
      'Cod': dat['id'],
      'Nome': dat['name'],
      'Data de Início': dat['date'],
      'Data de Termino': dat['dateEnd']
    });
  })
  return exportData;
}

async function listResponsible(){
  const profileIds = await Permission_Profile.findAll({ raw: true, where: sequelize.where(sequelize.literal('numPermission & 22'), '!=',0), attributes: [sequelize.fn('DISTINCT', sequelize.col('ProfileId')) ,'ProfileId']}).then((data) => helpers.formatData(data).map( x => x['ProfileId'])).catch(e => console.log(e));
  const users = await User.findAll({ raw: true, where:  { ProfileId: {[sequelize.Op.in]: profileIds} }, attributes: ['id','firstName','lastName']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
  return users
}

async function listSub(where = {}, page = 1, limit = 5 ){
  const data =  await Subscription.findAll({ raw: true, where: where, offset: ((page-1)*limit), limit, order: [['createdAt', 'DESC']] , attributes: ['subscriptionStatus','participationStatus','createdAt','UserId']}).then((data) => helpers.formatData(data,false,['createdAt'])).catch(e => console.log(e))
  await Promise.all(data.map(async (element) => {
       const user = await User.findOne({raw: true, where: { id:element['UserId'] }});
       element['firstName'] = user['firstName'];
       element['lastName'] = user['lastName'];
       element['email'] = user['email'];
       let subName = 'subscriptionStatus' + element['subscriptionStatus'];
       element[subName] = true;
       let patName = 'participationStatus' + element['participationStatus'];
       element[patName] = true;
    }));
  const count = await Subscription.count({where: where});
  const total = (count > 1 ? (Math.ceil(count/limit)) : 1);
  const next = (total > page) ? page+1 : false
  const beforte = (page > 1) ? page-1 : false
  const group ={}
  group[limit] = true
  const listInfo = {page: page, limit: limit, total:total, count:count, next: next, beforte:beforte, group };
  return {data, listInfo};
}

async function listSubExp(where = {} , part = false){
  let data =  await Subscription.findAll({ raw: true, where, order: [['createdAt', 'DESC']] , attributes: ['subscriptionStatus','participationStatus','createdAt','UserId']}).then((data) => helpers.formatData(data,false,['createdAt'])).catch(e => console.log(e))
  await Promise.all(data.map(async (element) => {
    const user = await User.findOne({raw: true, where: { id:element['UserId'] }});
    element['firstName'] = user['firstName'];
    element['lastName'] = user['lastName'];
    element['email'] = user['email'];
  }));
  let exportData = [];
  data.map((dat) => {
    exportData.push({
      'Nome': (dat['firstName'] + ' ' + dat['lastName']),
      'E-mail': dat['email'],
      'Data da inscrição': dat['createdAt'],
      'Status': status[(part ? dat['participationStatus'] : dat['subscriptionStatus'])]
    });
  })
  return exportData;
}

async function validationResponsible(req, res, controller){
  const id = req.params.id
  if(!(id)){
    req.flash('message', 'Evento não encontrado!')
    req.session.save(() => {
      res.redirect('/meus-eventos')
    })
    return false
  }
  let event = await Event.findOne({raw: true, where: { id }});
  if(!(event)){
    req.flash('message', 'Evento não encontrado!')
    req.session.save(() => {
      res.redirect('/meus-eventos')
    })
    return false
  }

  if(controller.user.bolManager){
    let resp = await Responsible_Event.findOne({raw: true, where: { EventId:id , UserId:  controller.user.id}});
    if(!resp){
      req.flash('message', 'Seu usuário não está vinculado a esse evento!')
      req.session.save(() => {
        res.redirect('/meus-eventos')
      })
      return false
    }
  }
  return true;
}