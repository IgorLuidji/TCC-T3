const helpers = require("../helpers/helpers");
const data_exporter = require('json2csv').Parser;
const fs = require('fs');
const pdf = require('dynamic-html-pdf');
const html = fs.readFileSync('./views/export.html', 'utf8');
const nameController ={
  profile: {
    'profile':true,
    'name' : 'Perfil',
    'route': '/perfil',
  },
  user: {
    'user':true,
    'name' : 'Usuário',
    'route': '/usuario',
  },
  congress: {
    'congress':true,
    'name' : 'Congresso',
    'route': '/congresso',
  },
  event: {
    'event':true,
    'name' : 'Meus Eventos',
    'route': '/meus-eventos',
  },
  event_public: {
    'event_public':true,
    'name' : 'Eventos',
    'route': '/eventos',
  },
}
module.exports = class BaseController {

  static async dataController(req, res, name) {
    const userId = req.session.userid
    let controller = {};
    controller['user'] = await helpers.getUser(userId);
    controller['permission'] = await helpers.getPermission(userId);
    if (nameController[name]){
      controller['route'] = nameController[name];
    }
    return controller;
  }

  static async exportCsv(filename, fields, exportData, req, res ){
    let json_data = new data_exporter({fields});
    let csv_data = json_data.parse( exportData );
    console.log(exportData)
    console.log(csv_data)
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=" + filename +".csv");
    res.status(200).end(csv_data);
  }

  static async exportPdf(filename, fields, exportData, req, res ){
    let options = {
      format: "A4",
      orientation: "landscape",
      border: "10mm"
    };

    var document = {
      type: 'buffer', 
      template: html,
      context: {
        fields:fields,
        exportData:exportData
      },
    };
    
    pdf.create(document, options)
      .then(pdfGen => {
        res.setHeader("Content-Type", "text/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=" + filename +".pdf");
        res.status(200).end(pdfGen);
      })
      .catch(error => {
          console.error(error)
      });
  }

}
