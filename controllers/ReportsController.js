const sequelize = require("sequelize");
const User = require('../models/User')
const Permission = require('../models/Permission')
const Congress = require('../models/Congress')
const Assessment = require('../models/Assessment')
const Subscription = require('../models/Subscription')
const Event = require('../models/Event')
const helpers = require("../helpers/helpers");

const BaseController = require('./BaseController')

module.exports = class ReportController extends BaseController {
  static async index(req, res) {
    let controller =  await super.dataController(req, res);
    let congressData = await Congress.findAll({ raw: true, order: [['id', 'DESC']] , attributes: [['id', 'cod'],'name']}).catch(e => console.log(e))
    congressData.map(congress => {
      if(congress['cod'] == parseInt(req.query.c)){
        congress['select'] = true;
      }
    })
    controller['dataCongress']= congressData;
    let eventData = await Event.findAll({ raw: true, order: [['id', 'DESC']] , attributes: [['id', 'cod'],'name','CongressId']}).catch(e => console.log(e))
    controller['dataEvent'] = eventData;
    controller['eventSelect'] = parseInt(req.query.e) ? parseInt(req.query.e) : false

    let codEventos = false;

    if(controller['eventSelect']){
      codEventos = [ controller['eventSelect'] ]
    }

    if(!codEventos && parseInt(req.query.c)){
      codEventos = await Event.findAll({ raw: true, where: {CongressId: parseInt(req.query.c) }, attributes: ['id']}).then((data) => helpers.formatData(data).map( x => x['id'])).catch(e => console.log(e));
    }

    if(codEventos.length){
      controller['dataReports'] = await reports(codEventos,controller['eventSelect']);
    }

    res.render("reports/view", controller)
  }
}

async function reports(codEventos, codEvent = false){
  let reports = {};
  reports['assessment'] = await reportsAssessment(codEventos);
  reports['subscription'] = await reportsSubscription(codEventos);
  if(codEvent){
    reports['comment'] = await reportsComment(codEvent);
  }
  return reports;
}

async function reportsAssessment(codEventos){
  let assessment = await Assessment.findAll({ raw: true, where: { EventId : {[sequelize.Op.in]: codEventos} }, attributes: [
    'grade', 
    [sequelize.fn('COUNT', sequelize.col('grade')), 'gradeCount']
  ],
  group:['grade']
  }).then((data) => helpers.formatData(data)).catch(e => console.log(e))

  let sum = assessment.reduce(function (s, a) {
    return s + a.gradeCount;
  }, 0);

  let pieAssessment = {};

  [1,2,3,4,5].map((grade) =>{
    var result = assessment.find(item => item.grade == grade);
    if(result){
      pieAssessment[grade] = parseFloat(
        (parseFloat((result.gradeCount/sum)).toFixed(4)) * 100
      ).toFixed(2)
    }
    else{
      pieAssessment[grade] = false
    }
  })
  return { assessment: pieAssessment , total: sum }
}

async function reportsSubscription(codEventos){
  let subscription = await Subscription.findAll({ raw: true, where: { EventId : {[sequelize.Op.in]: codEventos} }, attributes: [
    'EventId', 
    [sequelize.fn('COUNT', sequelize.col('EventId')), 'countSub'],
    [sequelize.literal(`COUNT(case when subscriptionStatus = '1' then 1 else null end)`), 'countSubConf'],
    [sequelize.literal(`COUNT(case when participationStatus = '1' then 1 else null end)`), 'countPart'],
  ],
  group:['EventId']
  }).then((data) => helpers.formatData(data)).catch(e => console.log(e))
  await Promise.all(subscription.map(
    async (element) => {
      let event =  await Event.findOne({ raw: true, where: {id:element['EventId']} , attributes: ['name','bol_limit','limit']}).then().catch(e => console.log(e))
      element['nameEvent'] = event['name'];
      element['bolLimitEvent'] = event['bol_limit'];
      element['limitEvent'] = event['limit'];
    }
  ))
  return subscription
}

async function reportsComment(codEvent){
  let assessment = await Assessment.findAll({ raw: true, where: { EventId : codEvent, comment : { [sequelize.Op.not]: '' } }, attributes: {
  include: [
    [
      sequelize.literal(
        `(SELECT CONCAT(firstName, ' ' ,lastName) FROM Users as users WHERE users.id = Assessment.UserId)`
      ),
      "nameUser"
    ],
  ]}
  }).then((data) => (helpers.formatData(data,false,['createdAt','updatedAtr'])).map((dat) => {dat[('grade'+dat.grade)] = true;return dat;})).catch(e => console.log(e))
  return assessment
}