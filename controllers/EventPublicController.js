const sequelize = require("sequelize");
const Congress = require('../models/Congress')
const Event = require('../models/Event')
const Address = require('../models/Address')
const Subscription = require('../models/Subscription')
const Assessment = require('../models/Assessment')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Permission = require('../models/Permission')
const Permission_Profile= require('../models/Permission_Profile')
const BaseController = require('./BaseController')
const helpers = require("../helpers/helpers");
const bcrypt = require('bcryptjs')
const moment = require('moment');
const fs = require('fs');

module.exports = class EventPublicController extends BaseController {

  static async index(req, res) {
    let controller = await super.dataController(req, res, 'event_public');
    let pag =  parseInt(req.query.pag) ? parseInt(req.query.pag) : 1 ;
    let lim =  parseInt(req.query.lim) ? parseInt(req.query.lim) : 5 ;
    lim = lim > 30 ? 30 : lim;
    const { data, listInfo } = await list({}, pag, lim, controller.user.id);
    controller['data'] =  data;
    controller['listInfo'] =  listInfo;
    res.render("event_public/list", controller)
  }

  static async page(req, res) {

    let controller = await super.dataController(req, res, 'event_public');
    controller['login'] = true;

    const id = req.params.id_event
    const id_congress = req.params.id_congress
    if(!(id)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event) ||( id_congress != event['CongressId'])){
      res.render('communs/404', {layout: 'error' });
      return
    }

    if(((new Date(event['date'])).getTime() < (new Date()).getTime())){
      event['close'] = true;
    }

    event.date = (moment(new Date(event.date)).format('HH:mm - DD/MM/YYYY'))
    event.dateEnd = (moment(new Date(event.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    congressData.date = (moment(new Date(congressData.date)).format('HH:mm - DD/MM/YYYY'))
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['dataCongress']= congressData;

    res.render('event_public/page', controller)
  }

  static async congress(req, res) {

    let controller = await super.dataController(req, res, 'event_public');;
    controller['login'] = true;


    const id_congress = req.params.id_congress
    if(!(id_congress)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let congressData =  await Congress.findOne({ raw: true, where: { id:id_congress }});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    congressData.date = (moment(new Date(congressData.date)).format('HH:mm - DD/MM/YYYY'))
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['dataCongress']= congressData;

    if(congressData.bol_address){
      controller['addressData'] = await Address.findOne({raw: true, where: { CongressId:congressData.id }});
    }

    let events = await Event.findAll({ raw: true, where: {CongressId:id_congress} , attributes: ['id','name','date','dateEnd']}).then((data) => helpers.formatData(data,true,['date','dateEnd'])).catch(e => console.log(e))

    controller['events'] = events
    
    res.render('event_public/congress', controller)
  }

  static async subscription(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const id = req.params.id_event
    if(!(id)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    if(((new Date(event['date'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Evento encerrado, você não pode se inscrever!')
      req.session.save(() => {
        res.redirect('/')
      })
      return
    }
    event.date = (moment(new Date(event.date)).format('HH:mm - DD/MM/YYYY'))
    event.dateEnd = (moment(new Date(event.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    congressData.date = (moment(new Date(congressData.date)).format('HH:mm - DD/MM/YYYY'))
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['dataCongress']= congressData;

    res.render("event_public/subscription", controller)
  }

  static async subscriptionPost(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const id = req.params.id_event
    if(!(id)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    if(((new Date(event['date'])).getTime() < (new Date()).getTime())){
      req.flash('message', 'Evento encerrado, você não pode se inscrever!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id}});
    if(!resp){
      const subs = {
        EventId:event['id'],
        UserId:  controller.user.id
      }
      if(!event.bol_limit){
        subs['subscriptionStatus'] = 1
      }

      Subscription.create(subs)
      .then((subs) => {
        req.flash('message_sucess', 'Inscrição realizada com sucesso!')
        req.session.save(() => {
          res.redirect('/eventos')
          return
        })
      })
      .catch((err) => console.log(err))

    }else{
      req.flash('message', 'Você já está inscrito nesse evento!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

  }

  static async certificate(req, res) {

    const pdf = require('dynamic-html-pdf');
    const html = fs.readFileSync('./views/certificate.html', 'utf8');
    let controller =  await super.dataController(req, res, 'event_public');
    const id = req.params.id_event
    if(!(id)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    event.date = (moment(new Date(event.date)).format('HH:mm - DD/MM/YYYY'))
    event.dateEnd = (moment(new Date(event.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    congressData.date = (moment(new Date(congressData.date)).format('HH:mm - DD/MM/YYYY'))
    congressData.dateEnd = (moment(new Date(congressData.dateEnd)).format('HH:mm - DD/MM/YYYY'))
    controller['dataCongress']= congressData;

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id, participationStatus:1, subscriptionStatus:1}});

    if(!resp){
      req.flash('message', 'Você não possui certificado para esse evento.')
      req.session.save(() => {
        res.redirect('/eventos')
        
      })
      return
    }

    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm"
    };

    var document = {
      type: 'buffer', 
      template: html,
      context: {
        controller,
        date: moment(new Date(Date.now())).format('HH:mm - DD/MM/YYYY')
      },
    };
    
    pdf.create(document, options)
      .then(pdfGen => {
        res.setHeader("Content-Type", "text/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=certificado.pdf");
        res.status(200).end(pdfGen);
      })
      .catch(error => {
          console.error(error)
      });

    return
  }

  static async assessment(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const id = req.params.id_event
    if(!(id)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id, participationStatus:1, subscriptionStatus:1}});

    if(!resp){
      req.flash('message', 'Você não pode avaliar esse evento.')
      req.session.save(() => {
        res.redirect('/eventos')
        
      })
      return
    }

    let assessment = await Assessment.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id}});

    if(assessment){
      controller['assessmentData'] = assessment;
    }
    
    if(((new Date(event['dateEnd'])).getTime() > (new Date()).getTime())){
      req.flash('message', 'Evento não encerrado, não pode ser avaliado!')
      req.session.save(() => {
        res.redirect('/')
      })
      return
    }
    controller['eventData'] = event;

    let congressData =  await Congress.findOne({ raw: true, where: { id:event['CongressId'] }, attributes: ['id' , 'name', 'date' , 'dateEnd']});
    if(!(congressData)){
      res.render('communs/404', {layout: 'error' });
      return
    }
    controller['dataCongress']= congressData;

    res.render("event_public/assessment", controller)
  }

  static async assessmentPost(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const {id, grade, comment} = req.body
    if(!(id) || !(grade)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let event = await Event.findOne({raw: true, where: { id }});
    if(!(event)){
      res.render('communs/404', {layout: 'error' });
      return
    }

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id, participationStatus:1, subscriptionStatus:1}});

    if(!resp){
      req.flash('message', 'Você não pode avaliar esse evento.')
      req.session.save(() => {
        res.redirect('/eventos')
        
      })
      return
    }

    let assessment = await Assessment.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id}});

    if(assessment){
      await Assessment.destroy({
        where: { EventId:event['id'] , UserId:  controller.user.id}
      })
    }

    assessment = {
      EventId:event['id'],
      UserId:  controller.user.id,
      grade,
      comment
    }

    Assessment.create(assessment)
      .then(async (assessment) => {
        req.flash('message_sucess', 'Avaliação enviada com sucesso!')
        req.session.save(() => {
          res.redirect('/eventos')
          return
        })
      })
      .catch((err) => console.log(err))

  }

  static async cancel(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const id_event = req.params.id_event
    if(!(id_event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    const event = await Event.findOne({raw: true, where: { id:id_event }});
    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id,subscriptionStatus:0}});
    if(!resp){
      req.flash('message', 'Inscrição não localizada!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }


    controller['eventData'] = event;

    res.render("event_public/cancel", controller)
  }

  static async cancelPost(req, res) {
    let controller =  await super.dataController(req, res, 'event_public');
    const { id } = req.body
    const id_event = id
    if(!(id_event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    const event = await Event.findOne({raw: true, where: { id:id_event }});
    if(!(event)){
      req.flash('message', 'Evento não encontrado!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    let resp = await Subscription.findOne({raw: true, where: { EventId:event['id'] , UserId:  controller.user.id,subscriptionStatus:0}});
    if(!resp){
      req.flash('message', 'Inscrição não localizada!')
      req.session.save(() => {
        res.redirect('/eventos')
      })
      return
    }

    Subscription.destroy( { where: { EventId:event['id'] , UserId:  controller.user.id,subscriptionStatus:0} })
      .then(async (sub) => {
        req.flash('message_sucess', 'Inscrição cancelada com sucesso!')
        req.session.save(() => {
          res.redirect('/eventos')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Sua inscrição não pode ser cancelada! Tenta novamente mais tarde.')
        req.session.save(() => {
          res.redirect('/eventos')
          return
        })
      })
  }

}

async function list(where = {}, page = 1, limit = 5,  user){
  if(user){
    let events = await Subscription.findAll({ raw: true, where:  { UserId: user }, attributes: [sequelize.fn('DISTINCT', sequelize.col('EventId')) ,'EventId', 'subscriptionStatus', 'participationStatus','createdAt']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
    
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
      element['events'].map((eve) => {
        let obj = events.find(o => o['EventId'] === eve['id']);
        let subName = 'subscriptionStatus' + obj['subscriptionStatus']
        let partName = 'participationStatus' + obj['participationStatus']
        eve[subName] = true
        eve[partName] = true
        eve['createdAt'] = (moment(obj['createdAt']).format('DD/MM/YYYY'))
      } )
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
}