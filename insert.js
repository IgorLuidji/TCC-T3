require('dotenv').config();
const bcrypt = require('bcryptjs')
const conn = require("./db/conn");
const Permission = require('./models/Permission');
const Profile = require('./models/Profile');
const Permission_Profile = require('./models/Permission_Profile');
const User = require('./models/User');
const Congress = require('./models/Congress');
const Address = require('./models/Address');
const Event = require('./models/Event');
const Responsible_Event = require('./models/Responsible_Event');
const Subscription = require('./models/Subscription');
const Assessment = require('./models/Assessment');

conn
  .sync(
    {force: true}
  )
  .then(() => {
    Permission.findOrCreate({
      where:  {
        name: "congress"
      },
      defaults :{
        descritption: "Congressos"
      }
    });
    Permission.findOrCreate({
      where:  {
        name: "event"
      },
      defaults :{
        descritption: "Evento"
      }
    });
    Permission.findOrCreate({
      where:  {
        name: "reports"
      },
      defaults :{
        descritption: "Relatórios"
      }
    });
    Permission.findOrCreate({
      where:  {
        name: "user"
      },
      defaults :{
        descritption: "Usuário"
      }
    });
    Permission.findOrCreate({
      where:  {
        name: "profile"
      },
      defaults :{
        descritption: "Perfil"
      }
    });
    
    /*
    1 - CREATE
    2 - READ
    4 - UPDATE
    8 - DELETE
    16 - EXPORT
    */ 
    
    Profile.findOrCreate({
      where:  {
        name: "user"
      },
      defaults :{
        descritption: "Usuário"
      }
    }).then(([profile, created]) => {
      
    });
    
    Profile.findOrCreate({
      where:  {
        name: "manager"
      },
      defaults :{
        descritption: "Gerente"
      }
    }).then( async ([profile, created]) => {
        const event = await Permission.findOne({ where: { name: 'event' }});
        await profile.addPermission(event, { through: {numPermission : 22 } });
    });
    
    Profile.findOrCreate({
      where:  {
        name: "admin"
      },
      defaults :{
        descritption: "Administrador"
      }
    }).then(async ([profile, created]) => {
      
      if(created){
        const congress = await Permission.findOne({ where: { name: 'congress' }});      
        await profile.addPermission(congress, { through: {numPermission : 31 } });
    
        const event = await Permission.findOne({ where: { name: 'event' }});
        await profile.addPermission(event, { through: {numPermission : 31 } });
    
        const reports = await Permission.findOne({ where: { name: 'reports' }});
        await profile.addPermission(reports, { through: {numPermission : 31 } });
    
        const user = await Permission.findOne({ where: { name: 'user' }});
        await profile.addPermission(user, { through: {numPermission : 31 } });
    
        const profilePermission = await Permission.findOne({ where: { name: 'profile' }});
        await profile.addPermission(profilePermission, { through: {numPermission : 31 } });

        User.create({
          firstName: 'admin',
          lastName: 'default',
          email: process.env.USER_ADM,
          password: bcrypt.hashSync(process.env.PASS_ADM, bcrypt.genSaltSync(10)),
          birthDate: '2000-01-01',
          ProfileId: profile.id
        });
      } 
    });
  })
  .catch((err) => console.log(err));

