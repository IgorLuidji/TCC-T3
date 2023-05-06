const User = require('../models/User')
const Profile = require('../models/Profile')
const Permission = require('../models/Permission')
const Permission_Profile = require('../models/Permission_Profile')
let remove = ['createdAt', 'updatedAt']
const nodemailer = require('nodemailer');
const configMail = require('../config/mail/config');
const { encrypt, decrypt } = require('./crypto');
const moment = require('moment');

function generateCode (length) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generatePassword (length) {
  let result           = '';
  let characters       = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%&*';
  let charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function diffMinutes (dt2, dt1) {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}


function sendMail (mail,subject,text,formMail = false) {
  if(formMail)
    text = formatMail(text, formMail);
  let transporter = nodemailer.createTransport(configMail.config);
  let mailOptions = {
    from: configMail.user,
    to: mail,
    subject: subject,
    html: text
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });


  function formatMail(text, code){
    if(code == 1){
      text = `<style>body {font-family: "Roboto","Helvetica Neue",Arial,sans-serif;} a {text-decoration: none;color: #FFFFFF;} .link-access{color: #FFFFFF;background-color: #1DC7EA;opacity: 1;border-color: #1DC7EA;display: inline-block;padding: 8px 16px;margin-bottom: 0;font-size: 14px;font-weight: 400;line-height: 1.42857143;text-align: center;white-space: nowrap;vertical-align: middle;touch-action: manipulation;cursor: pointer;user-select: none;background-image: none;border: 1px solid transparent;border-radius: 4px;}</style><body><h1> Olá, </h1><p>Recebemos uma solicitação de recuperação de senha para o seu usuário. Para cadastrá-la, acesse o link "Clique aqui para cadastrar uma nova senha":</p><div class="link-access"> <a href="${text}" target="_blank">Clique aqui para cadastrar uma nova senha</a></div><p>Se esta solicitação não partiu de você, orientamos a atualizar sua senha de cadastro o mais breve possível.</p></body>`;
    }

    return text;
  }
}

function formatData(data, removeUp = true, formatDate, closeDat) {
  return data.map((dat) => {
    let format =[];
    for (const [key, value] of Object.entries(dat)) {
      if(!(removeUp && remove.includes(key.split('.').pop()))){
        if( closeDat && value && closeDat.includes(key.split('.').pop())){
          try{
            if(((new Date(value)).getTime() < (new Date()).getTime())){
              format[(key.split('.').pop() + 'Close')] = true;
            }
          }catch(e){
            console.log(e)
          }
        }

        if( formatDate && value && formatDate.includes(key.split('.').pop())){
          format[(key.split('.').pop())] = (moment(new Date(value)).format('DD/MM/YYYY HH:mm')) ;
        }else{
          format[(key.split('.').pop())] = value;
        }
      }
    }
    return format;
  });
}

function formatPermission(numPermission) {
  let perm = {};
  if(numPermission & 16){
    perm['export'] = true
  }
  if(numPermission & 8){
    perm['delete'] = true
  }
  if(numPermission & 4){
    perm['update'] = true
  }
  if(numPermission & 2){
    perm['read'] = true
  }
  if(numPermission & 1){
    perm['create'] = true
  }
  return perm;
}

async function getPermission (userId) {
  if(!userId)
    return [];
  const user = await User.findOne({ raw: true, include: [{model: Profile, required: true, attributes: ['id']}], where: { id: userId }});
  const permission = await Profile.findAll({ raw: true, include: [{model: Permission, required: true, attributes: [['name' ,'namePermission']]}], where: { id: user.ProfileId }, attributes: [['name' ,'nameProfile']]}).then((data) => formatData(data));

  const permissions ={};
  permission.map((perm) => {
    let numPermission = perm['numPermission'];
    permissions[perm['namePermission']] = formatPermission(numPermission);
  })
  return permissions;
}

async function getUser(userId) {
  if(!userId)
    return [];
  let user = await User.findOne({ raw: true, where: { id: userId }});
  let profile = await Profile.findOne({ raw: true, where: { id: user.ProfileId }});
  if(profile.name == 'manager'){
    user['bolManager'] = true
  }
  return user;
}

async function checkPermission (userId,permission, type){
  if(permission == 'index')
    return true
  const permissionUser = await getPermission(userId);
  if(permissionUser[permission] && permissionUser[permission][type]){
    return true
  }
  return false
}

module.exports = {generateCode, diffMinutes, sendMail, getPermission,formatData,getUser,checkPermission,generatePassword}