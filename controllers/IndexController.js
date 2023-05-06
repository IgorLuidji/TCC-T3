const sequelize = require("sequelize");
const User = require('../models/User')
const Permission = require('../models/Permission')
const Congress = require('../models/Congress')
const Event = require('../models/Event')
const Responsible_Event = require('../models/Responsible_Event')
const Subscription = require('../models/Subscription')
const helpers = require("../helpers/helpers");
const BaseController = require('./BaseController')
const moment = require('moment');

module.exports = class IndexController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res);
    let date = false;
    if((new Date(req.query.date)).getTime()){
      date = {
        date:{
          [sequelize.Op.between]: [
            (new Date(req.query.date)),
            (new Date((new Date(req.query.date)).getTime() + 86400000))
          ]
        }
      }
      controller['dateSelect'] = (moment(new Date(req.query.date)).format('DD-MM-YYYY'))
    }
    
    try {
      if(controller.permission.event){
        if(controller.user.bolManager){

          const { data } =  (date) ? await list(controller.user.id,date,1000) : await list(controller.user.id);
          controller['dataEvent'] =  data;
        }
        else{
          const { data } = (date) ? await list(false,date,1000) : await list();
          controller['dataEvent'] =  data;
        }
      }
      const { dataSub } = (date) ? await listSub(controller.user.id,date,1000) : await listSub(controller.user.id);
      controller['dataEventSub'] =  dataSub;
    } catch (error) {
      console.log(error)
    }
    
    res.render("home", controller)
  }

  static async editUser(req, res) {
    let controller =  await super.dataController(req, res)

    res.render("index/user", controller)
  }

  static async editUserPost(req, res) {
    let controller =  await super.dataController(req, res)
    const { firstName, lastName, email,  birthDate } = req.body

    if(!(firstName && lastName && email &&  birthDate )){
      req.flash('message', 'Por favor preencha os dados')
      res.render('index/user',controller)
      return
    }
    
    // email validation
    const checkIfUserExists = await User.findOne({ where: { email: email ,  id: {[sequelize.Op.not]: controller.user['id']} } })

    if (checkIfUserExists) {
      req.flash('message', 'O e-mail já está em uso!')
      res.render('index/user',controller)
      return
    }


    User.update({firstName, lastName, email,  birthDate},{ where: { id: controller.user['id'] } })
      .then((user) => {
        req.flash('message_sucess', 'Usuário editado com sucesso')
        req.session.save(() => {
          res.redirect('/editar-usuario')
          return
        })
      })
      .catch((err) => {
        console.log(err)
        req.flash('message', 'Houve um problema ao tentar editar o usuário, tente novamente mais tarde')
        req.session.save(() => {
          res.redirect('/editar-usuario')
          return
        })
      })
  }
}

async function list(user = false,where = {date:{[sequelize.Op.gt]: (new Date(Date.now()))}}, limit = 5){
  if(user){
    let events = await Responsible_Event.findAll({ raw: true, where:  { UserId: user }, attributes: [sequelize.fn('DISTINCT', sequelize.col('EventId')) ,'EventId']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
    let even = []
    for(let elem of events ){
      even.push(elem['EventId'])
    }
    where['id'] = {[sequelize.Op.in]: even};
    const data =  await Event.findAll({ raw: true, where, limit, order: [['date', 'ASC']] , attributes: ['id','name','date','CongressId','bol_limit','limit']}).then((data) => helpers.formatData(data,true,['date'],['date','dateEnd'])).catch(e => console.log(e))
    await Promise.all(data.map(async (element) => {
        let congress = await Congress.findOne({raw: true, where: { id: element.CongressId}});
        element['congressName'] = congress['name'];
        let where = {EventId:element.id,subscriptionStatus:1};
        const count = await Subscription.count({where: where});
        element['countSubscription'] = count;
    }));
    return {data};
  }
  else{
    const data =  await Event.findAll({ raw: true, where, limit, order: [['date', 'ASC']] , attributes: ['id','name','date','CongressId','bol_limit','limit']}).then((data) => helpers.formatData(data,true,['date'],['date','dateEnd'])).catch(e => console.log(e))
    await Promise.all(data.map(async (element) => {
        let congress = await Congress.findOne({raw: true, where: { id: element.CongressId}});
        element['congressName'] = congress['name'];
        let where = {EventId:element.id,subscriptionStatus:1};
        const count = await Subscription.count({where: where});
        element['countSubscription'] = count;
    }));
    return {data};
  }
}

async function listSub(user = false,where = {date:{[sequelize.Op.gt]: (new Date(Date.now()))}}, limit = 5){
  if(user){
    let events = await Subscription.findAll({ raw: true, where:  { UserId: user, subscriptionStatus: 1 }, attributes: [sequelize.fn('DISTINCT', sequelize.col('EventId')) ,'EventId']}).then((data) => helpers.formatData(data)).catch(e => console.log(e))
    let even = []
    for(let elem of events ){
      even.push(elem['EventId'])
    }
    where['id'] = {[sequelize.Op.in]: even};
    const dataSub =  await Event.findAll({ raw: true, where, limit, order: [['date', 'ASC']] , attributes: ['id','name','date','CongressId','bol_limit','limit']}).then((dataSub) => helpers.formatData(dataSub,true,['date'],['date','dateEnd'])).catch(e => console.log(e))
    await Promise.all(dataSub.map(async (element) => {
        let congress = await Congress.findOne({raw: true, where: { id: element.CongressId}});
        element['congressName'] = congress['name'];
    }));
    return {dataSub};
  }
  return {};
}